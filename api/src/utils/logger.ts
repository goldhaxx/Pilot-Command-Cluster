import winston from 'winston';

// Custom format to ensure JSON-friendly output
const jsonFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...meta,
    error: meta.error instanceof Error ? {
      message: meta.error.message,
      stack: meta.error.stack,
      name: meta.error.name
    } : meta.error
  });
});

// Create logger instance
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    jsonFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export const logApiCall = (type: 'incoming' | 'outgoing', data: any) => {
  // Ensure headers are JSON-friendly
  const sanitizedData = {
    ...data,
    headers: data.headers ? Object.fromEntries(
      Object.entries(data.headers).map(([key, value]) => [
        key,
        // Convert array-like values to arrays
        Array.isArray(value) ? value : [value].filter(Boolean)
      ])
    ) : undefined,
    // Remove undefined values
    body: data.body ? JSON.parse(JSON.stringify(data.body)) : undefined
  };

  const logData = {
    type,
    timestamp: new Date().toISOString(),
    ...sanitizedData
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