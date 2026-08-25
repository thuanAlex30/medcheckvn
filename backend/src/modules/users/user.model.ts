import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: String,
    authProvider: { type: String, enum: ['google', 'credentials'], default: 'credentials' },
    passwordHash: String, // chỉ khi credentials
    role: { type: String, enum: ['user', 'admin', 'pharmacist'], default: 'user' },
    // Mã hóa field-level (Phần 7)
    chronicConditionsEncrypted: String,
    medicationScheduleEncrypted: String,
    consentGivenAt: Date,
    pushSubscription: Schema.Types.Mixed,
    // Bump mỗi lần logout/rotate để thu hồi tất cả refresh token cũ.
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof UserSchema>>;
export const UserModel = model('User', UserSchema);
