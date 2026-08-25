import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin' | 'pharmacist';
}

export interface JwtRefreshPayload {
  sub: string;
  type: 'refresh';
  v: number; // refreshTokenVersion, khớp với User.refreshTokenVersion lúc phát hành
}

export function signAccessToken(payload: JwtAccessPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function signRefreshToken(userId: string, version: number): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId, type: 'refresh', v: version } satisfies JwtRefreshPayload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtAccessPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
}
