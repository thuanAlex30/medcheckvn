import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getOptionalRedis } from '../config/redis';
import { logger } from '../config/logger';

// Different limits per Phần 7 spec:
//   - search: 60 req/min/IP
//   - check interaction: 20 req/min/IP
//   - OCR: 10 req/hour/user
// If Redis không cấu hình → fallback memory store (đủ cho dev).

function buildStore(prefix: string) {
  const redis = getOptionalRedis();
  if (!redis) return undefined;
  return new RedisStore({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as Promise<any>,
    prefix: `rl:${prefix}:`,
  });
}

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: buildStore('search'),
  handler: (_req, res) => {
    logger.warn('search rate limit hit');
    res.status(429).json({ error: 'TooManyRequests', message: 'Bạn thao tác quá nhanh, thử lại sau 1 phút.' });
  },
});

export const interactionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: buildStore('interaction'),
  handler: (_req, res) => {
    res.status(429).json({ error: 'TooManyRequests', message: 'Bạn thao tác quá nhanh, thử lại sau 1 phút.' });
  },
});

export const ocrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: buildStore('ocr'),
  handler: (_req, res) => {
    res.status(429).json({ error: 'TooManyRequests', message: 'Giới hạn OCR 10 lần/giờ.' });
  },
  // keyGenerator chạy sau auth — chỉ áp cho user đã đăng nhập
  keyGenerator: (req: Request) => {
    const userId = (req as Request & { user?: { id?: string } }).user?.id;
    return userId ?? req.ip ?? 'anon';
  },
});

export function notFound(_req: Request, res: Response, next: NextFunction): void {
  next();
  res.status(404).json({ error: 'NotFound', message: 'Endpoint không tồn tại' });
}
