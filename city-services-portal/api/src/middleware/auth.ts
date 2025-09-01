import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    name: string;
    departmentId?: string | null;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token required',
        correlationId: res.locals.correlationId
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    // Fetch fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token - user not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      departmentId: user.departmentId
    };

    next();
  } catch (error: any) {
    // Differentiate between token expiration and other errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
          correlationId: res.locals.correlationId
        }
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
          correlationId: res.locals.correlationId
        }
      });
    }
    
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed',
        correlationId: res.locals.correlationId
      }
    });
  }
};

export const rbacGuard = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          correlationId: res.locals.correlationId
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          correlationId: res.locals.correlationId
        }
      });
    }

    next();
  };
};

// Alias for compatibility
export const authorizeRoles = rbacGuard;

export const generateToken = (user: { id: string; email: string; role: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY ? `${process.env.ACCESS_TOKEN_EXPIRY}h` : '24h' }
  );
};