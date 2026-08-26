import { InteractionModel } from './interaction.model';
import { DrugModel } from '../drugs/drug.model';
import type {
  InteractionPair,
  PersonalizedWarning,
  InteractionCheckResponse,
  Severity,
} from '@medcheck/shared-types';

const SEVERITY_RANK: Record<Severity, number> = { nặng: 3, 'trung bình': 2, nhẹ: 1 };

// ── Pure helpers — exported for unit test. Không phụ thuộc DB. ─────────────

export interface DrugShape {
  _id: { toString(): string } | string;
  brandNameVi: string;
  activeIngredients: Array<{ name: string; rxCUI?: string; strength?: string }>;
  warningsForConditions?: Array<{ condition: string; warningVi: string; severity: Severity | string }>;
}

export interface InteractionShape {
  ingredientARxCUI: string;
  ingredientBRxCUI: string;
  severity: Severity | string;
  descriptionVi: string;
  mechanismVi?: string;
  recommendationVi?: string;
  sourceRefs?: Array<{ source: string; url?: string }>;
}

/** Sinh tất cả cặp (i,j) không lặp từ 1 danh sách. */
export function buildUniquePairs<T>(items: T[]): Array<[T, T]> {
  const out: Array<[T, T]> = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      out.push([items[i]!, items[j]!]);
    }
  }
  return out;
}

/** Build map rxCUI → danh sách drugId (có thể nhiều thuốc dùng chung rxCUI). */
export function buildRxCuiToDrugIds(drugs: DrugShape[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const drug of drugs) {
    const id = typeof drug._id === 'string' ? drug._id : drug._id.toString();
    for (const ing of drug.activeIngredients) {
      if (!ing.rxCUI) continue;
      const arr = map.get(ing.rxCUI);
      if (arr) {
        arr.push(id);
      } else {
        map.set(ing.rxCUI, [id]);
      }
    }
  }
  return map;
}

/** Build danh sách $or conditions cho query MongoDB (cả A→B và B→A). */
export function buildInteractionQueryConditions(pairs: Array<[string, string]>): Array<Record<string, string>> {
  return pairs.flatMap(([a, b]) => [
    { ingredientARxCUI: a, ingredientBRxCUI: b },
    { ingredientARxCUI: b, ingredientBRxCUI: b === a ? b : b }, // dedupe-safe noop nếu cùng A
  ]);
}

// Hàm trên dễ gây nhầm — viết rõ ràng:
/** Build điều kiện MongoDB $or: cho mỗi cặp (a,b) sinh 2 điều kiện đảo chiều. */
export function buildBidirectionalQuery(pairs: Array<[string, string]>): Array<Record<string, string>> {
  const seen = new Set<string>();
  const out: Array<Record<string, string>> = [];
  for (const [a, b] of pairs) {
    if (a === b) continue;
    const key1 = `${a}|${b}`;
    const key2 = `${b}|${a}`;
    if (!seen.has(key1)) {
      out.push({ ingredientARxCUI: a, ingredientBRxCUI: b });
      seen.add(key1);
    }
    if (!seen.has(key2)) {
      out.push({ ingredientARxCUI: b, ingredientBRxCUI: a });
      seen.add(key2);
    }
  }
  return out;
}

/** Map kết quả interactions từ DB → InteractionPair, mở rộng cho mọi drugId cùng rxCUI. */
export function buildInteractionPairs(
  interactions: InteractionShape[],
  drugMap: Map<string, DrugShape>,
  rxCuiToDrugId: Map<string, string[]>,
): InteractionPair[] {
  const pairs: InteractionPair[] = [];
  for (const intr of interactions) {
    const drugAIds = rxCuiToDrugId.get(intr.ingredientARxCUI) ?? [];
    const drugBIds = rxCuiToDrugId.get(intr.ingredientBRxCUI) ?? [];
    for (const idA of drugAIds) {
      for (const idB of drugBIds) {
        if (idA === idB) continue;
        const drugA = drugMap.get(idA);
        const drugB = drugMap.get(idB);
        if (!drugA || !drugB) continue;
        pairs.push({
          drugAId: idA,
          drugBId: idB,
          drugAName: drugA.brandNameVi,
          drugBName: drugB.brandNameVi,
          severity: intr.severity as Severity,
          descriptionVi: intr.descriptionVi,
          mechanismVi: intr.mechanismVi ?? undefined,
          recommendationVi: intr.recommendationVi ?? undefined,
          sourceRefs: (intr.sourceRefs ?? []) as InteractionPair['sourceRefs'],
        });
      }
    }
  }
  return pairs;
}

/** Build personalized warnings từ chronic conditions user + warningsForConditions trên drugs. */
export function buildPersonalizedWarnings(
  drugs: DrugShape[],
  userChronicConditions?: string[],
): PersonalizedWarning[] {
  const out: PersonalizedWarning[] = [];
  if (!userChronicConditions || userChronicConditions.length === 0) return out;
  const lowerConditions = userChronicConditions.map((c) => c.toLowerCase());
  for (const drug of drugs) {
    const id = typeof drug._id === 'string' ? drug._id : drug._id.toString();
    for (const warn of drug.warningsForConditions ?? []) {
      const cond = warn.condition.toLowerCase();
      if (lowerConditions.some((c) => cond.includes(c))) {
        out.push({
          drugId: id,
          drugName: drug.brandNameVi,
          condition: warn.condition,
          warningVi: warn.warningVi,
          severity: warn.severity as Severity,
        });
      }
    }
  }
  return out;
}

/** Sắp xếp giảm dần theo severity (nặng trước). */
export function sortBySeverityDesc<T extends { severity: Severity | string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (SEVERITY_RANK[b.severity as Severity] ?? 0) - (SEVERITY_RANK[a.severity as Severity] ?? 0));
}

// ── Public API (giữ nguyên chữ ký) ─────────────────────────────────────────

export async function checkInteractions(
  drugIds: string[],
  userChronicConditions?: string[],
): Promise<InteractionCheckResponse> {
  const drugs = (await DrugModel.find({ _id: { $in: drugIds } })
    .select('_id brandNameVi activeIngredients warningsForConditions')
    .lean()) as unknown as DrugShape[];

  if (drugs.length < 2) {
    return { pairs: [], personalizedWarnings: [] };
  }

  const drugMap = new Map<string, DrugShape>(
    drugs.map((d) => [typeof d._id === 'string' ? d._id : d._id.toString(), d]),
  );
  const rxCuiToDrugId = buildRxCuiToDrugIds(drugs);

  const uniqueRxCuis = Array.from(rxCuiToDrugId.keys());
  const uniquePairs = buildUniquePairs(uniqueRxCuis);

  if (uniquePairs.length === 0) {
    return { pairs: [], personalizedWarnings: [] };
  }

  const orConditions = buildBidirectionalQuery(uniquePairs);
  const interactions = (await InteractionModel.find({ $or: orConditions }).lean()) as unknown as InteractionShape[];

  const pairs = sortBySeverityDesc(buildInteractionPairs(interactions, drugMap, rxCuiToDrugId));
  const personalizedWarnings = sortBySeverityDesc(buildPersonalizedWarnings(drugs, userChronicConditions));

  return { pairs, personalizedWarnings };
}
