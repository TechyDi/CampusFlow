const logger = require('./logger');

const errorLogger = (err, req, res, next) => {
  logger.error(err.message, {
    category: logger.categories.ERROR,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    user: req.user ? req.user.id : 'unauthenticated'
  });
  
  next(err);
};

module.exports = errorLogger;
