import { Request, Response, NextFunction } from "express";

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Log request start
  console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - startTime;
    console.log(`[${timestamp}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    return originalJson.call(this, body);
  };

  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CORS headers for API
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

/**
 * Request size limiting middleware
 */
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength) {
      const maxBytes = parseSize(maxSize);
      if (parseInt(contentLength) > maxBytes) {
        return res.status(413).json({
          success: false,
          message: `Request size too large. Maximum size is ${maxSize}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    next();
  };
};

/**
 * Helper function to parse size strings (e.g., '10mb', '1gb')
 */
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmgt]?b)$/);
  if (!match) return 1024 * 1024; // Default 1MB

  const value = parseFloat(match[1]);
  const unit = match[2];

  return Math.floor(value * (units[unit] || 1));
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 */
export const simpleRateLimit = (maxRequests: number, windowMinutes: number) => {
  const requests: Map<string, { count: number; resetTime: number }> = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    const clientRequests = requests.get(clientIP);

    if (!clientRequests) {
      requests.set(clientIP, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (now > clientRequests.resetTime) {
      // Reset window
      requests.set(clientIP, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (clientRequests.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Try again in ${Math.ceil((clientRequests.resetTime - now) / 60000)} minutes`,
        timestamp: new Date().toISOString()
      });
    }

    clientRequests.count++;
    next();
  };
};
