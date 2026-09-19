import { Router, Request, Response, NextFunction } from 'express';
import { validatePlanRequest } from '../validation/requestValidators';
import { validatePlanDayResponse } from '../validation/responseValidators';
import { getSeniorSystemInstruction } from '../prompts/system';
import { getPlanDayPrompt, PLAN_RESPONSE_SCHEMA } from '../prompts/plan';
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

    const { routinesOrNotes, language, userName, savedReminders, scheduledMedicines } = validation.data;
    const prompt = getPlanDayPrompt(routinesOrNotes, language, savedReminders, scheduledMedicines);
    const systemInstruction = getSeniorSystemInstruction(language, userName);

    try {
      const geminiResult = await callGeminiGenerate(
        [{ role: 'user', parts: [{ text: prompt }] }],
        {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: PLAN_RESPONSE_SCHEMA,
        }
      );

      const cleaned = geminiResult.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      const validated = validatePlanDayResponse(parsed);

      if (validated.isValid && validated.data) {
        const responseData: PlanDayResponse = {
          ...validated.data,
          source: 'ai',
        };
        return res.json(responseData);
      } else {
        console.warn('[Plan Route] Response failed schema validation:', validated.errors);
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
