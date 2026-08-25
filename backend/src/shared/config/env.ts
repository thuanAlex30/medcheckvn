import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Validate env fail-fast — không để app chạy với config thiếu (theo spec Phần 11)
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI là bắt buộc'),
  REDIS_URL: z.string().optional().default(''),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET phải >= 16 ký tự'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET phải >= 16 ký tự'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY phải là hex 64 ký tự (32 bytes)'),

  GOOGLE_VISION_API_KEY: z.string().optional().default(''),
  CLOUDFLARE_R2_ACCESS_KEY: z.string().optional().default(''),
  CLOUDFLARE_R2_SECRET_KEY: z.string().optional().default(''),
  SENTRY_DSN: z.string().optional().default(''),

  B2B_API_KEY: z.string().min(8, 'B2B_API_KEY phải >= 8 ký tự').optional().default(''),
});

export type Env = z.infer<typeof EnvSchema>;

let parsed: Env;
try {
  parsed = EnvSchema.parse(process.env);
} catch (err) {
  console.error('❌ Environment validation failed:', err);
  process.exit(1);
}

export const env: Env = parsed;

export const isProd = env.NODE_ENV === 'production';
export const hasRedis = Boolean(env.REDIS_URL);
export const hasVision = Boolean(env.GOOGLE_VISION_API_KEY);
