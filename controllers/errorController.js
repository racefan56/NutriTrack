const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const key = Object.keys(err.keyValue);
  const value = Object.values(err.keyValue);
  const message = `Duplicate Error= ${key}: ${value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token, please login again', 401);

const handleTokenError = () =>
  new AppError('Your login has timedout, please login again', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: Send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // 1) log error
    console.error('ERROR', err);

    // 2) send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  //RETRIEVES THE STATUS CODE FROM THE ERROR OBJECT, IF THERE IS NO ERROR CODE IT RETURNS 500
  err.statusCode = err.statusCode || 500;
  //RETRIEVES THE ERROR STATUS FROM THE ERROR OBJECT, IF THERE IS NO ERROR STATUS IT RETURNS 'ERROR'
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    //RESPOND USING ABOVE VARIABLES
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    error.name = err.name;

    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }

    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }

    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }

    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }

    if (error.name === 'TokenExpiredError') {
      error = handleTokenError();
    }
    //RESPOND USING ABOVE VARIABLES
    sendErrorProd(error, res);
  }
};
