/**
 * Global Express error handling middleware.
 * Formats errors and sends structured JSON responses.
 * Hides stack traces in production to prevent information exposure.
 */
export default function errorHandler(err, req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.statusCode || err.status || 500;
  
  // In production, mask generic 500 errors. In debugging mode, expose the raw error message.
  let message = err.message || 'An unexpected internal server error occurred';
  if (isProduction && statusCode === 500) {
    message = 'An unexpected internal server error occurred';
  }

  // Log error to console with full stack trace for debugging
  console.error(`[Error Handler] Caught error: ${err.name || 'Error'}`);
  console.error(err.stack || err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { stack: err.stack, error: err })
  });
}
