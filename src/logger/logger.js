const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../config');

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Development Format: Colorful, readable text
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, category }) => {
    return `[${timestamp}] ${level} ${category ? `[${category}]` : ''}: ${message} ${stack ? `\n${stack}` : ''}`;
  })
);

// Production Format: Structured JSON for log aggregators (ELK, Datadog)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// Future-proof log rotation for production
const fileTransport = new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info'
});

const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error'
});

const logger = winston.createLogger({
  level: config.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: config.env.NODE_ENV === 'development' ? devFormat : prodFormat,
  defaultMeta: { service: 'campusflow-api' },
  transports: [
    new winston.transports.Console(),
    // Uncomment in production or higher phases:
    // fileTransport,
    // errorFileTransport
  ]
});

// Categories for distinct logging
logger.categories = {
  HTTP: 'HTTP_REQUEST',
  AUTH: 'AUTHENTICATION',
  DB: 'DATABASE',
  UPLOAD: 'FILE_UPLOAD',
  JOB: 'BACKGROUND_JOB',
  ERROR: 'SYSTEM_ERROR',
  SECURITY: 'SECURITY_EVENT'
};

module.exports = logger;
