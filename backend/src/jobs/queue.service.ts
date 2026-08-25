import { Queue, Worker, type Job } from 'bullmq';
import { getOptionalRedis, getRedis } from '../shared/config/redis';
import { logger } from '../shared/config/logger';
import { PriceModel } from '../modules/prices/price.model';
import { PriceScraper } from './price-scraper.service';
import { sendReminder } from './reminder.service';

// Lazy queue factory — chỉ khởi tạo khi có Redis.
// Fallback: jobs chạy in-process trong dev mode.
let reminderQueue: Queue | null = null;
let scraperQueue: Queue | null = null;
let reminderWorker: Worker | null = null;
let scraperWorker: Worker | null = null;

function getQueues() {
  const redis = getOptionalRedis();
  if (!redis) {
    logger.warn('Redis not configured — BullMQ queues disabled, jobs run in-process');
    return { reminderQueue: null, scraperQueue: null };
  }
  if (!reminderQueue) {
    reminderQueue = new Queue('medication-reminder', { connection: redis });
    scraperQueue = new Queue('scrape-prices', { connection: redis });
  }
  return { reminderQueue, scraperQueue };
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

  reminderWorker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Reminder job failed'));
  scraperWorker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Scrape job failed'));
}

export async function stopWorkers(): Promise<void> {
  await reminderWorker?.close();
  await scraperWorker?.close();
}
