// lib/middleware.js
// Authentication and authorization middleware

const { getUserFromToken, ownsDealership, ownsVehicle, findDealershipById } = require('./auth');
const { mockData } = require('./db');

// Extract and verify token from request
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (!user.is_active) {
    return res.status(401).json({ error: 'Account suspended' });
  }

  // Attach user to request
  req.user = user;
  
  if (next) {
    return next();
  }
  
  return true;
};

// Role authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden - insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
      });
    }

    if (next) {
      return next();
    }
    
    return true;
  };
};

// Admin-only middleware
const adminOnly = (req, res, next) => {
  const result = authenticate(req, res);
  if (result !== true) return result;
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  if (next) {
    return next();
  }
  
  return true;
};

// Ownership check middleware for dealership vehicles
const requireOwnership = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      if (next) return next();
      return true;
    }

    // Dealership can only access their own vehicles
    if (req.user.role === 'dealership') {
      const vehicleId = req.params?.[paramName] || req.query?.[paramName] || req.body?.id;
      
      if (!vehicleId) {
        if (next) return next(); // No specific resource being accessed
        return true;
      }

      if (!ownsVehicle(req.user.id, vehicleId)) {
        return res.status(403).json({ error: 'You can only manage your own vehicles' });
      }
    }

    // Customers don't have ownership
    if (req.user.role === 'customer') {
      return res.status(403).json({ error: 'Customers cannot modify vehicles' });
    }

    if (next) {
      return next();
    }
    
    return true;
  };
};

// Middleware wrapper for Next.js API routes
const withAuth = (handler, ...allowedRoles) => {
  return async (req, res) => {
    // Authenticate
    const authResult = authenticate(req, res);
    if (authResult !== true) return authResult;

    // Authorize role
    if (allowedRoles.length > 0) {
      const authzResult = authorize(...allowedRoles)(req, res);
      if (authzResult !== true) return authzResult;
    }

    // Call handler
    return handler(req, res);
  };
};

// Middleware for admin-only routes
const withAdmin = (handler) => {
  return async (req, res) => {
    const result = adminOnly(req, res);
    if (result !== true) return result;
    return handler(req, res);
  };
};

module.exports = {
  authenticate,
  authorize,
  adminOnly,
  requireOwnership,
  withAuth,
  withAdmin,
  extractToken,
};
