import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  // Prevent double reply if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Safe logging: log error message without exposing sensitive details to stdout/stderr
  console.error(`[Error Handler] [${req.method} ${req.originalUrl}] Status: ${statusCode} - ${err.message}`);

  const response = {
    success: false,
    error: err.isOperational || config.env !== 'production' 
      ? err.message 
      : 'An unexpected internal server error occurred. Please try again later.'
  };

  // Only include stack trace in development
  if (config.env === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
