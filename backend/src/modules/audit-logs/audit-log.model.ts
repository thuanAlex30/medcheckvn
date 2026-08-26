import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

// Bắt buộc theo spec Phần 4 — soft delete + audit log.
// Không cho xóa cứng dữ liệu drug/interaction.
const AuditLogSchema = new Schema(
  {
    entityType: {
      type: String,
      enum: ['drug', 'interaction', 'user', 'consent', 'schedule'],
      required: true,
    },
    entityId: { type: String, required: true, index: true },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'verify', 'consent', 'add', 'remove'],
      required: true,
    },
    performedBy: { type: String, required: true },
    diff: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });

export type AuditLogDoc = HydratedDocument<InferSchemaType<typeof AuditLogSchema>>;
export const AuditLogModel = model('AuditLog', AuditLogSchema);
