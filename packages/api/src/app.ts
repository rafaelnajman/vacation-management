import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/AppError.js';
import { buildAuthRouter } from './modules/auth/auth.router.js';
import { buildVacationsRouter } from './modules/vacations/vacations.router.js';

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: false }));
  app.use(express.json({ limit: '64kb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // (Future) routers mounted here
  app.use('/api/auth', buildAuthRouter());
  app.use('/api/vacation-requests', buildVacationsRouter());

  app.use((_req, _res, next) => next(AppError.notFound('Route not found')));
  app.use(errorHandler);

  return app;
}
