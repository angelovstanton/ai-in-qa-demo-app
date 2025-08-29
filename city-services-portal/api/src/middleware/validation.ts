import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

interface ValidationOptions {
  body?: z.ZodType<any, any>;
  query?: z.ZodType<any, any>;
  params?: z.ZodType<any, any>;
}

export const validateRequest = (schema: ValidationOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            })),
            correlationId: res.locals.correlationId
          }
        });
      }
      next(error);
    }
  };
};

export const validateBody = (schema: z.ZodType<any, any>) => {
  return validateRequest({ body: schema });
};

export const validateQuery = (schema: z.ZodType<any, any>) => {
  return validateRequest({ query: schema });
};

export const validateParams = (schema: z.ZodType<any, any>) => {
  return validateRequest({ params: schema });
};