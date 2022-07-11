class AppError extends Error {
  constructor(message, statusCode) {
    //SUPER is the parent class (Error in this case)
    console.log(message);
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.data = message;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
