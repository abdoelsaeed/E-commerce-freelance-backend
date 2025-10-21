/* eslint-disable no-else-return */
/* eslint-disable prettier/prettier */
/* eslint-disable no-lonely-if */
/* eslint-disable no-undef */
/* eslint-disable node/no-unsupported-features/es-builtins */
/* eslint-disable no-cond-assign */
/* eslint-disable no-unused-vars */
/* eslint-disable no-const-assign */
/* eslint-disable node/no-unsupported-features/es-syntax */
/* eslint-disable no-console */
const AppError = require("./../error/err");

const handelCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handelValidatorErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. [${errors.join("]   [")}]`;
  return new AppError(message, 401);
};

const handleJWTError = () => {
  const message = "Invalid token. Please log in again!";
  return new AppError(message, 401);
};

const handleJWTExpiredError = () => {
  const message = "Your token has expired! Please log in again.";
  return new AppError(message, 401);
};

const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      status: err.status || "error",
      message: err.message,
    });
  } else {
    console.error("Error 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

module.exports = async (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err, name: err.name, message: err.message };
    if (error.name === "CastError") {
      error = handelCastErrorDB(error);
    }
    if (err.code === 11000) {
      error.errmsg = err.errmsg;
      error.code = err.code;
    }
    if (err.name === "ValidationError") {
      error.errors = err.errors;
      error = handelValidatorErrorDB(error);
    }
    if (error.name === "JsonWebTokenError") {
      error = handleJWTError();
    }
    if (error.name === "TokenExpiredError") {
      error = handleJWTExpiredError();
    }
    sendErrorProd(error, req, res);
  }
};
