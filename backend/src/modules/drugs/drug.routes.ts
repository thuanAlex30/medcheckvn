import { Router, type Request } from 'express';
import { DrugUpsertSchema, DrugSearchQuerySchema } from './drug.schema';
import { validateRequest, asyncHandler, HttpError } from '../../shared/middlewares/error-handler';
import { authRequired, requireRole, type AuthedRequest } from '../../shared/middlewares/auth';
import { searchLimiter } from '../../shared/middlewares/rate-limiter';
import {
  searchDrugs,
  getDrugBySlug,
  getAlternatives,
  createDrug,
  verifyDrug,
} from './drug.service';
import { z } from 'zod';

export const drugRouter = Router();

drugRouter.get(
  '/search',
  searchLimiter,
  validateRequest({ query: DrugSearchQuerySchema }),
  asyncHandler(async (req, res) => {
    const { q, limit } = req.query as unknown as z.infer<typeof DrugSearchQuerySchema>;
    const data = await searchDrugs(q, limit);
    res.json(data);
  }),
);

drugRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const data = await getDrugBySlug(req.params.slug);
    res.json(data);
  }),
);

drugRouter.get(
  '/:id/alternatives',
  asyncHandler(async (req, res) => {
    if (!req.params.id.match(/^[a-f0-9]{24}$/i)) {
      throw new HttpError(400, 'ID không hợp lệ');
    }
    const data = await getAlternatives(req.params.id);
    res.json({ alternatives: data });
  }),
);

// Admin
const adminDrugRouter = Router();
adminDrugRouter.use(authRequired, requireRole('admin'));

adminDrugRouter.post(
  '/',
  validateRequest({ body: DrugUpsertSchema }),
  asyncHandler(async (req: AuthedRequest, res) => {
    const created = await createDrug(req.body, req.user!.email);
    res.status(201).json(created);
  }),
);

adminDrugRouter.patch(
  '/:id/verify',
  requireRole('admin', 'pharmacist'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const verified = await verifyDrug(req.params.id, req.user!.email);
    res.json(verified);
  }),
);

export { adminDrugRouter };
