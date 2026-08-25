import IORedis, { type Redis, type RedisOptions } from 'ioredis';
import { hasRedis } from './env';
import { logger } from './logger';

// Singleton — chia sẻ giữa rate-limit, BullMQ, cache
let client: Redis | null = null;

export function getRedis(): Redis {
  if (!hasRedis) {
    throw new Error('Redis not configured (REDIS_URL trống).');
  }
  if (!client) {
    const opts: RedisOptions = {
      maxRetriesPerRequest: null, // bắt buộc cho BullMQ
    };
    // ioredis default export ở CommonJS — gọi qua constructor factory
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const RedisCtor = (IORedis as unknown as { new (url: string, opts?: RedisOptions): Redis });
    client = new RedisCtor(process.env.REDIS_URL as string, opts);
    client.on('error', (err: Error) => logger.error({ err }, 'redis error'));
    logger.info('redis connected');
  }
  return client;
}

export function getOptionalRedis(): Redis | null {
  if (!hasRedis) return null;
  return getRedis();
}

