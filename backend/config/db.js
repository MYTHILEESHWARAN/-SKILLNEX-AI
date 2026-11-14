/**
 * SKILLNEX AI — Database Configuration
 * MongoDB connection using Mongoose with resilient error handling.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️ [MongoDB Warning] MONGODB_URI is not defined in environment variables.');
    console.warn('💡 Set MONGODB_URI in backend/.env to connect to your MongoDB database.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });

    console.log(`✅ [MongoDB Connected] Host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ [MongoDB Connection Error] ${error.message}`);
    console.error('💡 Please verify that:');
    console.error('   1. MongoDB server or MongoDB Atlas cluster is reachable.');
    console.error('   2. MONGODB_URI in backend/.env is accurate and valid.');
    console.error('   3. IP whitelist allows your current connection (if using Atlas).');
    
    // Do not crash the entire process; allow backend to run so non-database services/endpoints function
    return null;
  }
};

// Event listeners for connection lifecycle
mongoose.connection.on('connected', () => {
  console.log('📦 [MongoDB Event] Connection established');
});

mongoose.connection.on('error', (err) => {
  console.error(`⚠️ [MongoDB Event Error] ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ [MongoDB Event] Connection disconnected');
});

module.exports = connectDB;
