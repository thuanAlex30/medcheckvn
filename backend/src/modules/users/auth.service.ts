import bcrypt from 'bcryptjs';
import { UserModel, type UserDoc } from './user.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken, type JwtAccessPayload } from '../../shared/utils/jwt';
import { HttpError } from '../../shared/middlewares/error-handler';
import { encrypt, decrypt } from '../../shared/utils/encryption';

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
    refreshToken: signRefreshToken(doc.id),
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
    refreshToken: signRefreshToken(doc.id),
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

  const newPayload: JwtAccessPayload = { sub: doc.id, email: doc.email, role: doc.role as JwtAccessPayload['role'] };
  return {
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(doc.id),
  };
}

export async function getUserById(id: string): Promise<UserDoc | null> {
  return UserModel.findById(id);
}

export async function updateConsent(userId: string): Promise<void> {
  await UserModel.findByIdAndUpdate(userId, { consentGivenAt: new Date() });
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
  } catch {
    return [];
  }
}
