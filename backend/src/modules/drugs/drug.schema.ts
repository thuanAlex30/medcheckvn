import { z } from 'zod';

export const DrugFormSchema = z.enum([
  'viên nén',
  'viên nang',
  'siro',
  'tiêm',
  'bôi ngoài da',
  'nhỏ mắt',
  'khác',
]);

export const SideEffectSchema = z.object({
  description: z.string().min(1),
  frequency: z.enum(['thường gặp', 'ít gặp', 'hiếm gặp']),
});

export const ConditionWarningSchema = z.object({
  condition: z.string().min(1),
  warningVi: z.string().min(1),
  severity: z.enum(['nặng', 'trung bình', 'nhẹ']),
});

export const SourceRefSchema = z.object({
  source: z.enum(['OpenFDA', 'RxNorm', 'DAV.gov.vn', 'DrugBank', 'nhập thủ công đã kiểm duyệt']),
  url: z.string().url().optional(),
  fetchedAt: z.string().datetime().optional(),
});

export const IngredientSchema = z.object({
  name: z.string().min(1),
  rxCUI: z.string().optional(),
  strength: z.string().optional(),
});

export const DrugUpsertSchema = z.object({
  brandNameVi: z.string().min(1),
  brandNameEn: z.string().optional(),
  slug: z.string().min(1),
  activeIngredients: z.array(IngredientSchema).min(1),
  form: DrugFormSchema,
  manufacturer: z.string().optional(),
  registrationNumber: z.string().optional(),
  prescriptionRequired: z.boolean().default(true),
  usageVi: z.string().optional(),
  dosageVi: z.string().optional(),
  contraindicationsVi: z.array(z.string()).default([]),
  sideEffectsVi: z.array(SideEffectSchema).default([]),
  warningsForConditions: z.array(ConditionWarningSchema).default([]),
  imageUrl: z.string().url().optional(),
  sourceRefs: z.array(SourceRefSchema).default([]),
  confidenceLevel: z.enum(['xanh', 'vang', 'xam']).default('xam'),
});

export type DrugUpsertInput = z.infer<typeof DrugUpsertSchema>;

export const DrugSearchQuerySchema = z.object({
  q: z.string().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const InteractionCheckSchema = z.object({
  drugIds: z.array(z.string().min(1)).min(2).max(20),
});
