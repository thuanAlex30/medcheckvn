import { Router } from 'express';
import { InteractionCheckSchema } from '../drugs/drug.schema';
import { validateRequest, asyncHandler } from '../../shared/middlewares/error-handler';
import { interactionLimiter } from '../../shared/middlewares/rate-limiter';
import { checkInteractions } from './interaction-engine.service';

export const interactionRouter = Router();

interactionRouter.post(
  '/check',
  interactionLimiter,
  validateRequest({ body: InteractionCheckSchema }),
  asyncHandler(async (req, res) => {
    const { drugIds } = req.body;
    // userChronicConditions parsed from JWT claim nếu có
    const chronicConditions = (req as import('express').Request & { user?: { chronicConditions?: string[] } }).user
      ?.chronicConditions;
    const data = await checkInteractions(drugIds, chronicConditions);
    res.json(data);
  }),
);
