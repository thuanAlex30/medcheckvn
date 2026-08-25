import { PriceModel } from './price.model';
import { DrugModel } from '../drugs/drug.model';
import type { PriceComparisonResponse, AlternativeDrug, DrugSearchHit } from '@medcheck/shared-types';
import { HttpError } from '../../shared/middlewares/error-handler';

// Phần 6.4 — price comparison
export async function getPrices(drugId: string): Promise<PriceComparisonResponse> {
  if (!drugId.match(/^[a-f0-9]{24}$/i)) {
    throw new HttpError(400, 'ID không hợp lệ');
  }
  const prices = await PriceModel.find({ drugId: drugId as unknown as import('mongoose').Types.ObjectId })
    .sort({ price: 1 })
    .lean();

  const entries = prices.map((p) => ({
    id: String(p._id),
    drugId: String(p.drugId),
    pharmacySource: p.pharmacySource as PriceComparisonResponse['prices'][0]['pharmacySource'],
    price: p.price,
    unit: p.unit ?? undefined,
    url: p.url ?? undefined,
    scrapedAt: p.scrapedAt!.toISOString(),
  }));

  const cheapest = entries[0];
  const cheapestPrice = cheapest?.price;

  return { drugId, prices: entries, cheapest, savingsPercent: undefined };
}

// Gợi ý thuốc gốc thay thế (giá rẻ hơn ≥15%)
export async function getAlternativesWithPrices(
  drugId: string,
): Promise<{ drug: DrugSearchHit; cheapestPrice?: number; savingsPercent: number }[]> {
  const target = await DrugModel.findById(drugId as unknown as import('mongoose').Types.ObjectId).lean();
  if (!target) throw new HttpError(404, 'Không tìm thấy thuốc');

  const primaryIng = target.activeIngredients[0];
  if (!primaryIng?.rxCUI) return [];

  const alternatives = await DrugModel.find({
    _id: { $ne: target._id },
    'activeIngredients.rxCUI': primaryIng.rxCUI,
  }).lean();

  if (alternatives.length === 0) return [];

  // Bulk-load giá rẻ nhất cho từng drugId trong 1 round-trip thay vì N+1.
  const drugIds = [target._id, ...alternatives.map((a) => a._id)];
  const allPrices = await PriceModel.aggregate<{
    _id: typeof drugIds[number];
    minPrice: number;
  }>([
    { $match: { drugId: { $in: drugIds } } },
    { $group: { _id: '$drugId', minPrice: { $min: '$price' } } },
  ]);
  const minPriceByDrugId = new Map(allPrices.map((p) => [String(p._id), p.minPrice]));

  const targetPrice = minPriceByDrugId.get(String(target._id));

  const results: AlternativeDrug[] = [];
  for (const alt of alternatives) {
    const altPrice = minPriceByDrugId.get(String(alt._id));
    if (!altPrice || !targetPrice) continue;
    const savings = ((targetPrice - altPrice) / targetPrice) * 100;
    if (savings < 15) continue; // chỉ gợi ý nếu tiết kiệm > 15%
    results.push({
      drug: {
        id: String(alt._id),
        slug: alt.slug,
        brandNameVi: alt.brandNameVi,
        activeIngredients: alt.activeIngredients.map((i) => i.name),
        confidenceLevel: alt.confidenceLevel,
      },
      cheapestPrice: altPrice,
      savingsPercent: Math.round(savings),
    });
  }

  return results.sort((a, b) => (b.savingsPercent ?? 0) - (a.savingsPercent ?? 0));
}
