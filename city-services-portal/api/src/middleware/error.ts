import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  res.locals.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const correlationId = res.locals.correlationId || uuidv4();
  
  console.error(`Error ${correlationId}:`, err);
  
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
  }

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      correlationId
    }
  });
};