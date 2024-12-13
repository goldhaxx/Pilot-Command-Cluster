import { Request, Response, NextFunction } from 'express';
import { logApiCall } from '../utils/logger';

export const apiLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log the incoming request
  logApiCall('incoming', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body,
    ip: req.ip
  });

  // Capture the original send function
  const originalSend = res.send;

  // Override the send function to log the response
  res.send = function (body: any): Response {
    logApiCall('outgoing', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      headers: res.getHeaders(),
      body: body
    });

    return originalSend.call(this, body);
  };

  next();
}; 