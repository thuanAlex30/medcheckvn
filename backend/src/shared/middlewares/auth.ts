import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type JwtAccessPayload } from '../utils/jwt';
import { HttpError } from './error-handler';

export interface AuthedRequest extends Request {
  user?: JwtAccessPayload;
}

export function authRequired(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Cần đăng nhập để truy cập'));
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new HttpError(401, 'Token không hợp lệ hoặc đã hết hạn'));
  }
}

export function requireRole(...roles: JwtAccessPayload['role'][]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new HttpError(401, 'Cần đăng nhập'));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'Không đủ quyền'));
    }
    next();
  };
}
