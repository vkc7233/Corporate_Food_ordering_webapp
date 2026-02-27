const jwt = require('jsonwebtoken');

/**
 * Middleware: Verify JWT token and attach user to request
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

/**
 * Middleware factory: Restrict access by role(s)
 * Usage: authorize('admin') or authorize('admin', 'manager')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
};

/**
 * Middleware: Enforce country-based data isolation
 * - Admin: access to all countries
 * - Manager/Member: access only to their own country
 * 
 * Attaches req.countryFilter to be used in queries
 */
const countryAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  if (req.user.role === 'admin') {
    // Admin sees everything - no filter applied
    req.countryFilter = null;
  } else {
    // Manager and member only see their country
    req.countryFilter = req.user.country;
  }

  next();
};

/**
 * Middleware: Validate that a target country matches the user's access rights
 * Used when creating resources that belong to a country
 */
const validateCountryAccess = (getCountry) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }
    
    const targetCountry = getCountry(req);
    
    if (targetCountry && targetCountry !== req.user.country) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. You can only access data for ${req.user.country}.` 
      });
    }
    
    next();
  };
};

module.exports = { authenticate, authorize, countryAccess, validateCountryAccess };
