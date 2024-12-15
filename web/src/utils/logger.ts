import debug from 'debug';

// Initialize debug loggers
const logApi = debug('pcc:web:api');
const logError = debug('pcc:web:error');
const logLifecycle = debug('pcc:web:lifecycle');

// Helper to ensure JSON-friendly data
const sanitizeData = (data: any): any => {
  // Handle null or undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Error objects
  if (data instanceof Error) {
    return {
      message: data.message,
      stack: data.stack,
      name: data.name
    };
  }
  
  // Handle Headers object
  if (data.headers) {
    let headerObj: Record<string, string> = {};
    
    if (data.headers instanceof Headers) {
      data.headers.forEach((value: string, key: string) => {
        headerObj[key] = value;
      });
      return {
        ...data,
        headers: headerObj
      };
    } else if (typeof data.headers === 'object') {
      // Handle plain object headers
      headerObj = { ...data.headers };
      return {
        ...data,
        headers: headerObj
      };
    }
  }

  // Handle nested objects
  if (data && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        sanitizeData(value)
      ])
    );
  }

  return data;
};

// Logger class for persistent session logging
class SessionLogger {
  private static instance: SessionLogger;
  private lifecycleLogs: any[] = [];
  private apiLogs: any[] = [];
  private errorLogs: any[] = [];
  private maxLogs: number = 1000;
  private initialized: boolean = false;

  private constructor() {
    // Load existing logs from localStorage on initialization
    try {
      this.lifecycleLogs = JSON.parse(localStorage.getItem('lifecycle-logs') || '[]');
      this.apiLogs = JSON.parse(localStorage.getItem('api-logs') || '[]');
      this.errorLogs = JSON.parse(localStorage.getItem('error-logs') || '[]');
    } catch (error) {
      console.error('Failed to load existing logs:', error);
    }

    // Save logs to localStorage periodically
    setInterval(() => this.persistLogs(), 5000);

    // Save logs before page unload
    window.addEventListener('beforeunload', () => this.persistLogs());
  }

  public static getInstance(): SessionLogger {
    if (!SessionLogger.instance) {
      SessionLogger.instance = new SessionLogger();
    }
    return SessionLogger.instance;
  }

  private persistLogs(): void {
    try {
      localStorage.setItem('lifecycle-logs', JSON.stringify(this.lifecycleLogs));
      localStorage.setItem('api-logs', JSON.stringify(this.apiLogs));
      localStorage.setItem('error-logs', JSON.stringify(this.errorLogs));
    } catch (error) {
      console.error('Failed to persist logs:', error);
    }
  }

  private addLog(array: any[], log: any): void {
    array.push(log);
    if (array.length > this.maxLogs) {
      array.shift();
    }
  }

  public logLifecycle(event: string, data?: any): void {
    const logEntry = {
      event,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      ...sanitizeData(data)
    };

    logLifecycle(`${event}:`, logEntry);
    this.addLog(this.lifecycleLogs, logEntry);

    // Initialize app if not already done
    if (!this.initialized && event === 'APP_START') {
      this.initialized = true;
      console.log('Session Logger Initialized');
      console.log('To view logs, use these commands in console:');
      console.log('window.logger.getLifecycleLogs()');
      console.log('window.logger.getApiLogs()');
      console.log('window.logger.getErrorLogs()');
    }
  }

  public logApi(type: 'outgoing' | 'incoming', data: any): void {
    const logEntry = {
      type,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      ...sanitizeData(data)
    };

    logApi(`${type.toUpperCase()} API Call:`, logEntry);
    this.addLog(this.apiLogs, logEntry);
  }

  public logError(error: any, context?: any): void {
    const logEntry = {
      error: sanitizeData(error),
      context: sanitizeData(context),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    logError('Error:', logEntry);
    this.addLog(this.errorLogs, logEntry);
  }

  // Getter methods for debugging
  public getLifecycleLogs(): any[] {
    return this.lifecycleLogs;
  }

  public getApiLogs(): any[] {
    return this.apiLogs;
  }

  public getErrorLogs(): any[] {
    return this.errorLogs;
  }

  public clearLogs(): void {
    this.lifecycleLogs = [];
    this.apiLogs = [];
    this.errorLogs = [];
    this.persistLogs();
  }
}

// Create logger instance
const logger = SessionLogger.getInstance();

// Make logger available globally for debugging
declare global {
  interface Window {
    logger: SessionLogger;
  }
}
window.logger = logger;

// Export wrapper functions
export const logLifecycleEvent = (event: string, data?: any) => {
  logger.logLifecycle(event, data);
};

export const logApiCall = (type: 'outgoing' | 'incoming', data: any) => {
  logger.logApi(type, data);
};

export const logErrorEvent = (error: any, context?: any) => {
  logger.logError(error, context);
};

// Wrapper for fetch to log API calls
export const loggedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const requestData = sanitizeData({
    url,
    method: options.method || 'GET',
    headers: options.headers,
    body: options.body
  });

  logApiCall('outgoing', requestData);

  try {
    const response = await fetch(url, options);
    const responseData = sanitizeData({
      url,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });

    logApiCall('incoming', responseData);
    return response;
  } catch (error) {
    logErrorEvent(error, { url, options });
    throw error;
  }
};

// Initialize lifecycle logging
window.addEventListener('load', () => {
  logLifecycleEvent('APP_START', {
    userAgent: navigator.userAgent,
    windowSize: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    config: {
      baseUrl: window.location.origin,
      apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
      environment: process.env.NODE_ENV
    }
  });
});

window.addEventListener('beforeunload', () => {
  logLifecycleEvent('APP_STOP', {
    timestamp: new Date().toISOString(),
    sessionDuration: performance.now()
  });
}); 