import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

// Schema theo spec Phần 4 — collection `drugs`
const SideEffectSchema = new Schema(
  {
    description: { type: String, required: true },
    frequency: { type: String, enum: ['thường gặp', 'ít gặp', 'hiếm gặp'], required: true },
  },
  { _id: false },
);

const WarningSchema = new Schema(
  {
    condition: { type: String, required: true },
    warningVi: { type: String, required: true },
    severity: { type: String, enum: ['nặng', 'trung bình', 'nhẹ'], required: true },
  },
  { _id: false },
);

const SourceRefSchema = new Schema(
  {
    source: {
      type: String,
      enum: ['OpenFDA', 'RxNorm', 'DAV.gov.vn', 'DrugBank', 'nhập thủ công đã kiểm duyệt'],
      required: true,
    },
    url: String,
    fetchedAt: Date,
  },
  { _id: false },
);

const IngredientSchema = new Schema(
  {
    name: { type: String, required: true },
    rxCUI: { type: String, index: true },
    strength: String,
  },
  { _id: false },
);

const DrugSchema = new Schema(
  {
    brandNameVi: { type: String, required: true, index: true },
    brandNameEn: { type: String },
    slug: { type: String, required: true, unique: true, index: true },
    activeIngredients: {
      type: [IngredientSchema],
      required: true,
      validate: [(v: unknown[]) => v.length > 0, 'Cần ít nhất 1 hoạt chất'],
    },
    form: {
      type: String,
      enum: ['viên nén', 'viên nang', 'siro', 'tiêm', 'bôi ngoài da', 'nhỏ mắt', 'khác'],
      required: true,
    },
    manufacturer: String,
    registrationNumber: String,
    prescriptionRequired: { type: Boolean, default: true },
    usageVi: String,
    dosageVi: String,
    contraindicationsVi: { type: [String], default: [] },
    sideEffectsVi: { type: [SideEffectSchema], default: [] },
    warningsForConditions: { type: [WarningSchema], default: [] },
    imageUrl: String,
    sourceRefs: { type: [SourceRefSchema], default: [] },
    confidenceLevel: {
      type: String,
      enum: ['xanh', 'vang', 'xam'],
      default: 'xam',
      index: true,
    },
    verifiedByPharmacist: { type: Boolean, default: false, index: true },
    // Phục vụ Phần 6.1: index normalized cho fuzzy fallback
    searchNormalized: { type: String, index: true },
  },
  { timestamps: true },
);

// Text index cho Atlas Search — khi không có Atlas Search, fallback regex trên searchNormalized.
DrugSchema.index({ brandNameVi: 'text', brandNameEn: 'text', 'activeIngredients.name': 'text' });

export type DrugDoc = HydratedDocument<InferSchemaType<typeof DrugSchema>>;
export const DrugModel = model('Drug', DrugSchema);
