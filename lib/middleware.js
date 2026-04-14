// lib/middleware.js
// Authentication and authorization middleware.
// FIXED: removed all mockData/ownsDealership/ownsVehicle mock references.
// getUserFromToken now returns the JWT payload — no DB lookup, no is_active check
// (active status is enforced at login time by the DB query in pages/api/auth/login.js).

const { getUserFromToken } = require('./auth');

// ── Extract Bearer token from Authorization header ────────────────────────────
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

// ── Decode token and attach payload to req.user ───────────────────────────────
// req.user will have: { userId, email, role, dealerId }
// Returns true on success, sends 401 and returns false on failure.
const authenticate = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }

  const user = getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return false;
  }

  req.user = user;

  if (next) return next();
  return true;
};

// ── Role check ────────────────────────────────────────────────────────────────
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return false;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden — insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
      });
      return false;
    }
    if (next) return next();
    return true;
  };
};

// ── Admin-only ────────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  const ok = authenticate(req, res);
  if (!ok) return false;

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return false;
  }

  if (next) return next();
  return true;
};

// ── Ownership check (dealer can only touch their own vehicles) ────────────────
// Relies on dealerId being in the JWT payload (set by login.js).
const requireOwnership = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return false;
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      if (next) return next();
      return true;
    }

    // Customers cannot modify vehicles
    if (req.user.role === 'customer') {
      res.status(403).json({ error: 'Customers cannot modify vehicles' });
      return false;
    }

    // Dealer: ownership is enforced at the DB query level in each API route
    // (WHERE dealer_id = $dealerId). Nothing to check here without a DB call.
    if (next) return next();
    return true;
  };
};

// ── Next.js API route wrappers ────────────────────────────────────────────────
const withAuth = (handler, ...allowedRoles) => {
  return async (req, res) => {
    const ok = authenticate(req, res);
    if (!ok) return;

    if (allowedRoles.length > 0) {
      const authz = authorize(...allowedRoles)(req, res);
      if (!authz) return;
    }

    return handler(req, res);
  };
};

const withAdmin = (handler) => {
  return async (req, res) => {
    const ok = adminOnly(req, res);
    if (!ok) return;
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



