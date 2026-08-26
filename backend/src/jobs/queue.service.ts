import { Queue, Worker, type Job } from 'bullmq';
import { getOptionalRedis } from '../shared/config/redis';
import { logger } from '../shared/config/logger';
import { PriceScraper } from './price-scraper.service';
import { sendReminder } from './reminder.service';
import { syncOpenFDALabels, cleanupExpiredPrices } from './openfda-sync.service';

// Lazy queue factory — chỉ khởi tạo khi có Redis.
// Fallback: jobs chạy in-process trong dev mode.
let reminderQueue: Queue | null = null;
let scraperQueue: Queue | null = null;
let openfdaQueue: Queue | null = null;
let cleanupQueue: Queue | null = null;
let reminderWorker: Worker | null = null;
let scraperWorker: Worker | null = null;
let openfdaWorker: Worker | null = null;
let cleanupWorker: Worker | null = null;

function getQueues() {
  const redis = getOptionalRedis();
  if (!redis) {
    logger.warn('Redis not configured — BullMQ queues disabled, jobs run in-process');
    return { reminderQueue: null, scraperQueue: null, openfdaQueue: null, cleanupQueue: null };
  }
  if (!reminderQueue) {
    reminderQueue = new Queue('medication-reminder', { connection: redis });
    scraperQueue = new Queue('scrape-prices', { connection: redis });
    openfdaQueue = new Queue('sync-openfda', { connection: redis });
    cleanupQueue = new Queue('cleanup-prices', { connection: redis });
  }
  return { reminderQueue, scraperQueue, openfdaQueue, cleanupQueue };
}

export async function scheduleReminder(userId: string, entryId: string, scheduledAt: Date): Promise<void> {
  const { reminderQueue } = getQueues();
  const jobId = `${userId}:${entryId}:${scheduledAt.getTime()}`;
  if (reminderQueue) {
    await reminderQueue.add('remind', { userId, entryId, scheduledAt: scheduledAt.toISOString() }, {
      jobId,
      removeOnComplete: true,
      removeOnFail: 100,
    });
  } else {
    // Dev fallback: log reminder
    logger.info({ userId, entryId, scheduledAt }, 'Reminder scheduled (no Redis)');
  }
}

export async function schedulePriceScrape(pharmacySource?: string): Promise<void> {
  const { scraperQueue } = getQueues();
  if (scraperQueue) {
    await scraperQueue.add('scrape', { pharmacySource }, { removeOnComplete: true, removeOnFail: 100 });
  } else {
    logger.info({ pharmacySource }, 'Price scrape scheduled (no Redis)');
  }
}

export function startWorkers(): void {
  const redis = getOptionalRedis();
  if (!redis) return;

  reminderWorker = new Worker('medication-reminder', async (job: Job) => {
    const { userId, entryId } = job.data as { userId: string; entryId: string };
    await sendReminder(userId, entryId);
    logger.info({ userId, entryId }, 'Reminder sent');
  }, { connection: redis });

  scraperWorker = new Worker('scrape-prices', async (job: Job) => {
    const { pharmacySource } = job.data as { pharmacySource?: string };
    const scraper = new PriceScraper();
    if (pharmacySource) {
      await scraper.scrapePharmacy(pharmacySource);
    } else {
      await scraper.scrapeAll();
    }
    logger.info({ pharmacySource }, 'Price scrape completed');
  }, { connection: redis });

  openfdaWorker = new Worker('sync-openfda', async (_job: Job) => {
    const result = await syncOpenFDALabels();
    logger.info(result, 'OpenFDA sync completed');
  }, { connection: redis });

  cleanupWorker = new Worker('cleanup-prices', async (_job: Job) => {
    const result = await cleanupExpiredPrices();
    logger.info(result, 'Cleanup-prices completed');
  }, { connection: redis });

  reminderWorker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Reminder job failed'));
  scraperWorker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Scrape job failed'));
  openfdaWorker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'OpenFDA job failed'));
  cleanupWorker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Cleanup job failed'));
}

/**
 * Đăng ký repeatable jobs theo cron schedule (Phần 8 spec).
 * - sync-openfda: weekly (Chủ nhật 2h sáng VN) → 19:00 UTC Chủ nhật
 * - scrape-prices: 12 giờ/lần
 * - cleanup-prices: 3:00 UTC hàng ngày
 */
export async function scheduleRecurringJobs(): Promise<void> {
  const queues = getQueues();
  if (!queues.openfdaQueue || !queues.scraperQueue || !queues.cleanupQueue) return;
  await queues.openfdaQueue.add('weekly-sync', {}, {
    repeat: { pattern: '0 19 * * 0' }, // Chủ nhật 19:00 UTC = 02:00 VN
    removeOnComplete: true,
    removeOnFail: 5,
    jobId: 'openfda-weekly',
  });
  await queues.scraperQueue.add('every-12h', {}, {
    repeat: { pattern: '0 */12 * * *' },
    removeOnComplete: true,
    removeOnFail: 5,
    jobId: 'scraper-12h',
  });
  await queues.cleanupQueue.add('daily-cleanup', {}, {
    repeat: { pattern: '0 3 * * *' },
    removeOnComplete: true,
    removeOnFail: 5,
    jobId: 'cleanup-daily',
  });
}

export async function stopWorkers(): Promise<void> {
  await Promise.all([
    reminderWorker?.close(),
    scraperWorker?.close(),
    openfdaWorker?.close(),
    cleanupWorker?.close(),
  ]);
}
