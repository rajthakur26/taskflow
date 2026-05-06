const User = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/response.utils');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return successResponse(res, { users }, 'Users fetched');
  } catch (err) {
    next(err);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, { user }, 'User fetched');
  } catch (err) {
    next(err);
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return errorResponse(res, 'Invalid role', 400);
    }
    if (req.params.id === req.user._id.toString()) {
      return errorResponse(res, 'Cannot change your own role', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id, { role }, { new: true }
    );
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, { user }, 'User role updated');
  } catch (err) {
    next(err);
  }
};

// @desc    Deactivate/activate user (Admin only)
// @route   PUT /api/users/:id/status
// @access  Private (Admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return errorResponse(res, 'Cannot change your own status', 400);
    }
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    user.isActive = !user.isActive;
    await user.save();
    return successResponse(res, { user }, `User ${user.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
};

// @desc    Search users by email (for adding to projects)
// @route   GET /api/users/search?email=xxx
// @access  Private
const searchUsers = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return errorResponse(res, 'Email query required', 400);

    const users = await User.find({
      email: { $regex: email, $options: 'i' },
      isActive: true,
    }).limit(10).select('name email avatar role');

    return successResponse(res, { users }, 'Users found');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUserRole, toggleUserStatus, searchUsers };
