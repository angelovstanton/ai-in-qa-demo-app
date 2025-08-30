import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateTokenWithQuery = (req: Request, res: Response, next: NextFunction) => {
  // Allow OPTIONS requests without authentication
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  // Check for token in query parameter first
  const queryToken = req.query.token as string;
  
  // Check for token in authorization header
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.split(' ')[1];
  
  const token = queryToken || headerToken;
  
  // Skip null or 'null' string tokens
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ 
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token required',
        correlationId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      departmentId: decoded.departmentId
    };
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
        correlationId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });
  }
};