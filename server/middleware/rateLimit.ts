import rateLimit from 'express-rate-limit';
import { LIMITS } from '../config';

export const apiRateLimiter = rateLimit({
  windowMs: LIMITS.RATE_LIMIT_WINDOW_MS,
  max: LIMITS.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please take a gentle pause and try again in a few minutes.',
    },
  },
});
