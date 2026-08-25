import pino from 'pino';
import { env, isProd } from '../config/env';

export const logger = pino({
  level: isProd ? 'info' : 'debug',
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss.l' },
      },
  base: { service: 'medcheck-api', env: env.NODE_ENV },
});

export type Logger = typeof logger;
