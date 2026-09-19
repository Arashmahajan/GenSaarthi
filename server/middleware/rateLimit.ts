import rateLimit from 'express-rate-limit';
import { LIMITS } from '../config';

// General rate limiter for non-heavy endpoints
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

// Dedicated rate limiter for AI generation endpoints (/api/chat, /api/medicine, /api/plan)
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 35, // 35 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'Please wait a moment before sending another request to Saarthi.',
    },
  },
});

// Dedicated rate limiter for document photo upload & scanning (/api/check)
export const uploadRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 20, // 20 uploads per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'You have checked several documents recently. Please wait a couple minutes before uploading more.',
    },
  },
});
