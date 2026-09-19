import { Router, Request, Response, NextFunction } from 'express';
import { validateCheckRequest } from '../validation/requestValidators';
import { validateUnifiedCheckResponse } from '../validation/responseValidators';
import { getSeniorSystemInstruction } from '../prompts/system';
import { getUnifiedCheckPrompt, CHECK_RESPONSE_SCHEMA } from '../prompts/check';
import { callGeminiGenerate } from '../services/gemini';
import { generateHonestFallbackCheck } from '../fallbacks/documentScan';
import { UnifiedCheckResponse } from '../types';

export const checkRouter = Router();

checkRouter.post('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validateCheckRequest(req.body);
    if (!validation.isValid || !validation.data) {
      return res.status(validation.error?.statusCode || 400).json({
        error: {
          code: validation.error?.code || 'INVALID_INPUT',
          message: validation.error?.message || 'Invalid check request.',
        },
      });
    }

    const { text, imageCleanBase64, imageMimeType, language, userName } = validation.data;

    const contentsPayload: any[] = [];
    if (imageCleanBase64 && imageMimeType) {
      contentsPayload.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageCleanBase64,
        },
      });
    }

    contentsPayload.push(getUnifiedCheckPrompt(text, language));

    const systemInstruction = getSeniorSystemInstruction(language, userName);

    try {
      const geminiResult = await callGeminiGenerate(contentsPayload, {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: CHECK_RESPONSE_SCHEMA,
      });

      const cleanedText = geminiResult.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const parsed = JSON.parse(cleanedText);
      parsed.source = 'ai';

      const responseValidation = validateUnifiedCheckResponse(parsed);
      if (responseValidation.isValid && responseValidation.data) {
        return res.json(responseValidation.data);
      } else {
        console.warn(
          '[Check Route] Gemini response failed schema validation:',
          responseValidation.errors
        );
      }
    } catch (aiErr) {
      // AI call or parse failed - log safe warning and continue to honest fallback
      console.warn('[Check Route] AI check unavailable, falling back to rule-based scanner.');
    }

    // Honest fallback execution: Never invent fake amounts, dates, or arrears
    const fallbackResult: UnifiedCheckResponse = generateHonestFallbackCheck(text || '', language);
    return res.json(fallbackResult);
  } catch (err) {
    next(err);
  }
});
