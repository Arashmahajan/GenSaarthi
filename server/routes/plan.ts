import { Router, Request, Response, NextFunction } from 'express';
import { validatePlanRequest } from '../validation/requestValidators';
import { getSeniorSystemInstruction } from '../prompts/system';
import { getPlanDayPrompt } from '../prompts/plan';
import { callGeminiGenerate } from '../services/gemini';
import { generateHonestFallbackPlanReply } from '../fallbacks/planReply';
import { PlanDayResponse } from '../types';

export const planRouter = Router();

planRouter.post('/plan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validatePlanRequest(req.body);
    if (!validation.isValid || !validation.data) {
      return res.status(validation.error?.statusCode || 400).json({
        error: {
          code: validation.error?.code || 'INVALID_INPUT',
          message: validation.error?.message || 'Invalid day plan request.',
        },
      });
    }

    const { routinesOrNotes, language, userName } = validation.data;
    const prompt = getPlanDayPrompt(routinesOrNotes, language);
    const systemInstruction = getSeniorSystemInstruction(language, userName);

    try {
      const geminiResult = await callGeminiGenerate(
        [{ role: 'user', parts: [{ text: prompt }] }],
        {
          systemInstruction,
          responseMimeType: 'application/json',
        }
      );

      const cleaned = geminiResult.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      parsed.source = 'ai';

      const sanitized: PlanDayResponse = {
        greeting: typeof parsed.greeting === 'string' ? parsed.greeting : 'Namaste! Plan for your day',
        summary:
          typeof parsed.summary === 'string'
            ? parsed.summary
            : 'A comfortable, balanced schedule with regular meals and restful breaks.',
        schedule: Array.isArray(parsed.schedule) ? parsed.schedule : [],
        wellnessNote:
          typeof parsed.wellnessNote === 'string'
            ? parsed.wellnessNote
            : 'May your day be peaceful, calm, and full of good health.',
        source: 'ai',
      };

      if (sanitized.schedule.length > 0) {
        return res.json(sanitized);
      }
    } catch (aiErr) {
      console.warn('[Plan Route] AI call failed, using honest fallback plan.');
    }

    const fallback = generateHonestFallbackPlanReply(routinesOrNotes, language);
    return res.json(fallback);
  } catch (err) {
    next(err);
  }
});
