import { InteractionModel } from './interaction.model';
import { DrugModel } from '../drugs/drug.model';
import type {
  InteractionPair,
  PersonalizedWarning,
  InteractionCheckResponse,
  Severity,
} from '@medcheck/shared-types';

// Phần 6.2 — Interaction Engine
// Input: danh sách drugIds, output: pairs + personalized warnings
export async function checkInteractions(
  drugIds: string[],
  userChronicConditions?: string[],
): Promise<InteractionCheckResponse> {
  // Bước 1: lấy ingredients + warnings cho tất cả drugs
  const drugs = await DrugModel.find({ _id: { $in: drugIds } })
    .select('_id brandNameVi activeIngredients warningsForConditions')
    .lean();

  if (drugs.length < 2) {
    return { pairs: [], personalizedWarnings: [] };
  }

  // Map drugId → drug
  const drugMap = new Map(drugs.map((d) => [String(d._id), d]));

  // Bước 2: build tập hợp rxCUI duy nhất
  const rxCuis: string[] = [];
  const rxCuiToDrugId = new Map<string, string[]>();
  for (const drug of drugs) {
    for (const ing of drug.activeIngredients) {
      if (ing.rxCUI) {
        rxCuis.push(ing.rxCUI);
        if (!rxCuiToDrugId.has(ing.rxCUI)) rxCuiToDrugId.set(ing.rxCUI, []);
        rxCuiToDrugId.get(ing.rxCUI)!.push(String(drug._id));
      }
    }
  }

  // Bước 3: sinh tất cả cặp (i,j) không lặp O(n²) — thường n≤10
  const uniquePairs: Array<[string, string]> = [];
  for (let i = 0; i < rxCuis.length; i++) {
    for (let j = i + 1; j < rxCuis.length; j++) {
      uniquePairs.push([rxCuis[i]!, rxCuis[j]!]);
    }
  }

  if (uniquePairs.length === 0) {
    return { pairs: [], personalizedWarnings: [] };
  }

  // Bước 4: query interactions cho cả A→B và B→A
  const orConditions = uniquePairs.flatMap(([a, b]) => [
    { ingredientARxCUI: a, ingredientBRxCUI: b },
    { ingredientARxCUI: b, ingredientBRxCUI: a },
  ]);

  const interactions = await InteractionModel.find({
    $or: orConditions,
  }).lean();

  // Map interaction → InteractionPair
  const severityRank: Record<Severity, number> = { nặng: 3, 'trung bình': 2, nhẹ: 1 };
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

  // Bước 5: personalized warnings (nếu user có bệnh nền)
  const personalizedWarnings: PersonalizedWarning[] = [];
  if (userChronicConditions && userChronicConditions.length > 0) {
    const lowerConditions = userChronicConditions.map((c) => c.toLowerCase());
    for (const drug of drugs) {
      for (const warn of drug.warningsForConditions ?? []) {
        if (lowerConditions.some((c) => warn.condition.toLowerCase().includes(c))) {
          personalizedWarnings.push({
            drugId: String(drug._id),
            drugName: drug.brandNameVi,
            condition: warn.condition,
            warningVi: warn.warningVi,
            severity: warn.severity as Severity,
          });
        }
      }
    }
  }

  // Bước 6: sort by severity giảm dần
  pairs.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  personalizedWarnings.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

  return { pairs, personalizedWarnings };
}
