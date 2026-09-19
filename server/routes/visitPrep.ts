import { Router, Request, Response } from 'express';
import { validateVisitPrepRequest } from '../validation/requestValidators';
import { getSeniorSystemInstruction } from '../prompts/system';
import { getVisitPrepPrompt, VISIT_PREP_RESPONSE_SCHEMA } from '../prompts/visitPrep';
import { callGeminiGenerate } from '../services/gemini';
import { generateHonestFallbackVisitPrepReply } from '../fallbacks/visitPrepReply';
import { VisitPrepResponse } from '../types';

export const visitPrepRouter = Router();

visitPrepRouter.post(['/visit-prep', '/doctor-prep'], async (req: Request, res: Response) => {
  try {
    const validation = validateVisitPrepRequest(req.body);
    if (!validation.isValid || !validation.data) {
      return res.status(validation.error?.statusCode || 400).json({
        error: {
          code: validation.error?.code || 'INVALID_INPUT',
          message: validation.error?.message || 'Please provide valid medicine names.',
        },
      });
    }

    const { medicineNames, language, userName } = validation.data;
    const prompt = getVisitPrepPrompt(medicineNames, language);
    const systemInstruction = getSeniorSystemInstruction(language, userName);

    try {
      const geminiResult = await callGeminiGenerate(
        [{ role: 'user', parts: [{ text: prompt }] }],
        {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: VISIT_PREP_RESPONSE_SCHEMA,
        }
      );

      const cleaned = geminiResult.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        const cleanQuestions = parsed.questions
          .filter((q: any) => typeof q === 'string' && q.trim().length > 0)
          .slice(0, 6)
          .map((q: string) => q.trim().slice(0, 140));

        const responseData: VisitPrepResponse = {
          questions: cleanQuestions,
          disclaimer:
            typeof parsed.disclaimer === 'string' && parsed.disclaimer.trim().length > 0
              ? parsed.disclaimer.trim()
              : language === 'hi'
              ? 'ये डॉक्टर से पूछने के सवाल हैं। निर्णय हमेशा आपके डॉक्टर का होगा।'
              : 'These are questions to ask. Your doctor decides.',
          source: 'ai',
        };
        return res.json(responseData);
      }
    } catch (aiErr) {
      console.warn('[VisitPrep Route] AI call failed, using honest fallback.');
    }

    const fallback = generateHonestFallbackVisitPrepReply(medicineNames, language);
    return res.json(fallback);
  } catch (err: any) {
    console.error('[VisitPrep Route] Error handling request:', err?.message || err);
    const fallback = generateHonestFallbackVisitPrepReply(
      [],
      req.body?.language === 'hi' ? 'hi' : 'en'
    );
    return res.json(fallback);
  }
});
