/**
 * @description Error handler middleware
 * @param {*} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
module.exports = (err, req, res, next) => {
  const errorResponse = {
    success: false,
  };
  const status = err.isJoi ? 400 : err.httpStatus || 500;

  if (err.name === "JoiValidationError") {
    errorResponse.message = "Validation Error";
    errorResponse.details = err.message?.details?.map((detail) => ({
      field: detail.context.key,
      message: detail.message,
    }));
  } else if (err.name === "TokenExpiredError") {
    errorResponse.message = "Token expired";
  } else {
    // Default error handling
    errorResponse.message = err.message || "An unexpected error occurred";
  }

  // Add stack trace in development environment
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  // Log error for server-side debugging
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: err.stack,
    status,
  });

  errorResponse.code = status;
  res.status(status).json(errorResponse);
};
