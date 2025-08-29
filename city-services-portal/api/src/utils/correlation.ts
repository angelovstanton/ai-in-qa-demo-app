import { Request } from 'express';

export const generateCorrelationId = (req: Request): string => {
  // Check if correlationId already exists in res.locals
  if ((req as any).res?.locals?.correlationId) {
    return (req as any).res.locals.correlationId;
  }
  
  // Generate a new correlationId
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};