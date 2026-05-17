const jwt = require('jsonwebtoken');
const User = require('../models/User');
const whatsappService = require('./whatsapp');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  whatsappNumber: user.whatsappNumber,
  isWhatsappVerified: user.isWhatsappVerified,
  isActive: user.isActive,
  ...(user.role === 'doctor' && {
    department: user.department,
    specialization: user.specialization,
    consultationFee: user.consultationFee,
    bio: user.bio,
    experienceYears: user.experienceYears,
    credentials: user.credentials,
    workingHours: user.workingHours
  }),
  createdAt: user.createdAt
});

const registerUser = async ({ name, email, password, role, phone, whatsappNumber, department, specialization, consultationFee, bio, experienceYears, credentials, workingHours }) => {
  const existing = await User.findOne({ email });
  if (existing) throw { status: 409, message: 'An account with this email already exists.' };

  const existingWa = await User.findOne({ whatsappNumber });
  if (existingWa) throw { status: 409, message: 'This WhatsApp number is already registered.' };

  const user = await User.create({
    name, email, password, role, phone, whatsappNumber,
    isActive: false,
    isWhatsappVerified: false,
    ...(role === 'doctor' && { department, specialization, consultationFee, bio, experienceYears, credentials, workingHours })
  });

  await whatsappService.sendOtp(whatsappNumber, 'registration');

  return sanitizeUser(user);
};

const verifyOtp = async ({ whatsappNumber, code, purpose }) => {
  const result = await whatsappService.verifyOtp(whatsappNumber, code, purpose);
  if (!result.valid) throw { status: 400, message: result.reason };

  const user = await User.findOne({ whatsappNumber });
  if (!user) throw { status: 404, message: 'No account associated with this WhatsApp number.' };

  user.isWhatsappVerified = true;
  user.isActive = true;
  await user.save();

  return sanitizeUser(user);
};

const resendOtp = async ({ whatsappNumber, purpose }) => {
  const user = await User.findOne({ whatsappNumber });
  if (!user) throw { status: 404, message: 'No account associated with this WhatsApp number.' };

  if (purpose === 'registration' && user.isActive) {
    throw { status: 400, message: 'Account is already verified.' };
  }

  await whatsappService.sendOtp(whatsappNumber, purpose);
  return { message: 'OTP resent successfully.' };
};

const loginUser = async ({ email, password }, res) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    throw { status: 401, message: 'Invalid email or password.' };
  }

  if (!user.isActive) {
    throw { status: 403, message: 'Account is not verified. Please verify your WhatsApp number first.' };
  }

  const token = generateToken(user._id, user.role);
  res.cookie('token', token, cookieOptions);

  return { user: sanitizeUser(user), token };
};

const logoutUser = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

const forgotPassword = async ({ whatsappNumber }) => {
  const user = await User.findOne({ whatsappNumber });
  if (!user) throw { status: 404, message: 'No account associated with this WhatsApp number.' };

  await whatsappService.sendOtp(whatsappNumber, 'password_reset');
  return { message: 'OTP sent to your WhatsApp number.' };
};

const resetPassword = async ({ whatsappNumber, code, newPassword }) => {
  const result = await whatsappService.verifyOtp(whatsappNumber, code, 'password_reset');
  if (!result.valid) throw { status: 400, message: result.reason };

  const user = await User.findOne({ whatsappNumber });
  if (!user) throw { status: 404, message: 'No account associated with this WhatsApp number.' };

  user.password = newPassword;
  await user.save();

  return { message: 'Password reset successfully.' };
};

const getMe = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) throw { status: 404, message: 'User not found.' };
  return sanitizeUser(user);
};

const updateMe = async (userId, updates) => {
  const forbidden = ['password', 'role', 'email', 'isActive', 'isWhatsappVerified'];
  forbidden.forEach(f => delete updates[f]);

  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password');
  if (!user) throw { status: 404, message: 'User not found.' };
  return sanitizeUser(user);
};

module.exports = { registerUser, verifyOtp, resendOtp, loginUser, logoutUser, forgotPassword, resetPassword, getMe, updateMe, sanitizeUser, generateToken, cookieOptions };
