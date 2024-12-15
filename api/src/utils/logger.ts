import winston from 'winston';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Custom format for file output
const fileFormat = winston.format.printf(info => {
  const { timestamp, level, message, ...metadata } = info;
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...metadata
  }, null, 2);
});

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
console.log('Logs directory path:', logsDir);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Directory exists:', fs.existsSync(logsDir));

// Try to write a test file to verify permissions
if (process.env.NODE_ENV === 'development') {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const testPath = path.join(logsDir, 'test.log');
    fs.writeFileSync(testPath, 'Test log entry\n');
    console.log('Successfully wrote test file to:', testPath);
  } catch (error) {
    console.error('Failed to write test file:', error);
  }
}

// Create base logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        consoleFormat
      )
    })
  ]
});

// Add file transports only in development environment
if (process.env.NODE_ENV === 'development') {
  // Error log file
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: combine(
      timestamp(),
      fileFormat
    )
  }));

  // API calls log file - captures info and above
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'api-calls.log'),
    level: 'info',
    format: combine(
      timestamp(),
      fileFormat
    )
  }));

  // Log the initialization
  logger.info('Logger initialized in development mode with file transport');
}

// Wrapper functions for logging
export const logApiCall = (type: 'incoming' | 'outgoing', data: any) => {
  const logData = {
    type,
    timestamp: new Date().toISOString(),
    ...data
  };
  logger.info('API Call', logData);
};

export const logError = (message: string, error: any) => {
  const logData = {
    message,
    timestamp: new Date().toISOString(),
    ...(error instanceof Error ? {
      error: error.message,
      stack: error.stack,
      name: error.name
    } : { error })
  };
  logger.error('Error', logData);
};

export const logInfo = (message: string, data?: any) => {
  const logData = {
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data })
  };
  logger.info('Info', logData);
};

export default logger; 