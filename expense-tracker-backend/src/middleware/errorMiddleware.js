const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Logs error stack trace for debugging

  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Hide stack trace in production
  });
};

module.exports = errorHandler;