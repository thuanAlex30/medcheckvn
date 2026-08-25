import { Router } from 'express';
import { z } from 'zod';
import { validateRequest, asyncHandler, HttpError } from '../../shared/middlewares/error-handler';
import { checkInteractions } from '../interactions/interaction-engine.service';

// B2B API — freemium, cần API key trong header.
export const b2bRouter = Router();

const B2B_KEY = process.env.B2B_API_KEY ?? 'dev-b2b-key';

function apiKeyAuth(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
  const key = req.headers['x-api-key'] as string | undefined;
  if (!key || key !== B2B_KEY) {
    res.status(401).json({ error: 'Unauthorized', message: 'API key không hợp lệ' });
    return;
  }
  next();
}

const B2bCheckSchema = z.object({
  drugIds: z.array(z.string().min(1)).min(2).max(20),
});

b2bRouter.use(apiKeyAuth);

b2bRouter.post(
  '/interactions/check',
  validateRequest({ body: B2bCheckSchema }),
  asyncHandler(async (req, res) => {
    const data = await checkInteractions(req.body.drugIds);
    res.json(data);
  }),
);
