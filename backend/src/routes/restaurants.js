const express = require('express');
const router = express.Router();
const { getRestaurants, getRestaurant, getMenu } = require('../controllers/restaurantController');
const { authenticate, countryAccess } = require('../middleware/auth');

// All restaurant routes require authentication
router.use(authenticate);
router.use(countryAccess);

// All roles can view restaurants and menu items
router.get('/', getRestaurants);
router.get('/:id', getRestaurant);
router.get('/:id/menu', getMenu);

module.exports = router;
