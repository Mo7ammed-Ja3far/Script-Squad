const mongoose = require('mongoose');

/**
 * Connect to MongoDB Cluster
 */
const connectDB = async () => {
  try {
    // Fallback to environment variable for production security
    const uri = process.env.MONGO_URI || 'mongodb+srv://projectsdb:esu1y8kbdepigPuo@cluster0.qegsyq4.mongodb.net/ClinicFlow';
    
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
