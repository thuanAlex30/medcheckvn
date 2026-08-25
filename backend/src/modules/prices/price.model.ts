import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const PriceSchema = new Schema(
  {
    drugId: { type: Schema.Types.ObjectId, ref: 'Drug', required: true, index: true },
    pharmacySource: {
      type: String,
      enum: ['Long Châu', 'Pharmacity', 'An Khang', 'khác'],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    unit: String,
    url: String,
    scrapedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

// TTL 30 days (tự động xóa theo spec Phần 4)
PriceSchema.index({}, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export type PriceDoc = HydratedDocument<InferSchemaType<typeof PriceSchema>>;
export const PriceModel = model('Price', PriceSchema);
