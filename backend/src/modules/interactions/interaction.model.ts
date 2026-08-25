import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import type { Severity } from '@medcheck/shared-types';

const InteractionSchema = new Schema(
  {
    ingredientARxCUI: { type: String, required: true, index: true },
    ingredientBRxCUI: { type: String, required: true, index: true },
    severity: { type: String, enum: ['nặng', 'trung bình', 'nhẹ'] as Severity[], required: true },
    descriptionVi: { type: String, required: true },
    mechanismVi: String,
    recommendationVi: String,
    sourceRefs: [
      {
        source: String,
        url: String,
      },
    ],
  },
  { timestamps: false },
);

// Unique on A→B and B→A pairs
InteractionSchema.index(
  { ingredientARxCUI: 1, ingredientBRxCUI: 1 },
  { unique: true },
);

export type InteractionDoc = HydratedDocument<InferSchemaType<typeof InteractionSchema>>;
export const InteractionModel = model('Interaction', InteractionSchema);
