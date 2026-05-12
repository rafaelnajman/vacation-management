import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppDataSource } from '../config/data-source.js';
import { User } from '../entities/User.js';
import { AppError } from '../utils/AppError.js';
import type { Role } from '@vacation/shared';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: Role };
  }
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return next(AppError.unauthorized());

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: Role };
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: payload.sub } });
    if (!user) return next(AppError.unauthorized());
    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    return next(AppError.unauthorized());
  }
};
