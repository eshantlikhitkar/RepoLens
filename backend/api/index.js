const app = require('./src/app');
const { connectDB } = require('./src/config/db');

// In serverless environment (Vercel), export app directly
module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error('Serverless connection error:', err);
    return res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
};
