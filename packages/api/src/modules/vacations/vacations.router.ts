import { Router } from 'express';
import { AppDataSource } from '../../config/data-source.js';
import { VacationRequest } from '../../entities/VacationRequest.js';
import { VacationsService } from './vacations.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import {
  createVacationSchema,
  listVacationsQuerySchema,
  decideVacationSchema,
} from '@vacation/shared';
import type { ListVacationsQuery } from '@vacation/shared';

export function buildVacationsRouter() {
  const router = Router();
  const service = new VacationsService(AppDataSource.getRepository(VacationRequest));

  router.use(authenticate);

  router.get('/me', requireRole('Requester'), async (req, res, next) => {
    try {
      const items = await service.listMine(req.user!.id);
      res.json(items);
    } catch (e) { next(e); }
  });

  // Stats must be before GET / to avoid being shadowed
  router.get('/stats', requireRole('Validator'), async (_req, res, next) => {
    try {
      const result = await service.stats();
      res.json(result);
    } catch (e) { next(e); }
  });

  router.post(
    '/',
    requireRole('Requester'),
    validate(createVacationSchema),
    async (req, res, next) => {
      try {
        const created = await service.create(req.user!.id, req.body);
        res.status(201).json(created);
      } catch (e) { next(e); }
    },
  );

  router.get(
    '/',
    requireRole('Validator'),
    async (req, res, next) => {
      try {
        const parsed = listVacationsQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(parsed.error);
        const result = await service.listAll(parsed.data as ListVacationsQuery);
        res.json(result);
      } catch (e) { next(e); }
    },
  );

  router.get('/:id', async (req, res, next) => {
    try {
      const id = req.params.id;
      const result = await service.getById(id, req.user!.id, req.user!.role);
      res.json(result);
    } catch (e) { next(e); }
  });

  router.post(
    '/:id/approve',
    requireRole('Validator'),
    validate(decideVacationSchema),
    async (req, res, next) => {
      try {
        const id = req.params['id'] as string;
        const result = await service.decide(id, 'Approved', req.body);
        res.json(result);
      } catch (e) { next(e); }
    },
  );

  router.post(
    '/:id/reject',
    requireRole('Validator'),
    validate(decideVacationSchema),
    async (req, res, next) => {
      try {
        const id = req.params['id'] as string;
        const result = await service.decide(id, 'Rejected', req.body);
        res.json(result);
      } catch (e) { next(e); }
    },
  );

  return router;
}
