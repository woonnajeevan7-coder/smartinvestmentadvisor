/**
 * Centralized error handling middleware.
 * Catches all errors thrown within express routes and formats standard secure JSON error responses.
 */
export const errorHandler = (err, req, res, next) => {
  console.error("🚨 Centralized Error Logged:", err.stack || err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: {
      message: statusCode === 500 ? "An unexpected error occurred on the server. Please try again later." : message,
      status: statusCode
    }
  });
};
