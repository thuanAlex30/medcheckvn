import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../shared/middlewares/error-handler';
import { ocrLimiter } from '../../shared/middlewares/rate-limiter';
import { ocrPrescription } from './prescription-parser.service';

export const ocrRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ chấp nhận file ảnh'));
    }
    cb(null, true);
  },
});

ocrRouter.post(
  '/prescription',
  ocrLimiter,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'NoImage', message: 'Cần upload ảnh đơn thuốc' });
      return;
    }
    const result = await ocrPrescription(req.file.buffer);
    res.json(result);
  }),
);
