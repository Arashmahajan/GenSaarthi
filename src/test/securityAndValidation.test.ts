import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import {
  validateCheckRequest,
  validateMedicineRequest,
  validatePlanRequest,
  validateChatRequest,
} from '../../server/validation/requestValidators';
import {
  validateUnifiedCheckResponse,
  validateMedicineResponse,
  validatePlanDayResponse,
} from '../../server/validation/responseValidators';

describe('Request Validation & Security Protections', () => {
  it('rejects empty check request', () => {
    const res = validateCheckRequest({});
    expect(res.isValid).toBe(false);
    expect(res.error?.code).toBe('MISSING_INPUT');
  });

  it('rejects images with fake extensions and invalid magic bytes', () => {
    // A string of text disguised as a JPEG base64
    const fakeJpegBase64 = Buffer.from('NOT_A_REAL_JPEG_IMAGE_HEADER').toString('base64');
    const res = validateCheckRequest({
      image: `data:image/jpeg;base64,${fakeJpegBase64}`,
    });
    expect(res.isValid).toBe(false);
    expect(res.error?.code).toBe('INVALID_IMAGE_SIGNATURE');
  });

  it('accepts valid JPEG magic bytes signature', () => {
    // Valid JPEG starts with 0xFF 0xD8 0xFF followed by dummy bytes
    const validJpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const res = validateCheckRequest({
      image: `data:image/jpeg;base64,${validJpegHeader.toString('base64')}`,
    });
    expect(res.isValid).toBe(true);
    expect(res.data?.imageMimeType).toBe('image/jpeg');
  });

  it('accepts valid PNG magic bytes signature', () => {
    // Valid PNG starts with 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    const validPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const res = validateCheckRequest({
      image: `data:image/png;base64,${validPngHeader.toString('base64')}`,
    });
    expect(res.isValid).toBe(true);
    expect(res.data?.imageMimeType).toBe('image/png');
  });

  it('validates medicine request requiring non-empty medicine name', () => {
    const invalidRes = validateMedicineRequest({ medicineName: '   ' });
    expect(invalidRes.isValid).toBe(false);
    expect(invalidRes.error?.code).toBe('MISSING_MEDICINE_NAME');

    const validRes = validateMedicineRequest({
      medicineName: 'Amlodipine 5mg',
      dosage: 'Once daily',
      instructions: 'Morning after food',
    });
    expect(validRes.isValid).toBe(true);
    expect(validRes.data?.medicineName).toBe('Amlodipine 5mg');
  });

  it('validates chat request requiring message', () => {
    const emptyRes = validateChatRequest({ message: '' });
    expect(emptyRes.isValid).toBe(false);
    expect(emptyRes.error?.code).toBe('MISSING_MESSAGE');

    const validRes = validateChatRequest({
      message: 'Hello Saarthi',
      conversationHistory: [
        { role: 'user', text: 'Namaste' },
      ],
    });
    expect(validRes.isValid).toBe(true);
    expect(validRes.data?.message).toBe('Hello Saarthi');
  });

  it('validates response schemas strictly and sanitizes unexpected values', () => {
    const checkObj = {
      kind: 'unknown_kind',
      title: 'Test Title',
      summary: 'Test Summary',
      steps: ['Step 1'],
      risk: 'safe',
      riskReason: 'Clean',
      redFlags: [],
      amountDue: null,
      dueDate: null,
      jargon: [],
      reminder: null,
      medicine: null,
      helpline: null,
    };
    const res = validateUnifiedCheckResponse(checkObj);
    expect(res.isValid).toBe(true);
    expect(res.data?.kind).toBe('other'); // Sanitized to 'other'
  });
});

describe('Security Headers and Error Consistency', () => {
  it('includes security headers on all responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('returns consistent JSON error format on validation failure', async () => {
    const res = await request(app)
      .post('/api/medicine')
      .send({ medicineName: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
    expect(typeof res.body.error.message).toBe('string');
  });
});
