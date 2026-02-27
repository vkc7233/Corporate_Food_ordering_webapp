const pool = require('./database');
const bcrypt = require('bcryptjs');

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear existing data in order
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM payment_methods');
    await client.query('DELETE FROM menu_items');
    await client.query('DELETE FROM restaurants');
    await client.query('DELETE FROM users');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Seed Users
    const usersResult = await client.query(`
      INSERT INTO users (name, email, password, role, country) VALUES
        ('Nick Fury', 'nick@shield.com', $1, 'admin', NULL),
        ('Captain Marvel', 'marvel@shield.com', $1, 'manager', 'India'),
        ('Captain America', 'america@shield.com', $1, 'manager', 'America'),
        ('Thanos', 'thanos@shield.com', $1, 'member', 'India'),
        ('Thor', 'thor@shield.com', $1, 'member', 'India'),
        ('Travis', 'travis@shield.com', $1, 'member', 'America')
      RETURNING id, name, email, role, country
    `, [hashedPassword]);

    console.log('✅ Users seeded:', usersResult.rows.map(u => u.name));

    // Seed Restaurants - India
    const restaurantsResult = await client.query(`
      INSERT INTO restaurants (name, description, cuisine, address, country, image_url) VALUES
        ('Spice Garden', 'Authentic Indian cuisine with rich flavors', 'Indian', 'MG Road, Bangalore, India', 'India', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400'),
        ('Taj Darbar', 'Royal Mughlai dining experience', 'Mughlai', 'Connaught Place, New Delhi, India', 'India', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=400'),
        ('Dosa Palace', 'South Indian delicacies and more', 'South Indian', 'Anna Nagar, Chennai, India', 'India', 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400'),
        ('The Burger Joint', 'Classic American burgers done right', 'American', '5th Avenue, New York, USA', 'America', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
        ('Pizza Republic', 'New York style pizza since 1985', 'Italian-American', 'Broadway, New York, USA', 'America', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'),
        ('Texas BBQ House', 'Slow smoked BBQ and southern comfort food', 'BBQ', 'Main Street, Austin, TX, USA', 'America', 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400')
      RETURNING id, name, country
    `);

    console.log('✅ Restaurants seeded:', restaurantsResult.rows.map(r => `${r.name} (${r.country})`));

    // Get restaurant IDs for menu seeding
    const restaurants = {};
    restaurantsResult.rows.forEach(r => {
      restaurants[r.name] = r.id;
    });

    // Seed Menu Items
    await client.query(`
      INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
        -- Spice Garden
        ($1, 'Butter Chicken', 'Creamy tomato-based chicken curry', 320.00, 'Main Course'),
        ($1, 'Palak Paneer', 'Fresh spinach with cottage cheese', 280.00, 'Main Course'),
        ($1, 'Biryani', 'Aromatic basmati rice with spices', 350.00, 'Rice'),
        ($1, 'Garlic Naan', 'Soft leavened bread with garlic', 60.00, 'Bread'),
        ($1, 'Mango Lassi', 'Sweet yogurt mango drink', 120.00, 'Beverages'),
        
        -- Taj Darbar
        ($2, 'Mutton Rogan Josh', 'Kashmiri style slow-cooked mutton', 480.00, 'Main Course'),
        ($2, 'Dal Makhani', 'Slow cooked black lentils in butter', 260.00, 'Dal'),
        ($2, 'Tandoori Chicken', 'Clay oven roasted marinated chicken', 420.00, 'Starters'),
        ($2, 'Shahi Paneer', 'Cottage cheese in rich cream sauce', 310.00, 'Main Course'),
        ($2, 'Kulfi', 'Traditional Indian frozen dessert', 130.00, 'Desserts'),
        
        -- Dosa Palace
        ($3, 'Masala Dosa', 'Crispy crepe with spiced potato filling', 180.00, 'Main'),
        ($3, 'Idli Sambar', 'Steamed rice cakes with lentil soup', 120.00, 'Breakfast'),
        ($3, 'Uttapam', 'Thick rice pancake with toppings', 150.00, 'Main'),
        ($3, 'Filter Coffee', 'South Indian drip coffee', 60.00, 'Beverages'),
        ($3, 'Vada Sambar', 'Crispy lentil donuts with sambar', 110.00, 'Snacks'),
        
        -- The Burger Joint
        ($4, 'Classic Cheeseburger', 'Beef patty with cheddar and fresh veggies', 12.99, 'Burgers'),
        ($4, 'BBQ Bacon Burger', 'Smoky bacon with BBQ sauce', 15.99, 'Burgers'),
        ($4, 'Veggie Supreme', 'Plant-based patty with avocado', 13.99, 'Burgers'),
        ($4, 'Loaded Fries', 'Crispy fries with cheese sauce', 7.99, 'Sides'),
        ($4, 'Chocolate Milkshake', 'Thick creamy chocolate shake', 6.99, 'Beverages'),
        
        -- Pizza Republic
        ($5, 'Margherita', 'Classic tomato sauce with fresh mozzarella', 14.99, 'Pizzas'),
        ($5, 'Pepperoni', 'Generous pepperoni with marinara', 16.99, 'Pizzas'),
        ($5, 'BBQ Chicken Pizza', 'Grilled chicken with BBQ base', 17.99, 'Pizzas'),
        ($5, 'Garlic Breadsticks', 'Freshly baked buttery breadsticks', 5.99, 'Sides'),
        ($5, 'Caesar Salad', 'Crispy romaine with Caesar dressing', 9.99, 'Salads'),
        
        -- Texas BBQ House
        ($6, 'Brisket Platter', '1lb slow smoked beef brisket', 22.99, 'BBQ'),
        ($6, 'Pulled Pork Sandwich', 'Tender pulled pork on brioche bun', 13.99, 'Sandwiches'),
        ($6, 'Baby Back Ribs', 'Fall-off-the-bone pork ribs', 28.99, 'BBQ'),
        ($6, 'Coleslaw', 'Creamy homemade coleslaw', 4.99, 'Sides'),
        ($6, 'Peach Cobbler', 'Warm southern peach dessert', 7.99, 'Desserts')
    `, [
      restaurants['Spice Garden'],
      restaurants['Taj Darbar'],
      restaurants['Dosa Palace'],
      restaurants['The Burger Joint'],
      restaurants['Pizza Republic'],
      restaurants['Texas BBQ House'],
    ]);

    console.log('✅ Menu items seeded');

    // Seed Payment Methods for all users
    const allUsers = await client.query('SELECT id, name, country, role FROM users');
    
    for (const user of allUsers.rows) {
      if (user.role === 'admin') {
        // Admin gets multiple payment methods
        await client.query(`
          INSERT INTO payment_methods (user_id, type, details, is_default) VALUES
            ($1, 'card', '{"last4": "4242", "brand": "Visa", "holder": "Nick Fury"}', true),
            ($1, 'wallet', '{"provider": "PayPal", "email": "nick@shield.com"}', false)
        `, [user.id]);
      } else if (user.country === 'India') {
        await client.query(`
          INSERT INTO payment_methods (user_id, type, details, is_default) VALUES
            ($1, 'upi', '{"upi_id": "${user.name.toLowerCase().replace(' ', '.')}@upi"}', true),
            ($1, 'card', '{"last4": "1234", "brand": "RuPay", "holder": "${user.name}"}', false)
        `, [user.id]);
      } else {
        await client.query(`
          INSERT INTO payment_methods (user_id, type, details, is_default) VALUES
            ($1, 'card', '{"last4": "5678", "brand": "Mastercard", "holder": "${user.name}"}', true)
        `, [user.id]);
      }
    }

    console.log('✅ Payment methods seeded');

    await client.query('COMMIT');
    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📋 Login Credentials (password: password123)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:   nick@shield.com     (Global Access)');
    console.log('Manager: marvel@shield.com   (India Only)');
    console.log('Manager: america@shield.com  (America Only)');
    console.log('Member:  thanos@shield.com   (India Only)');
    console.log('Member:  thor@shield.com     (India Only)');
    console.log('Member:  travis@shield.com   (America Only)');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
