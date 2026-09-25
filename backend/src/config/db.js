const mongoose = require('mongoose');
const env = require('./env');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI || env.MONGODB_URI;
    console.log('[Database] Connecting to MongoDB...');
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
      })
      .then((mongooseInstance) => {
        console.log(`[Database] MongoDB connected successfully to: ${mongooseInstance.connection.host}/${mongooseInstance.connection.name}`);
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`[Database Error] MongoDB connection failure: ${error.message}`);
    throw error;
  }
}

module.exports = {
  connectDB,
  mongoose,
};
