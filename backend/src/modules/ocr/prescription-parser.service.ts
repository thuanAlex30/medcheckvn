import { hasVision, env } from '../../shared/config/env';
import { logger } from '../../shared/config/logger';
import { searchDrugs } from '../drugs/drug.service';
import { similarity } from '../../shared/utils/vietnamese-slug';
import type { OcrResponse, OcrDetectedLine } from '@medcheck/shared-types';

const HIGH_CONF = 0.8;
const MED_CONF = 0.5;

// Phần 6.3 — OCR Prescription Parser.
// Nếu GOOGLE_VISION_API_KEY trống → dùng stub response (dev mode).
export async function ocrPrescription(imageBuffer: Buffer): Promise<OcrResponse> {
  if (!hasVision) {
    logger.warn('Vision API not configured — returning stub OCR response');
    return stubOcrResponse();
  }

  try {
    const base64 = imageBuffer.toString('base64');
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      logger.error({ status: response.status }, 'Vision API error');
      return stubOcrResponse();
    }

    const json = await response.json() as {
      responses: Array<{
        textAnnotations?: Array<{ description?: string }>;
        fullTextAnnotation?: { text?: string };
      }>;
    };

    const fullText = json.responses?.[0]?.fullTextAnnotation?.text ?? '';
    if (!fullText) return { detectedLines: [], fullText };

    const lines = fullText.split('\n').filter(Boolean);
    const detectedLines = await Promise.all(lines.map((rawText) => matchDrugLine(rawText)));

    return { detectedLines, fullText };
  } catch (err) {
    logger.error({ err }, 'Vision API call failed');
    return stubOcrResponse();
  }
}

async function matchDrugLine(rawText: string): Promise<OcrDetectedLine> {
  // Tách tên thuốc khỏi hàm lượng/số lượng bằng regex đơn giản
  const drugName = rawText.replace(/\d+\s*(?:mg|g|ml|iu|mcg)\s*[x×]?\s*\d*/gi, '').trim();
  if (!drugName || drugName.length < 3) {
    return { rawText, matchedDrugId: null, matchedDrugName: null, matchConfidence: 0, note: 'Không nhận diện được tên thuốc' };
  }

  // Fuzzy search trong DB
  const { results } = await searchDrugs(drugName, 5);
  if (results.length === 0) {
    return { rawText, matchedDrugId: null, matchedDrugName: null, matchConfidence: 0.1, note: 'Không tìm thấy thuốc trong cơ sở dữ liệu' };
  }

  const topHit = results[0]!;
  const sim = similarity(drugName, topHit.brandNameVi);

  if (sim >= HIGH_CONF) {
    return { rawText, matchedDrugId: topHit.id, matchedDrugName: topHit.brandNameVi, matchConfidence: sim };
  }
  if (sim >= MED_CONF) {
    return {
      rawText,
      matchedDrugId: topHit.id,
      matchedDrugName: topHit.brandNameVi,
      matchConfidence: sim,
      note: 'Cần xác nhận thủ công',
      suggestions: results.slice(0, 3),
    };
  }
  return {
    rawText,
    matchedDrugId: topHit.id,
    matchedDrugName: topHit.brandNameVi,
    matchConfidence: sim,
    note: 'Cần xác nhận thủ công',
    suggestions: results.slice(0, 3),
  };
}

function stubOcrResponse(): OcrResponse {
  return {
    detectedLines: [
      {
        rawText: 'Paracetamol 500mg x 20',
        matchedDrugId: null,
        matchedDrugName: null,
        matchConfidence: 0,
        note: 'Vision API chưa cấu hình — đây là dữ liệu mẫu. Cần GOOGLE_VISION_API_KEY để nhận diện thật.',
      },
    ],
    fullText: 'Paracetamol 500mg x 20\n(OCR stub — cần API key thật)',
  };
}
