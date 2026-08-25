import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

// Bắt buộc theo spec Phần 4 — soft delete + audit log.
// Không cho xóa cứng dữ liệu drug/interaction.
const AuditLogSchema = new Schema(
  {
    entityType: { type: String, enum: ['drug', 'interaction', 'user'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, enum: ['create', 'update', 'delete', 'verify'], required: true },
    performedBy: { type: String, required: true },
    diff: { type: Schema.Types.Mixed },
  },
  { timestamps: false },
);

AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ createdAt: -1 });

export type AuditLogDoc = HydratedDocument<InferSchemaType<typeof AuditLogSchema>>;
export const AuditLogModel = model('AuditLog', AuditLogSchema);
