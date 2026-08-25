import { DrugModel, type DrugDoc } from './drug.model';
import { viNormalize, similarity } from '../../shared/utils/vietnamese-slug';
import type { DrugSearchHit, SearchResponse } from '@medcheck/shared-types';
import { HttpError } from '../../shared/middlewares/error-handler';
import { viSlug } from '../../shared/utils/vietnamese-slug';

function toHit(doc: DrugDoc): DrugSearchHit {
  return {
    id: doc.id,
    slug: doc.slug,
    brandNameVi: doc.brandNameVi,
    activeIngredients: doc.activeIngredients.map((i) => i.name),
    confidenceLevel: doc.confidenceLevel,
  };
}

// Fuzzy search theo Phần 6.1:
//  - exact match brandName > exact match ingredient > fuzzy match > normalized match
//  - maxEdits ≈ 1 (similarity >= 0.85 cho cụm dài)
export async function searchDrugs(q: string, limit: number): Promise<SearchResponse> {
  const start = Date.now();
  const query = q.trim();
  if (!query) {
    return { results: [], meta: { total: 0, tookMs: 0 } };
  }
  const normQuery = viNormalize(query);

  // Pull candidates một lần để rank trong memory (production Atlas Search sẽ dùng Lucene).
  // Giới hạn 500 candidate để tránh full scan.
  const candidates = await DrugModel.find(
    {
      $or: [
        { brandNameVi: { $regex: query, $options: 'i' } },
        { searchNormalized: { $regex: normQuery, $options: 'i' } },
        { 'activeIngredients.name': { $regex: query, $options: 'i' } },
      ],
    },
    null,
    { limit: 500 },
  ).lean();

  const scored = candidates
    .map((doc) => {
      const normBrand = viNormalize(doc.brandNameVi);
      const score = scoreMatch(normBrand, normQuery, doc.activeIngredients.map((i) => viNormalize(i.name)));
      return { doc, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    results: scored.map((x) => toHit(x.doc as unknown as DrugDoc)),
    meta: { total: scored.length, tookMs: Date.now() - start },
  };
}

function scoreMatch(normBrand: string, normQuery: string, normIngredients: string[]): number {
  if (normBrand === normQuery) return 100;
  if (normBrand.startsWith(normQuery)) return 80;
  if (normIngredients.includes(normQuery)) return 70;
  if (normIngredients.some((i) => i.startsWith(normQuery))) return 60;
  const simBrand = similarity(normBrand, normQuery);
  if (simBrand >= 0.85) return 50 + simBrand * 10;
  const simIng = Math.max(0, ...normIngredients.map((i) => similarity(i, normQuery)));
  if (simIng >= 0.85) return 40 + simIng * 10;
  // normalized fallback — contains
  if (normBrand.includes(normQuery)) return 30;
  if (normIngredients.some((i) => i.includes(normQuery))) return 20;
  return simBrand > 0.5 ? simBrand * 10 : 0;
}

export async function getDrugBySlug(slug: string): Promise<unknown> {
  const doc = await DrugModel.findOne({ slug }).lean();
  if (!doc) throw new HttpError(404, 'Không tìm thấy thuốc');
  return doc;
}

// Phần 6.4 — alternatives (cùng hoạt chất + strength ±10%)
export async function getAlternatives(drugId: string): Promise<DrugSearchHit[]> {
  const target = await DrugModel.findById(drugId).lean();
  if (!target) throw new HttpError(404, 'Không tìm thấy thuốc');

  const targetIng = target.activeIngredients[0];
  if (!targetIng?.rxCUI) return [];

  const candidates = await DrugModel.find({
    _id: { $ne: target._id },
    'activeIngredients.rxCUI': targetIng.rxCUI,
  }).lean();

  // Lọc strength ±10% nếu parse được số
  const targetMg = parseStrength(targetIng.strength ?? '');
  const filtered = candidates.filter((c) => {
    const candIng = c.activeIngredients[0];
    if (!candIng) return false;
    if (!targetMg) return true;
    const candMg = parseStrength(candIng.strength ?? '');
    if (!candMg) return false;
    return Math.abs(candMg - targetMg) / targetMg <= 0.1;
  });

  return filtered.map((d) => ({
    id: String(d._id),
    slug: d.slug,
    brandNameVi: d.brandNameVi,
    activeIngredients: d.activeIngredients.map((i) => i.name),
    confidenceLevel: d.confidenceLevel,
  }));
}

function parseStrength(s: string): number | null {
  const m = s.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  return Number(m[1].replace(',', '.'));
}

// Phần 6.1 — auto-fill searchNormalized khi upsert
export function buildSearchNormalized(brand: string): string {
  return viNormalize(brand);
}

export function generateSlug(brand: string, strength?: string): string {
  return viSlug(`${brand}${strength ? ' ' + strength : ''}`);
}

export async function createDrug(input: import('./drug.schema.js').DrugUpsertInput, performedBy: string) {
  const doc = await DrugModel.create({
    ...input,
    searchNormalized: buildSearchNormalized(input.brandNameVi),
  });
  await (await import('../audit-logs/audit-log.model.js')).AuditLogModel.create({
    entityType: 'drug',
    entityId: doc._id,
    action: 'create',
    performedBy,
  });
  return doc.toObject();
}

export async function verifyDrug(drugId: string, performedBy: string) {
  const doc = await DrugModel.findByIdAndUpdate(
    drugId,
    { verifiedByPharmacist: true, confidenceLevel: 'xanh' },
    { new: true },
  );
  if (!doc) throw new HttpError(404, 'Không tìm thấy thuốc');
  await (await import('../audit-logs/audit-log.model.js')).AuditLogModel.create({
    entityType: 'drug',
    entityId: doc._id,
    action: 'verify',
    performedBy,
  });
  return doc.toObject();
}
