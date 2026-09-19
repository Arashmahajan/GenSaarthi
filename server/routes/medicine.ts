import { Router, Request, Response, NextFunction } from 'express';
import { validateMedicineRequest } from '../validation/requestValidators';
import { validateMedicineResponse } from '../validation/responseValidators';
import { getSeniorSystemInstruction } from '../prompts/system';
import { getMedicinePrompt, MEDICINE_RESPONSE_SCHEMA } from '../prompts/medicine';
import { callGeminiGenerate } from '../services/gemini';
import { generateHonestFallbackMedicineReply } from '../fallbacks/medicineReply';
import { MedicineExplainerResponse } from '../types';

export const medicineRouter = Router();

medicineRouter.post(['/explain-medicine', '/medicine'], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validateMedicineRequest(req.body);
    if (!validation.isValid || !validation.data) {
      return res.status(validation.error?.statusCode || 400).json({
        error: {
          code: validation.error?.code || 'INVALID_INPUT',
          message: validation.error?.message || 'Please provide a valid medicine name.',
        },
      });
    }

    const { medicineName, dosage, instructions, language, userName } = validation.data;
    const prompt = getMedicinePrompt(medicineName, dosage, instructions, language);
    const systemInstruction = getSeniorSystemInstruction(language, userName);

    try {
      const geminiResult = await callGeminiGenerate(
        [{ role: 'user', parts: [{ text: prompt }] }],
        {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: MEDICINE_RESPONSE_SCHEMA,
        }
      );

      const cleaned = geminiResult.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      const validated = validateMedicineResponse(parsed);

      if (validated.isValid && validated.data) {
        const responseData: MedicineExplainerResponse = {
          ...validated.data,
          source: 'ai',
        };
        return res.json(responseData);
      } else {
        console.warn('[Medicine Route] Response failed schema validation:', validated.errors);
      }
    } catch (aiErr) {
      console.warn('[Medicine Route] AI call failed, using honest fallback.');
    }

    const fallback = generateHonestFallbackMedicineReply(
      medicineName,
      dosage,
      instructions,
      language
    );
    return res.json(fallback);
  } catch (err) {
    next(err);
  }
});
