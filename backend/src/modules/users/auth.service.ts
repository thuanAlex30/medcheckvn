import bcrypt from 'bcryptjs';
import { UserModel, type UserDoc } from './user.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken, type JwtAccessPayload } from '../../shared/utils/jwt';
import { HttpError } from '../../shared/middlewares/error-handler';
import { encrypt, decrypt } from '../../shared/utils/encryption';
import { AuditLogModel } from '../audit-logs/audit-log.model';

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function register(input: RegisterInput): Promise<{ accessToken: string; refreshToken: string; user: JwtAccessPayload }> {
  const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (existing) throw new HttpError(409, 'Email đã được sử dụng');

  const passwordHash = await hashPassword(input.password);
  const doc = await UserModel.create({
    email: input.email.toLowerCase(),
    passwordHash,
    name: input.name,
    authProvider: 'credentials',
    role: 'user',
  });

  const payload: JwtAccessPayload = { sub: doc.id, email: doc.email, role: doc.role as JwtAccessPayload['role'] };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(doc.id, doc.refreshTokenVersion),
    user: payload,
  };
}

export async function login(input: LoginInput): Promise<{ accessToken: string; refreshToken: string; user: JwtAccessPayload }> {
  const doc = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (!doc || !doc.passwordHash) throw new HttpError(401, 'Email hoặc mật khẩu không đúng');

  const valid = await comparePassword(input.password, doc.passwordHash);
  if (!valid) throw new HttpError(401, 'Email hoặc mật khẩu không đúng');

  const payload: JwtAccessPayload = { sub: doc.id, email: doc.email, role: doc.role as JwtAccessPayload['role'] };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(doc.id, doc.refreshTokenVersion),
    user: payload,
  };
}

export async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, 'Refresh token không hợp lệ');
  }

  const doc = await UserModel.findById(payload.sub);
  if (!doc) throw new HttpError(401, 'Người dùng không tồn tại');
  // Nếu version trong token != version hiện tại → token đã bị thu hồi (sau logout hoặc rotate).
  if (payload.v !== doc.refreshTokenVersion) {
    throw new HttpError(401, 'Refresh token đã bị thu hồi');
  }

  // Rotate: bump version cũ, phát hành token với version mới. Như vậy mọi token cũ trở nên invalid.
  doc.refreshTokenVersion += 1;
  await doc.save();

  const newPayload: JwtAccessPayload = { sub: doc.id, email: doc.email, role: doc.role as JwtAccessPayload['role'] };
  return {
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(doc.id, doc.refreshTokenVersion),
  };
}

export async function logoutUser(userId: string): Promise<void> {
  // Bump version để mọi refresh token còn lại (cookie chưa kịp xóa) trở nên invalid.
  await UserModel.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } });
}

export async function getUserById(id: string): Promise<UserDoc | null> {
  return UserModel.findById(id);
}

export async function updateConsent(userId: string, consentVersion?: string): Promise<void> {
  await UserModel.findByIdAndUpdate(userId, { consentGivenAt: new Date() });
  // Phần 7: mọi thao tác liên quan đến dữ liệu sức khỏe phải có audit log entry.
  await AuditLogModel.create({
    entityType: 'consent',
    entityId: userId,
    action: 'consent',
    performedBy: userId,
    diff: { consentVersion: consentVersion ?? null, at: new Date().toISOString() },
  });
}

export async function getUserProfile(userId: string) {
  const doc = await UserModel.findById(userId).select('-passwordHash -chronicConditionsEncrypted -medicationScheduleEncrypted');
  if (!doc) throw new HttpError(404, 'Không tìm thấy người dùng');
  return doc;
}

export async function updateChronicConditions(userId: string, conditions: string[]): Promise<void> {
  if (!conditions.length) {
    await UserModel.findByIdAndUpdate(userId, { chronicConditionsEncrypted: '' });
    return;
  }
  const encrypted = encrypt(JSON.stringify(conditions));
  await UserModel.findByIdAndUpdate(userId, { chronicConditionsEncrypted: encrypted });
}

export function decryptChronicConditions(encrypted: string): string[] {
  if (!encrypted) return [];
  try {
    return JSON.parse(decrypt(encrypted)) as string[];
  } catch (err) {
    // Surface lỗi decrypt (vd: ENCRYPTION_KEY đã rotate) cho logger,
    // nhưng KHÔNG leak chi tiết PII về user.
    import('../../shared/config/logger.js')
      .then(({ logger }) =>
        logger.warn({ err }, 'Failed to decrypt chronicConditions — possible key rotation or corrupted data'),
      )
      .catch(() => undefined);
    throw new HttpError(500, 'Dữ liệu bệnh nền không thể giải mã. Vui lòng liên hệ hỗ trợ.');
  }
}
