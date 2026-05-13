const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const registerUser = async (payload) => {
  const { name, email, password, role, phone, department, bio } = payload;
  
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists');
  }

  const user = await User.create({
    name, email, password, role, phone, department, bio
  });

  const token = generateToken(user._id, user.role);
  
  // Return user without password
  const userResponse = user.toObject();
  delete userResponse.password;

  return { user: userResponse, token };
};

const loginUser = async (email, password) => {
  // Select password explicitly since we might exclude it by default in queries in the future
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user._id, user.role);

  const userResponse = user.toObject();
  delete userResponse.password;

  return { user: userResponse, token };
};

module.exports = {
  registerUser,
  loginUser
};
