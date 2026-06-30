const { HTTP_STATUS } = require('../constants');
const { AppError, ApiResponse } = require('../utils');
const config = require('../config');

// Helper to handle Joi Validation Errors
const handleValidationError = (err) => {
  const message = Object.values(err.details).map(el => el.message).join('. ');
  return new AppError(HTTP_STATUS.BAD_REQUEST, `Invalid input data: ${message}`);
};

// Helper to handle Prisma DB Errors
const handlePrismaError = (err) => {
  if (err.code === 'P2002') {
    const field = err.meta && err.meta.target ? err.meta.target : 'field';
    return new AppError(HTTP_STATUS.BAD_REQUEST, `Duplicate field value: ${field}. Please use another value!`);
  }
  if (err.code === 'P2025') {
    return new AppError(HTTP_STATUS.NOT_FOUND, 'Record not found!');
  }
  return new AppError(HTTP_STATUS.BAD_REQUEST, 'Database operation failed');
};

// Helper to handle JWT Errors
const handleJWTError = () => new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token. Please log in again!');
const handleJWTExpiredError = () => new AppError(HTTP_STATUS.UNAUTHORIZED, 'Your token has expired! Please log in again.');

// Helper to handle Multer File Upload Errors
const handleMulterError = (err) => new AppError(HTTP_STATUS.BAD_REQUEST, `File upload error: ${err.message}`);

const sendErrorDev = (err, req, res) => {
  console.error('ERROR 💥', err);
  
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      error: err,
      stack: err.stack
    });
  }
  
  return res.status(err.statusCode).send(err.message + '<br><pre>' + err.stack + '</pre>');
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(err.statusCode).json(new ApiResponse(err.statusCode, null, err.message));
    }
    return res.status(err.statusCode).send(err.message);
  } 
  
  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥', err);
  if (req.originalUrl.startsWith('/api')) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(new ApiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, null, 'Something went very wrong!'));
  }
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Something went very wrong!');
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  err.message = err.message || 'Internal Server Error';

  if (config.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = Object.assign(err, { message: err.message });

    if (error.isJoi) error = handleValidationError(error);
    if (error.name === 'PrismaClientKnownRequestError') error = handlePrismaError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);

    sendErrorProd(error, req, res);
  }
};

module.exports = globalErrorHandler;
