// Pure helpers for drug service — tách riêng để có thể unit-test mà không import
// cả chuỗi module (logger/config) của drug.service.

import { similarity } from '../../shared/utils/vietnamese-slug';

/**
 * Scoring cho fuzzy search — exported for unit test.
 * Ranking (cao → thấp):
 *   100  exact match brandName
 *    80  brandName.startsWith(query)
 *    70  ingredient exact match
 *    60  ingredient.startsWith(query)
 *    50+ fuzzy match brandName (sim >= 0.85)
 *    40+ fuzzy match ingredient (sim >= 0.85)
 *   30  brandName.includes(query)
 *   20  ingredient.includes(query)
 *    0  similarity < 0.5
 */
export function rankScore(normBrand: string, normQuery: string, normIngredients: string[]): number {
  if (normBrand === normQuery) return 100;
  if (normBrand.startsWith(normQuery)) return 80;
  if (normIngredients.includes(normQuery)) return 70;
  if (normIngredients.some((i) => i.startsWith(normQuery))) return 60;
  const simBrand = similarity(normBrand, normQuery);
  if (simBrand >= 0.85) return 50 + simBrand * 10;
  const simIng = Math.max(0, ...normIngredients.map((i) => similarity(i, normQuery)));
  if (simIng >= 0.85) return 40 + simIng * 10;
  if (normBrand.includes(normQuery)) return 30;
  if (normIngredients.some((i) => i.includes(normQuery))) return 20;
  return simBrand > 0.5 ? simBrand * 10 : 0;
}

/**
 * Parse hàm lượng đầu tiên có đơn vị ra mg để so sánh alternatives.
 * - Hỗ trợ "500mg", "0.5 g", "5 ml" → quy về mg.
 */
export function parseStrengthMg(s: string): number | null {
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(mg|g|ml|mcg|iu)\b/i);
  if (!m) return null;
  const value = Number(m[1].replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  const unit = m[2].toLowerCase();
  switch (unit) {
    case 'g': return value * 1000;
    case 'mcg': return value / 1000;
    case 'ml':
    case 'iu':
    default:
      return value;
  }
}

export function escapeRegexPattern(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
