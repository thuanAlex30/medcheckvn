import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/error-handler';
import { getPrices, getAlternativesWithPrices } from './price-comparison.service';

export const priceRouter = Router();

priceRouter.get(
  '/:id/prices',
  asyncHandler(async (req, res) => {
    const data = await getPrices(req.params.id);
    res.json(data);
  }),
);

priceRouter.get(
  '/:id/alternatives',
  asyncHandler(async (req, res) => {
    const data = await getAlternativesWithPrices(req.params.id);
    res.json({ alternatives: data });
  }),
);
