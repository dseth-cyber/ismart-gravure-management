import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './error';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const messages = (error.issues as Array<{ path: (string | number)[]; message: string }>).map(
          (e) => `${e.path.join('.')}: ${e.message}`
        );
        return next(new AppError(`Validation error: ${messages.join('; ')}`, 400));
      }
      next(error);
    }
  };
}

export function validateCreatePermission(body: unknown) {
  if (!body || typeof body !== 'object') throw new AppError('Invalid request body', 400);
  const { name, module, action, description } = body as any;
  if (!name || typeof name !== 'string') throw new AppError('name is required (string)', 400);
  if (!module || typeof module !== 'string') throw new AppError('module is required (string)', 400);
  if (!action || typeof action !== 'string') throw new AppError('action is required (string)', 400);
  return body as { name: string; module: string; action: string; description?: string };
}

export function validateCreateWorkflow(body: unknown) {
  if (!body || typeof body !== 'object') throw new AppError('Invalid request body', 400);
  const { name, description, config } = body as any;
  if (!name || typeof name !== 'string') throw new AppError('name is required (string)', 400);
  if (!config || typeof config !== 'object' || !Array.isArray(config.steps)) throw new AppError('config.steps is required (array)', 400);
  return body as { name: string; description?: string; config: { steps: any[] } };
}

export function validateStartWorkflow(body: unknown) {
  if (!body || typeof body !== 'object') throw new AppError('Invalid request body', 400);
  const { defId, title, refType, refId, metadata } = body as any;
  if (!defId || typeof defId !== 'string') throw new AppError('defId is required', 400);
  if (!title || typeof title !== 'string') throw new AppError('title is required', 400);
  if (!refType || typeof refType !== 'string') throw new AppError('refType is required', 400);
  if (!refId || typeof refId !== 'string') throw new AppError('refId is required', 400);
  return body as { defId: string; title: string; refType: string; refId: string; metadata?: any };
}
