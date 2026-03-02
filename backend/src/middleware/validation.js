/**
 * Input validation middleware for common patterns
 */

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const validatePassword = (password) => {
  if (typeof password !== 'string') return false;
  if (password.length < 6) return false; // Minimum 6 characters
  return true;
};

// Middleware: Validate login request
const validateLoginRequest = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Email is required and must be a valid string.',
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email format is invalid.',
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Password is required and must be a string.',
    });
  }

  // Normalize email to lowercase for consistency
  req.body.email = email.toLowerCase().trim();

  next();
};

// Middleware: Validate order creation request
const validateCreateOrderRequest = (req, res, next) => {
  const { restaurant_id, items } = req.body;

  if (!restaurant_id || typeof restaurant_id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'restaurant_id is required and must be a valid string.',
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'items array is required and must contain at least one item.',
    });
  }

  // Validate each item
  for (const item of items) {
    if (!item.menu_item_id || typeof item.menu_item_id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Each item must have a valid menu_item_id.',
      });
    }

    if (typeof item.quantity !== 'number' || item.quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Each item must have a quantity of at least 1.',
      });
    }
  }

  next();
};

// Middleware: Validate payment method creation
const validatePaymentMethodRequest = (req, res, next) => {
  const { type, details } = req.body;

  if (!type || typeof type !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'type is required and must be a string.',
    });
  }

  const validTypes = ['card', 'upi', 'wallet', 'bank'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `type must be one of: ${validTypes.join(', ')}`,
    });
  }

  if (!details || typeof details !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'details is required and must be an object.',
    });
  }

  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validateLoginRequest,
  validateCreateOrderRequest,
  validatePaymentMethodRequest,
};
