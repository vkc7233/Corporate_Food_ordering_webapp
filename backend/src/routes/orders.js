const express = require('express');
const router = express.Router();
const { 
  getOrders, 
  getOrder, 
  createOrder, 
  placeOrder, 
  cancelOrder, 
  updateOrderItems 
} = require('../controllers/orderController');
const { authenticate, authorize, countryAccess } = require('../middleware/auth');
const { validateCreateOrderRequest } = require('../middleware/validation');

router.use(authenticate);
router.use(countryAccess);

// All roles: view and create orders
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', validateCreateOrderRequest, createOrder);
router.put('/:id/items', validateCreateOrderRequest, updateOrderItems);

// Admin and Manager only: place and cancel orders
router.post('/:id/place', authorize('admin', 'manager'), placeOrder);
router.post('/:id/cancel', authorize('admin', 'manager'), cancelOrder);

module.exports = router;
