import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const correlationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
};
