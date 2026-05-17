const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');

const protect = async (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json(errorResponse('Authentication required. Please log in.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) return res.status(401).json(errorResponse('User account no longer exists.'));
    if (!user.isActive) return res.status(403).json(errorResponse('Account is not active. Please verify your WhatsApp number.'));

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(errorResponse('Session expired. Please log in again.'));
    }
    return res.status(401).json(errorResponse('Invalid authentication token.'));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json(errorResponse(`Access denied. Required role(s): ${roles.join(', ')}.`));
  }
  next();
};

module.exports = { protect, authorize };
