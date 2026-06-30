const logger = require('./logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      category: logger.categories.HTTP,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      user: req.user ? req.user.id : 'unauthenticated'
    });
  });
  
  next();
};

module.exports = requestLogger;
