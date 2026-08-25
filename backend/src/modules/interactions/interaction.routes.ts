import { Router } from 'express';
import { InteractionCheckSchema } from '../drugs/drug.schema';
import { validateRequest, asyncHandler } from '../../shared/middlewares/error-handler';
import { interactionLimiter } from '../../shared/middlewares/rate-limiter';
import { authRequired, type AuthedRequest } from '../../shared/middlewares/auth';
import { decryptChronicConditions } from '../users/auth.service';
import { UserModel } from '../users/user.model';
import { checkInteractions } from './interaction-engine.service';

export const interactionRouter = Router();

interactionRouter.post(
  '/check',
  authRequired,
  interactionLimiter,
  validateRequest({ body: InteractionCheckSchema }),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { drugIds } = req.body;
    const user = await UserModel.findById(req.user!.sub).select('chronicConditionsEncrypted');
    const chronicConditions = decryptChronicConditions(user?.chronicConditionsEncrypted ?? '');
    const data = await checkInteractions(drugIds, chronicConditions);
    res.json(data);
  }),
);
