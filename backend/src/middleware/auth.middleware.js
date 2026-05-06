const { verifyToken } = require('../utils/jwt.utils');
const User = require('../models/user.model');
const { errorResponse } = require('../utils/response.utils');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return errorResponse(res, 'User not found or deactivated.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired. Please login again.', 401);
    }
    return errorResponse(res, 'Invalid token.', 401);
  }
};

// Authorize by global role (Admin only)
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return errorResponse(res, 'Access denied. Admins only.', 403);
  }
  next();
};

// Authorize project-level role
const projectRole = (...roles) => {
  return (req, res, next) => {
    const project = req.project;
    if (!project) return errorResponse(res, 'Project context missing.', 500);

    // Global admin always passes
    if (req.user.role === 'admin') return next();

    const member = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!member) {
      return errorResponse(res, 'You are not a member of this project.', 403);
    }

    if (!roles.includes(member.role)) {
      return errorResponse(res, 'Insufficient project permissions.', 403);
    }

    req.projectRole = member.role;
    next();
  };
};

module.exports = { protect, adminOnly, projectRole };
