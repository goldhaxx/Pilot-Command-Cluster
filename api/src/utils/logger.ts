import winston from 'winston';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, printf, colorize } = winston.format;

// Custom format for log messages
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Initialize logger with console transport by default
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        logFormat
      )
    })
  ]
});

// Add file transports only in development environment
if (process.env.NODE_ENV === 'development') {
  const logsDir = path.join(process.cwd(), 'logs');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error'
  }));

  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'api-calls.log'),
    level: 'info'
  }));
}

// Wrapper functions for logging
export const logApiCall = (type: 'incoming' | 'outgoing', data: any) => {
  logger.info(`API ${type.toUpperCase()}`, data);
};

export const logError = (message: string, error: any) => {
  logger.error(message, error);
};

export const logErrorEvent = (error: any, context?: any) => {
  logger.error('Error occurred', { error, context });
};

export const logInfo = (message: string, data?: any) => {
  logger.info(message, data);
};

export default logger; 