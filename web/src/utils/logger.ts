import debug from 'debug';

const logApi = debug('pcc:web:api');
const logError = debug('pcc:web:error');

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

// In browser environment, we'll log to console and localStorage
export const logApiCall = (type: 'outgoing' | 'incoming', data: any) => {
  const sanitizedData = sanitizeData(data);
  
  const logEntry = {
    type,
    timestamp: new Date().toISOString(),
    ...sanitizedData
  };

  // Log to console in development
  logApi(`${type.toUpperCase()} API Call:`, logEntry);

  // Store in localStorage with rotation (keep last 100 entries)
  try {
    const logs = JSON.parse(localStorage.getItem('api-logs') || '[]');
    logs.push(logEntry);
    if (logs.length > 100) logs.shift(); // Remove oldest entry if over 100
    localStorage.setItem('api-logs', JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to store log:', sanitizeData(error));
  }
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
    logError('API Call Error:', sanitizeData(error));
    throw error;
  }
}; 