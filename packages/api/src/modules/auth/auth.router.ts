import { Router } from 'express';
import { AppDataSource } from '../../config/data-source.js';
import { User } from '../../entities/User.js';
import { AuthService } from './auth.service.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { loginSchema, registerSchema } from '@vacation/shared';

export function buildAuthRouter() {
  const router = Router();
  const service = new AuthService(AppDataSource.getRepository(User));

  router.post('/register', validate(registerSchema), async (req, res, next) => {
    try {
      const result = await service.register(req.body);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });

  router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
      const result = await service.login(req.body);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  router.get('/me', authenticate, async (req, res, next) => {
    try {
      const user = await service.getMe(req.user!.id);
      res.json({ user });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
