import type { ErrorRequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_FAILED',
      issues: z.treeifyError(err),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }

  // Unknown error
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL' });
};
