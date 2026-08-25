import { Router, type Request } from 'express';
import { z } from 'zod';
import { validateRequest, asyncHandler, HttpError } from '../../shared/middlewares/error-handler';
import { authRequired, type AuthedRequest } from '../../shared/middlewares/auth';
import {
  register,
  login,
  refreshTokens,
  updateConsent,
  getUserProfile,
  updateChronicConditions,
  decryptChronicConditions,
} from './auth.service';
import {
  getSchedule,
  addToSchedule,
  removeFromSchedule,
} from './medication-schedule.service';

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  name: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ConsentSchema = z.object({
  consentVersion: z.string().optional(),
});

const ChronicConditionsSchema = z.object({
  conditions: z.array(z.string().min(1)),
});

const ScheduleEntrySchema = z.object({
  drugId: z.string().min(1),
  drugName: z.string().min(1),
  dosage: z.string().min(1),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/)),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// ── Auth ──────────────────────────────────────────────────────────────────────

authRouter.post(
  '/register',
  validateRequest({ body: RegisterSchema }),
  asyncHandler(async (req, res) => {
    const result = await register(req.body);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ accessToken: result.accessToken, user: result.user });
  }),
);

authRouter.post(
  '/login',
  validateRequest({ body: LoginSchema }),
  asyncHandler(async (req, res) => {
    const result = await login(req.body);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken: result.accessToken, user: result.user });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) throw new HttpError(401, 'Không có refresh token');
    const result = await refreshTokens(token);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken: result.accessToken });
  }),
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken');
  res.json({ ok: true });
});

// ── User Profile ──────────────────────────────────────────────────────────────

const userRouter = Router();
userRouter.use(authRequired);

userRouter.get('/me', asyncHandler(async (req: AuthedRequest, res) => {
  const doc = await getUserProfile(req.user!.sub);
  res.json({
    id: doc.id,
    email: doc.email,
    name: doc.name,
    consentGivenAt: doc.consentGivenAt?.toISOString(),
    role: doc.role,
  });
}));

userRouter.post('/me/consent', validateRequest({ body: ConsentSchema }), asyncHandler(async (req: AuthedRequest, res) => {
  await updateConsent(req.user!.sub);
  res.json({ ok: true });
}));

userRouter.get('/me/conditions', asyncHandler(async (req: AuthedRequest, res) => {
  const user = await getUserProfile(req.user!.sub);
  const conditions = decryptChronicConditions(user.chronicConditionsEncrypted ?? '');
  res.json({ conditions });
}));

userRouter.patch('/me/conditions', validateRequest({ body: ChronicConditionsSchema }), asyncHandler(async (req: AuthedRequest, res) => {
  await updateChronicConditions(req.user!.sub, req.body.conditions);
  res.json({ ok: true });
}));

// ── Medication Schedule ───────────────────────────────────────────────────────

userRouter.get('/me/schedule', asyncHandler(async (req: AuthedRequest, res) => {
  const schedule = await getSchedule(req.user!.sub);
  res.json({ schedule });
}));

userRouter.post('/me/schedule', validateRequest({ body: ScheduleEntrySchema }), asyncHandler(async (req: AuthedRequest, res) => {
  const entry = await addToSchedule(req.user!.sub, req.body);
  res.status(201).json(entry);
}));

userRouter.delete('/me/schedule/:id', asyncHandler(async (req: AuthedRequest, res) => {
  await removeFromSchedule(req.user!.sub, req.params.id);
  res.json({ ok: true });
}));

export { userRouter };
