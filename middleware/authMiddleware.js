const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Token missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Option 1: If token contains role, use this and skip DB call
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userName = decoded.name;

    // Optional (only if you need full user object)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'Invalid user. Not found.' });

    req.user = user;
    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({ error: isExpired ? 'Session expired. Please login again.' : 'Invalid token.' });
  }
};

// Middleware to authorize roles (admin, supervisor, etc.)
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const role = req.userRole || req.user?.role;
    if (!roles.includes(role)) {
      return res.status(403).json({ error: 'Access denied. Role not authorized.' });
    }
    next();
  };
};
