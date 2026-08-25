import { PriceModel } from '../modules/prices/price.model';
import { DrugModel } from '../modules/drugs/drug.model';
import { logger } from '../shared/config/logger';

// Stub implementation — theo spec Phần 6.4:
// "Tôn trọng robots.txt, giới hạn 1 request/2 giây/domain"
// Production: implement thật dựa trên Puppeteer/Playwright + respect robots.txt.
export class PriceScraper {
  private readonly delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async scrapeAll(): Promise<void> {
    const pharmacies = ['Long Châu', 'Pharmacity', 'An Khang'];
    for (const p of pharmacies) {
      await this.scrapePharmacy(p);
      await this.delay(2000); // rate limit per domain
    }
  }

  async scrapePharmacy(pharmacySource: string): Promise<void> {
    logger.info({ pharmacySource }, 'Starting price scrape (stub)');
    // TODO: implement real scraping:
    // 1. Respect robots.txt (check with fetch('https://.../robots.txt'))
    // 2. Scrape drug price pages (Long Chau, Pharmacity public APIs if available)
    // 3. Upsert PriceModel documents
    // For now: generate mock data for drugs that exist in DB
    const drugs = await DrugModel.find({}, '_id', { limit: 20 }).lean();
    for (const drug of drugs) {
      // Skip if we already have recent price for this pharmacy
      const existing = await PriceModel.findOne({
        drugId: drug._id,
        pharmacySource,
        scrapedAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }, // within 12h
      }).lean();
      if (existing) continue;

      // Generate realistic-looking mock price (stub)
      const basePrice = Math.round(20000 + Math.random() * 150000);
      await PriceModel.create({
        drugId: drug._id,
        pharmacySource,
        price: basePrice,
        unit: 'hộp',
        scrapedAt: new Date(),
      });
    }
    logger.info({ pharmacySource, count: drugs.length }, 'Price scrape stub complete');
  }
}
