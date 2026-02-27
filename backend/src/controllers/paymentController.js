const pool = require('../config/database');

/**
 * GET /api/payment-methods
 * Get payment methods for the current user
 */
const getPaymentMethods = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      paymentMethods: result.rows,
    });
  } catch (err) {
    console.error('GetPaymentMethods error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
};

/**
 * POST /api/payment-methods
 * Add a new payment method (Admin only)
 */
const createPaymentMethod = async (req, res) => {
  try {
    const { type, details, is_default } = req.body;

    if (!type || !details) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type and details are required.' 
      });
    }

    const validTypes = ['card', 'upi', 'wallet', 'bank'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid payment type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // If setting as default, unset others
    if (is_default) {
      await pool.query(
        'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
        [req.user.id]
      );
    }

    const result = await pool.query(`
      INSERT INTO payment_methods (user_id, type, details, is_default)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.user.id, type, JSON.stringify(details), is_default || false]);

    return res.status(201).json({
      success: true,
      message: 'Payment method added.',
      paymentMethod: result.rows[0],
    });
  } catch (err) {
    console.error('CreatePaymentMethod error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
};

/**
 * PUT /api/payment-methods/:id
 * Update a payment method (Admin only)
 */
const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, details, is_default } = req.body;

    // Verify ownership
    const existing = await pool.query(
      'SELECT * FROM payment_methods WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment method not found.' 
      });
    }

    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied.' 
      });
    }

    // If setting as default, unset others first
    if (is_default) {
      await pool.query(
        'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
        [req.user.id]
      );
    }

    const result = await pool.query(`
      UPDATE payment_methods
      SET 
        type = COALESCE($1, type),
        details = COALESCE($2, details),
        is_default = COALESCE($3, is_default),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [type, details ? JSON.stringify(details) : null, is_default, id]);

    return res.status(200).json({
      success: true,
      message: 'Payment method updated.',
      paymentMethod: result.rows[0],
    });
  } catch (err) {
    console.error('UpdatePaymentMethod error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
};

/**
 * DELETE /api/payment-methods/:id
 * Delete a payment method (Admin only)
 */
const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM payment_methods WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment method not found.' 
      });
    }

    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied.' 
      });
    }

    await pool.query('DELETE FROM payment_methods WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: 'Payment method deleted.',
    });
  } catch (err) {
    console.error('DeletePaymentMethod error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
};

module.exports = { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod };
