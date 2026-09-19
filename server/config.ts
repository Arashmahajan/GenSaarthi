import dotenv from 'dotenv';
dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

export const LIMITS = {
  MAX_TEXT_LENGTH: 4000,
  MAX_CHAT_MESSAGE_LENGTH: 1000,
  MAX_CHAT_HISTORY_TURNS: 6,
  MAX_MEDICINE_NAME_LENGTH: 100,
  MAX_PLAN_TEXT_LENGTH: 2000,
  MAX_IMAGE_SIZE_BYTES: 4 * 1024 * 1024, // 4MB decoded
  JSON_BODY_LIMIT: '5mb',
  GEMINI_TIMEOUT_MS: 20000, // 20 seconds
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
};

export const HELPLINES = {
  EMERGENCY: '112',
  ELDERLINE: '14567',
  CYBER_CRIME: '1930',
  AMBULANCE: '108',
};

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
