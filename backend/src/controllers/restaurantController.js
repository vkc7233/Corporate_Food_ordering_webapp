const pool = require('../config/database');

/**
 * GET /api/restaurants
 * Get all restaurants (filtered by country for non-admin users)
 */
const getRestaurants = async (req, res) => {
  try {
    let query = `
      SELECT r.*, 
        COUNT(mi.id) as menu_item_count
      FROM restaurants r
      LEFT JOIN menu_items mi ON mi.restaurant_id = r.id AND mi.is_available = true
      WHERE r.is_active = true
    `;
    const params = [];

    // Apply country filter for non-admin users
    if (req.countryFilter) {
      params.push(req.countryFilter);
      query += ` AND r.country = $${params.length}`;
    }

    query += ' GROUP BY r.id ORDER BY r.name';

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      restaurants: result.rows,
    });
  } catch (err) {
    console.error('GetRestaurants error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
};

/**
 * GET /api/restaurants/:id
 * Get single restaurant with its menu
 */
const getRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch restaurant
    const restaurantResult = await pool.query(
      'SELECT * FROM restaurants WHERE id = $1 AND is_active = true',
      [id]
    );

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found.' 
      });
    }

    const restaurant = restaurantResult.rows[0];

    // Country-based access check for non-admin
    if (req.countryFilter && restaurant.country !== req.countryFilter) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. This restaurant is not in your region.' 
      });
    }

    // Fetch menu items
    const menuResult = await pool.query(
      'SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY category, name',
      [id]
    );

    // Group menu items by category
    const menuByCategory = menuResult.rows.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      restaurant: {
        ...restaurant,
        menu: menuResult.rows,
        menuByCategory,
      },
    });
  } catch (err) {
    console.error('GetRestaurant error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
};

/**
 * GET /api/restaurants/:id/menu
 * Get only menu items for a restaurant
 */
const getMenu = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify restaurant exists and user has country access
    const restaurantResult = await pool.query(
      'SELECT * FROM restaurants WHERE id = $1 AND is_active = true',
      [id]
    );

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found.' 
      });
    }

    if (req.countryFilter && restaurantResult.rows[0].country !== req.countryFilter) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. This restaurant is not in your region.' 
      });
    }

    const menuResult = await pool.query(
      'SELECT * FROM menu_items WHERE restaurant_id = $1 AND is_available = true ORDER BY category, name',
      [id]
    );

    return res.status(200).json({
      success: true,
      menu: menuResult.rows,
      restaurant: restaurantResult.rows[0],
    });
  } catch (err) {
    console.error('GetMenu error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
};

module.exports = { getRestaurants, getRestaurant, getMenu };
