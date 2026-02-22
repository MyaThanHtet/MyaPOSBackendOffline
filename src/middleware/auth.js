const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { unauthorized, forbidden } = require('../utils/errors');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(unauthorized('Missing or invalid Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    return next();
  } catch (err) {
    return next(unauthorized('Invalid or expired token'));
  }
};

const requireRole = (roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) {
    return next(forbidden('Role is required'));
  }
  if (!roles.includes(role)) {
    return next(forbidden('Insufficient permissions'));
  }
  return next();
};

const requireSuperAdmin = requireRole(['super_admin']);
const requireAdmin = requireRole(['admin', 'super_admin']);

module.exports = {
  authenticate,
  requireRole,
  requireAdmin,
  requireSuperAdmin
};
