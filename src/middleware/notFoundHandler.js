const { AppError } = require('../utils');
const { HTTP_STATUS, MESSAGES } = require('../constants');

const notFoundHandler = (req, res, next) => {
  next(new AppError(HTTP_STATUS.NOT_FOUND, `Can't find ${req.originalUrl} on this server!`));
};

module.exports = notFoundHandler;
