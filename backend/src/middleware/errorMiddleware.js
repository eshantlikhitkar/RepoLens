const env = require('../config/env');

function notFoundMiddleware(req, res, next) {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

function errorMiddleware(err, req, res, next) {
  const statusCode = res.statusCode === 200 ? (err.status || 500) : res.statusCode;

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected server error occurred',
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = {
  notFoundMiddleware,
  errorMiddleware,
};
