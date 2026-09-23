const mongoose = require("mongoose");

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Invalid MongoDB ObjectId
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID",
    });
  }

  // Mongoose schema validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map(
      (error) => error.message
    );

    return res.status(400).json({
      success: false,
      message: messages.join(", "),
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];

    return res.status(409).json({
      success: false,
      message: `${field || "Field"} already exists`,
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Unknown/unexpected error
  return res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
};

module.exports = errorHandler;