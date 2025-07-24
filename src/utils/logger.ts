import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, align } = winston.format;

// Define log format
const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} [${level}]: ${message}${metaString}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'finanzia-backend' },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
    }),
    // Write all logs to `combined.log`
    new winston.transports.File({ filename: path.join('logs', 'combined.log') }),
  ],
});

// If we're not in production, log to the console with colorized output
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        align(),
        logFormat
      ),
    })
  );
}

// Create a stream object with a 'write' function that will be used by morgan
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export { logger, stream };
