const User = require('../models/User');

const getDoctors = async (filters = {}) => {
  const query = { role: 'doctor' };
  
  if (filters.department) {
    query.department = filters.department;
  }
  
  // Exclude password and sensitive info
  const doctors = await User.find(query).select('-password -role -createdAt -updatedAt');
  return doctors;
};

module.exports = {
  getDoctors
};
