import { Router } from 'express';
import mongoose from 'mongoose';
import { getOptionalRedis } from '../../shared/config/redis';
import { env } from '../../shared/config/env';

export const healthRouter = Router();

interface CheckResult {
  status: 'ok' | 'down' | 'skipped';
  latencyMs?: number;
  error?: string;
}

async function time<T>(fn: () => Promise<T>): Promise<{ result?: T; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const result = await fn();
    return { result, latencyMs: Date.now() - start };
  } catch (err) {
    return { latencyMs: Date.now() - start, error: (err as Error).message };
  }
}

async function checkMongo(): Promise<CheckResult> {
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  if (mongoose.connection.readyState === 1) {
    // Ping để xác nhận DB còn sống
    const { latencyMs, error } = await time(() => mongoose.connection.db!.admin().ping());
    if (error) return { status: 'down', latencyMs, error };
    return { status: 'ok', latencyMs };
  }
  return { status: 'down', error: `readyState=${mongoose.connection.readyState}` };
}

async function checkRedis(): Promise<CheckResult> {
  const client = getOptionalRedis();
  if (!client) return { status: 'skipped' };
  const { latencyMs, error } = await time(() => client.ping());
  if (error) return { status: 'down', latencyMs, error };
  return { status: 'ok', latencyMs };
}

healthRouter.get('/healthz', async (_req, res) => {
  const [mongo, redis] = await Promise.all([checkMongo(), checkRedis()]);
  const allOk = mongo.status === 'ok' && (redis.status === 'ok' || redis.status === 'skipped');
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    env: env.NODE_ENV,
    uptimeSec: Math.round(process.uptime()),
    checks: { mongo, redis },
    ts: new Date().toISOString(),
  });
});

healthRouter.get('/livez', (_req, res) => {
  // Liveness — process còn chạy là đủ. Kubernetes liveness probe.
  res.json({ status: 'ok' });
});
