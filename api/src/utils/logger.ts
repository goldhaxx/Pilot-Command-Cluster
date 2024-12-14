import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Debug logging for initialization
console.log('Initializing logger...');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Custom format to ensure JSON-friendly output
const jsonFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
    error: meta.error instanceof Error ? {
      message: meta.error.message,
      stack: meta.error.stack,
      name: meta.error.name
    } : meta.error
  };
  return JSON.stringify(logEntry, null, 2);
});

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
console.log('Logs directory path:', logsDir);

if (!fs.existsSync(logsDir)) {
  console.log('Creating logs directory...');
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define file transport options
const fileTransportOptions = {
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    jsonFormat
  ),
  maxsize: 5242880, // 5MB
  maxFiles: 5,
  tailable: true
};

// Create logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    jsonFormat
  ),
  defaultMeta: { service: 'pilot-command-cluster-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transports in development environment
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
  console.log('Setting up file transports for development/local environment');
  
  const errorLogPath = path.join(logsDir, 'error.log');
  const apiCallsLogPath = path.join(logsDir, 'api-calls.log');
  
  console.log('Error log path:', errorLogPath);
  console.log('API calls log path:', apiCallsLogPath);

  // Add error log transport
  logger.add(new winston.transports.File({
    ...fileTransportOptions,
    filename: errorLogPath,
    level: 'error'
  }));
  
  // Add API calls log transport
  logger.add(new winston.transports.File({
    ...fileTransportOptions,
    filename: apiCallsLogPath
  }));

  // Verify transports were added
  console.log('Current logger transports:', 
    logger.transports.map(t => ({
      type: t.constructor.name,
      level: t.level,
      filename: 'filename' in t ? (t as winston.transports.FileTransportInstance).filename : undefined
    }))
  );

  // Test log entries
  logger.info('Logger initialized in development mode');
  logger.error('Test error log entry');
}

// Export the logger instance
export { logger };

// Helper functions
export const logApiCall = (type: 'incoming' | 'outgoing', data: any) => {
  const logData = {
    type,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  logger.info('API Call', logData);
};

export const logError = (error: any, context?: any) => {
  const errorObj = error instanceof Error ? {
    message: error.message,
    stack: error.stack,
    name: error.name
  } : error;

  logger.error('Error', { 
    error: errorObj,
    context: context ? JSON.parse(JSON.stringify(context)) : undefined
  });
}; 