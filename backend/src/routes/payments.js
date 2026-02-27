const express = require('express');
const router = express.Router();
const { 
  getPaymentMethods, 
  createPaymentMethod, 
  updatePaymentMethod, 
  deletePaymentMethod 
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// All roles can view their own payment methods
router.get('/', getPaymentMethods);

// Only Admin can add/update/delete payment methods
router.post('/', authorize('admin'), createPaymentMethod);
router.put('/:id', authorize('admin'), updatePaymentMethod);
router.delete('/:id', authorize('admin'), deletePaymentMethod);

module.exports = router;
