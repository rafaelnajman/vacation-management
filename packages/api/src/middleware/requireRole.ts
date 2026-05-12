import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import type { Role } from '@vacation/shared';

export function requireRole(role: Role): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (req.user.role !== role) return next(AppError.forbidden(`Requires ${role} role`));
    next();
  };
}
