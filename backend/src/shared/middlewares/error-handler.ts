import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { logger } from '../config/logger';

interface ValidateOptions<T> {
  body?: ZodSchema<T>;
  query?: ZodSchema<T>;
  params?: ZodSchema<T>;
}

export function validateRequest<T = unknown>(schemas: ValidateOptions<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // Express query is read-only — mutate properties instead of reassigning
        Object.assign(req.query, parsed);
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        Object.assign(req.params, parsed);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

// Centralized error handler — convert ZodError, MongoError, HttpError → JSON response
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // Express requires the 4-arg signature even if next is unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Request payload không hợp lệ',
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'CastError') {
    res.status(400).json({ error: 'CastError', message: 'ID không hợp lệ' });
    return;
  }

  logger.error({ err }, 'unhandled error');
  res.status(500).json({
    error: 'InternalError',
    message: 'Lỗi máy chủ nội bộ',
  });
}

export function asyncHandler<TReq extends Request = Request>(
  fn: (req: TReq, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: TReq, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
