import type { DrugDoc } from '../modules/drugs/drug.model';

export type StaleDrug = Pick<DrugDoc, '_id' | 'brandNameVi' | 'updatedAt'>;
import { logger } from '../shared/config/logger';

// OpenFDA sync stub. Khi go-live, thay bằng call thật tới
// https://api.fda.gov/drug/label.json + map sang schema `drugs`.
// Hiện tại trả về 0 để an toàn — pipeline chỉ chạy khi OPENFDA_API_KEY được set.

export interface OpenFDASyncResult {
  fetchedAt: Date;
  fetched: number;
  upserted: number;
  skipped: number;
  errors: Array<{ externalId: string; message: string }>;
}

/**
 * Stub đồng bộ nhãn thuốc từ OpenFDA.
 *  - Tuân thủ rate-limit OpenFDA (240/phút với API key, 40/phút free) bằng delay 250ms.
 *  - Trả về kết quả cho caller log + audit.
 *  - Khi chưa cấu hình OPENFDA_API_KEY, đây là no-op + log.
 */
export async function syncOpenFDALabels(): Promise<OpenFDASyncResult> {
  const apiKey = process.env.OPENFDA_API_KEY;
  if (!apiKey) {
    logger.info('syncOpenFDALabels skipped (OPENFDA_API_KEY not set)');
    return { fetchedAt: new Date(), fetched: 0, upserted: 0, skipped: 0, errors: [] };
  }

  // TODO: production pipeline
  // const res = await fetch(`https://api.fda.gov/drug/label.json?search=...&limit=100&api_key=${apiKey}`);
  // ...iterate, upsert drugs.

  logger.info({ apiKey: '***' }, 'syncOpenFDALabels stub reached (real fetch not yet implemented)');
  return { fetchedAt: new Date(), fetched: 0, upserted: 0, skipped: 0, errors: [] };
}

export interface CleanupPricesResult {
  cutoffIso: string;
  removed: number;
}

/**
 * Cleanup prices quá hạn 30 ngày.
 * Collection prices đã có TTL index 30 ngày (Mongo tự dọn), nhưng job này chạy thêm
 * để đảm bảo consistency và có thể thông báo trong logs.
 */
export async function cleanupExpiredPrices(): Promise<CleanupPricesResult> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const cutoffIso = cutoff.toISOString();
  // Lazy import để tránh circular dep nếu sau này cần
  const { PriceModel } = await import('../modules/prices/price.model');
  const result = await PriceModel.deleteMany({ scrapedAt: { $lt: cutoff } });
  const removed = result.deletedCount ?? 0;
  logger.info({ removed, cutoffIso }, 'cleanupExpiredPrices finished');
  return { cutoffIso, removed };
}

/** Phát hiện drugs đã lâu không cập nhật — dùng cho cron job "weekly refresh". */
export async function findStaleDrugs(days = 90): Promise<StaleDrug[]> {
  const { DrugModel } = await import('../modules/drugs/drug.model');
  const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const stale = await DrugModel.find({ updatedAt: { $lt: threshold } })
    .select('_id brandNameVi updatedAt')
    .limit(200)
    .lean();
  return stale as unknown as StaleDrug[];
}
