import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';
import { env } from './shared/config/env';
import { logger } from './shared/config/logger';
import { connectMongo } from './shared/config/db';
import { errorHandler } from './shared/middlewares/error-handler';
import { notFound } from './shared/middlewares/rate-limiter';
import { drugRouter, adminDrugRouter } from './modules/drugs/drug.routes';
import { interactionRouter } from './modules/interactions/interaction.routes';
import { priceRouter } from './modules/prices/price.routes';
import { authRouter, userRouter } from './modules/users/user.routes';
import { ocrRouter } from './modules/ocr/ocr.routes';
import { b2bRouter } from './modules/b2b/b2b.routes';
import { startWorkers, stopWorkers } from './jobs/queue.service';

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize()); // chống NoSQL injection

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(pinoHttp({ logger } as any));

// ── Routes ─────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV, ts: new Date().toISOString() });
});

// API v1
app.use('/api/v1/drugs', drugRouter);
app.use('/api/v1/admin/drugs', adminDrugRouter);
app.use('/api/v1/interactions', interactionRouter);
app.use('/api/v1/drugs', priceRouter); // /:id/prices, /:id/alternatives
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/ocr', ocrRouter);
app.use('/api/v1/public', b2bRouter); // B2B freemium

// Legacy redirect (trong case có link cũ)
app.get('/api/drugs/:slug', (req, res) => {
  res.redirect(301, `/api/v1/drugs/${req.params.slug}`);
});

// ── Error handling ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────────────────────

async function main() {
  await connectMongo();

  // Khởi động BullMQ workers (bỏ qua nếu không có Redis)
  try {
    startWorkers();
  } catch {
    logger.warn('BullMQ workers skipped (Redis not configured)');
  }

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'MedCheck API started');
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    server.close();
    await stopWorkers();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

export default app;
