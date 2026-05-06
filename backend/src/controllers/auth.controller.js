const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt.utils');
const { successResponse, errorResponse } = require('../utils/response.utils');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already registered.', 409);
    }

    // First user becomes admin automatically
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : (role === 'admin' ? 'admin' : 'member');

    const user = await User.create({ name, email, password, role: assignedRole });
    const token = generateToken(user._id, user.role);

    return successResponse(res, { user, token }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account has been deactivated.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const token = generateToken(user._id, user.role);

    // Remove password from output
    const userObj = user.toJSON();

    return successResponse(res, { user: userObj, token }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return successResponse(res, { user }, 'User fetched successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const update = {};
    if (name) update.name = name;
    if (avatar) update.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, { user }, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect.', 400);
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id, user.role);
    return successResponse(res, { token }, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
