const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');

const register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json(successResponse(
      { user },
      'Registration successful. An OTP has been sent to your WhatsApp number to activate your account.'
    ));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const verifyOtp = async (req, res) => {
  try {
    const user = await authService.verifyOtp(req.body);
    res.status(200).json(successResponse({ user }, 'WhatsApp number verified. Account is now active.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const resendOtp = async (req, res) => {
  try {
    const result = await authService.resendOtp(req.body);
    res.status(200).json(successResponse(null, result.message));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const login = async (req, res) => {
  try {
    const data = await authService.loginUser(req.body, res);
    res.status(200).json(successResponse(data, 'Login successful.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const logout = (req, res) => {
  try {
    authService.logoutUser(res);
    res.status(200).json(successResponse(null, 'Logged out successfully.'));
  } catch (err) {
    res.status(500).json(errorResponse(err.message));
  }
};

const forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json(successResponse(null, result.message));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json(successResponse(null, result.message));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user._id);
    res.status(200).json(successResponse({ user }, 'Profile retrieved successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const updateMe = async (req, res) => {
  try {
    const user = await authService.updateMe(req.user._id, req.body);
    res.status(200).json(successResponse({ user }, 'Profile updated successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

module.exports = { register, verifyOtp, resendOtp, login, logout, forgotPassword, resetPassword, getMe, updateMe };
