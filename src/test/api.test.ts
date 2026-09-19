import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../server/services/gemini', async () => {
  const actual = await vi.importActual<any>('../../server/services/gemini');
  return {
    ...actual,
    callGeminiGenerate: vi.fn(async (contents) => {
      const prompt = JSON.stringify(contents);

      if (prompt.includes('Senior Medicine Explainer')) {
        return {
          text: JSON.stringify({
            simpleName: 'Telma 40',
            whatItDoes: 'Helps control high blood pressure safely.',
            bestTimeToTake: 'Morning after breakfast',
            foodGuidance: 'Take after eating breakfast with a full glass of water',
            simplePrecautions: [
              'Take at the same fixed time each day',
              'Do not skip or stop abruptly without doctor guidance',
            ],
            missedDoseAdvice: 'Take as soon as remembered unless close to next dose',
            storageTip: 'Store in cool and dry place',
            disclaimer: 'Always consult your physician.',
          }),
        };
      }

      if (prompt.includes('Senior Day Planner')) {
        return {
          text: JSON.stringify({
            greeting: 'Namaste! Here is a peaceful plan for your day.',
            summary: 'A gentle and balanced schedule with regular meals and prayer.',
            schedule: [
              { time: '07:00 AM', activity: 'Morning walk and warm water', advice: 'Keep it gentle' },
              { time: '08:30 AM', activity: 'Nutritious breakfast and medicine', advice: 'Take with food' },
            ],
            wellnessNote: 'Drink plenty of water and rest well.',
          }),
        };
      }

      if (prompt.includes('conversational Indian elder companion')) {
        return {
          text: 'Namaste! I am Saarthi, your companion. How can I assist you with joy today?',
        };
      }

      if (prompt.includes('Analyze this message') || prompt.includes('user_content')) {
        if (prompt.includes('BESCOM') || prompt.includes('Electricity Bill')) {
          return {
            text: JSON.stringify({
              kind: 'bill',
              title: 'BESCOM Electricity Bill',
              summary: 'Your monthly electricity bill for home usage.',
              steps: ['Pay Rs 1,450 before the due date', 'Keep transaction receipt'],
              risk: 'safe',
              riskReason: 'Genuine utility bill format with official identifiers.',
              redFlags: [],
              amountDue: 'Rs 1,450.00',
              dueDate: '28-Feb-2026',
              jargon: [{ term: 'BESCOM', meaning: 'Bangalore Electricity Supply Company' }],
              reminder: {
                title: 'Pay BESCOM Bill',
                dueDate: '2026-02-28',
                note: 'Rs 1,450',
              },
              medicine: null,
              helpline: '1912',
            }),
          };
        }

        return {
          text: JSON.stringify({
            kind: 'other',
            title: 'Suspicious Electricity Disconnection SMS',
            summary: 'Scammers threaten power cutoff to induce fear.',
            steps: ['Verify directly with electricity office', 'Block sender'],
            risk: 'scam',
            riskReason: 'Urgent disconnection threat with unknown phone number.',
            redFlags: ['Urgent threat of power disconnection', 'Unofficial phone number provided'],
            amountDue: null,
            dueDate: null,
            jargon: [],
            reminder: null,
            medicine: null,
            helpline: '1930',
          }),
        };
      }

      return {
        text: JSON.stringify({ status: 'ok' }),
      };
    }),
  };
});

import { app } from '../../server';

describe('Saarthi Backend API Endpoints', () => {
  it('GET /api/health returns healthy status and configured Gemini model', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('Saarthi Senior Companion API');
    expect(res.body.geminiModel).toBeDefined();
  });

  it('POST /api/check identifies scam patterns and extracts warning points', async () => {
    const scamMessage = 'Dear customer, your electricity will be disconnected tonight at 9:30 PM due to unpaid bill. Call officer immediately at 9876543210.';
    const res = await request(app)
      .post('/api/check')
      .send({ text: scamMessage, language: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.risk).toBe('scam');
    expect(res.body.title).toBeDefined();
    expect(res.body.riskReason).toBeDefined();
    expect(Array.isArray(res.body.steps)).toBe(true);
    expect(Array.isArray(res.body.redFlags)).toBe(true);
    expect(res.body.helpline).toBe('1930');
  });

  it('POST /api/check honors word boundary matching for PAN without false alarms', async () => {
    // A normal message with "company" or "span" should not falsely match "pan"
    const safeText = 'The company lifespan and pantry are being cleaned today.';
    const res = await request(app)
      .post('/api/check')
      .send({ text: safeText, language: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.title).not.toContain('PAN');
  });

  it('POST /api/check simplifies electricity bills and extracts due amount', async () => {
    const billText = `BESCOM Electricity Bill
Consumer ID: 123456789
Total Amount Payable: Rs 1,450.00
Due Date: 28-Feb-2026`;
    const res = await request(app)
      .post('/api/check')
      .send({ text: billText, language: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.kind).toBe('bill');
    expect(res.body.amountDue).toMatch(/1,450|1450/);
    expect(res.body.dueDate).toBe('28-Feb-2026');
  });

  it('POST /api/medicine explains medicine clearly for seniors', async () => {
    const res = await request(app)
      .post('/api/medicine')
      .send({
        medicineName: 'Telma 40',
        dosage: '1 tablet daily after breakfast',
        instructions: 'Take in morning',
        language: 'en',
      });

    expect(res.status).toBe(200);
    expect(res.body.simpleName).toBe('Telma 40');
    expect(res.body.whatItDoes).toBeDefined();
    expect(res.body.bestTimeToTake).toBeDefined();
    expect(res.body.disclaimer).toBeDefined();
  });

  it('POST /api/plan generates a calm, structured senior daily schedule', async () => {
    const res = await request(app)
      .post('/api/plan')
      .send({
        routinesOrNotes: 'Need time for walking, medicine after breakfast, and evening bhajan.',
        language: 'en',
      });

    expect(res.status).toBe(200);
    expect(res.body.greeting).toBeDefined();
    expect(Array.isArray(res.body.schedule)).toBe(true);
    expect(res.body.schedule.length).toBeGreaterThan(0);
    expect(res.body.schedule[0].time).toBeDefined();
    expect(res.body.schedule[0].activity).toBeDefined();
  });

  it('POST /api/chat responds respectfully in conversation', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Namaste Saarthi, how are you today?',
        conversationHistory: [],
        language: 'en',
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
    expect(typeof res.body.reply).toBe('string');
  });

  it('handles unknown /api routes with clean JSON 404', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
