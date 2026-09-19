import { Router } from 'express';
import { GEMINI_MODEL } from '../config';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Saarthi Senior Companion API',
    geminiModel: GEMINI_MODEL,
    timestamp: new Date().toISOString(),
  });
});
