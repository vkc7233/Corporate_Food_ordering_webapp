const pool = require('../config/database');

/**
 * GET /api/orders
 * Get orders for current user (or all orders for admin)
 */
const getOrders = async (req, res) => {
  try {
    let query = `
      SELECT 
        o.*,
        u.name as user_name,
        r.name as restaurant_name,
        r.country as restaurant_country,
        pm.type as payment_type,
        pm.details as payment_details,
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'name', mi.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', (oi.quantity * oi.unit_price)
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      JOIN restaurants r ON r.id = o.restaurant_id
      LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE 1=1
    `;
    const params = [];

    // Non-admin users only see their own orders
    if (req.user.role !== 'admin') {
      params.push(req.user.id);
      query += ` AND o.user_id = $${params.length}`;
    }

    // Country filter for non-admin
    if (req.countryFilter) {
      params.push(req.countryFilter);
      query += ` AND o.country = $${params.length}`;
    }

    // Filter by status if provided
    if (req.query.status) {
      params.push(req.query.status);
      query += ` AND o.status = $${params.length}`;
    }

    query += ' GROUP BY o.id, u.name, r.name, r.country, pm.type, pm.details ORDER BY o.created_at DESC';

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      orders: result.rows,
    });
  } catch (err) {
    console.error('GetOrders error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
};

/**
 * GET /api/orders/:id
 * Get single order details
 */
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        o.*,
        u.name as user_name,
        r.name as restaurant_name,
        r.country as restaurant_country,
        pm.type as payment_type,
        pm.details as payment_details,
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'name', mi.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', (oi.quantity * oi.unit_price)
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      JOIN restaurants r ON r.id = o.restaurant_id
      LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE o.id = $1
      GROUP BY o.id, u.name, r.name, r.country, pm.type, pm.details
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found.' 
      });
    }

    const order = result.rows[0];

    // Check ownership (members can only see their own orders)
    if (req.user.role === 'member' && order.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied.' 
      });
    }

    // Country access check
    if (req.countryFilter && order.country !== req.countryFilter) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. This order is not in your region.' 
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    console.error('GetOrder error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
};

/**
 * POST /api/orders
 * Create a new cart/order
 */
const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { restaurant_id, items, notes } = req.body;

    if (!restaurant_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Restaurant ID and at least one item are required.' 
      });
    }

    // Verify restaurant exists and get its country
    const restaurantResult = await client.query(
      'SELECT * FROM restaurants WHERE id = $1 AND is_active = true',
      [restaurant_id]
    );

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found.' 
      });
    }

    const restaurant = restaurantResult.rows[0];

    // Country access check
    if (req.countryFilter && restaurant.country !== req.countryFilter) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only order from restaurants in your region.' 
      });
    }

    await client.query('BEGIN');

    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders (user_id, restaurant_id, status, country, notes)
      VALUES ($1, $2, 'cart', $3, $4)
      RETURNING *
    `, [req.user.id, restaurant_id, restaurant.country, notes || null]);

    const order = orderResult.rows[0];

    // Validate and insert items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await client.query(
        'SELECT * FROM menu_items WHERE id = $1 AND restaurant_id = $2 AND is_available = true',
        [item.menu_item_id, restaurant_id]
      );

      if (menuItem.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `Menu item ${item.menu_item_id} not found in this restaurant.` 
        });
      }

      const menuItemData = menuItem.rows[0];
      const quantity = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(menuItemData.price);

      const orderItemResult = await client.query(`
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [order.id, item.menu_item_id, quantity, unitPrice]);

      orderItems.push({
        ...orderItemResult.rows[0],
        name: menuItemData.name,
      });

      totalAmount += quantity * unitPrice;
    }

    // Update total amount
    await client.query(
      'UPDATE orders SET total_amount = $1 WHERE id = $2',
      [totalAmount.toFixed(2), order.id]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      order: {
        ...order,
        total_amount: totalAmount.toFixed(2),
        items: orderItems,
        restaurant_name: restaurant.name,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('CreateOrder error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  } finally {
    client.release();
  }
};

/**
 * POST /api/orders/:id/place
 * Checkout and place an order (Admin and Manager only)
 */
const placeOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { payment_method_id } = req.body;

    if (!payment_method_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment method is required to place an order.' 
      });
    }

    // Get order
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found.' 
      });
    }

    const order = orderResult.rows[0];

    // Country access check
    if (req.countryFilter && order.country !== req.countryFilter) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. This order is not in your region.' 
      });
    }

    if (order.status !== 'cart') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot place order. Current status: ${order.status}` 
      });
    }

    // Verify payment method belongs to the user placing order OR admin
    const pmResult = await client.query(
      'SELECT * FROM payment_methods WHERE id = $1',
      [payment_method_id]
    );

    if (pmResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment method not found.' 
      });
    }

    if (pmResult.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'This payment method does not belong to you.' 
      });
    }

    await client.query('BEGIN');

    const updated = await client.query(`
      UPDATE orders 
      SET status = 'placed', payment_method_id = $1, placed_at = NOW(), updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [payment_method_id, id]);

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Order placed successfully!',
      order: updated.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PlaceOrder error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  } finally {
    client.release();
  }
};

/**
 * POST /api/orders/:id/cancel
 * Cancel an order (Admin and Manager only)
 */
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found.' 
      });
    }

    const order = orderResult.rows[0];

    // Country access check
    if (req.countryFilter && order.country !== req.countryFilter) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. This order is not in your region.' 
      });
    }

    if (['cancelled', 'delivered'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot cancel order with status: ${order.status}` 
      });
    }

    const updated = await pool.query(`
      UPDATE orders SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      order: updated.rows[0],
    });
  } catch (err) {
    console.error('CancelOrder error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
};

/**
 * PUT /api/orders/:id/items
 * Update items in a cart order
 */
const updateOrderItems = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { items } = req.body;

    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found.' 
      });
    }

    const order = orderResult.rows[0];

    if (order.status !== 'cart') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only modify orders in cart status.' 
      });
    }

    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied.' 
      });
    }

    await client.query('BEGIN');

    // Remove all existing items
    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await client.query(
        'SELECT * FROM menu_items WHERE id = $1 AND restaurant_id = $2',
        [item.menu_item_id, order.restaurant_id]
      );

      if (menuItem.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `Menu item ${item.menu_item_id} not found.` 
        });
      }

      const quantity = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(menuItem.rows[0].price);

      const oi = await client.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES ($1, $2, $3, $4) RETURNING *',
        [id, item.menu_item_id, quantity, unitPrice]
      );

      orderItems.push({ ...oi.rows[0], name: menuItem.rows[0].name });
      totalAmount += quantity * unitPrice;
    }

    await client.query(
      'UPDATE orders SET total_amount = $1, updated_at = NOW() WHERE id = $2',
      [totalAmount.toFixed(2), id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Order updated.',
      order: { ...order, total_amount: totalAmount.toFixed(2), items: orderItems },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('UpdateOrderItems error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  } finally {
    client.release();
  }
};

module.exports = { getOrders, getOrder, createOrder, placeOrder, cancelOrder, updateOrderItems };
