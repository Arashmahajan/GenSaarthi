import { Router, Request, Response, NextFunction } from 'express';
import { validateMedicineRequest } from '../validation/requestValidators';
import { getSeniorSystemInstruction } from '../prompts/system';
import { getMedicinePrompt } from '../prompts/medicine';
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
        }
      );

      const cleaned = geminiResult.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      parsed.source = 'ai';

      const sanitized: MedicineExplainerResponse = {
        simpleName: typeof parsed.simpleName === 'string' ? parsed.simpleName : medicineName,
        whatItDoes:
          typeof parsed.whatItDoes === 'string'
            ? parsed.whatItDoes
            : 'Prescribed by your doctor to support your daily wellness.',
        bestTimeToTake:
          typeof parsed.bestTimeToTake === 'string'
            ? parsed.bestTimeToTake
            : instructions || 'As advised on the strip.',
        foodGuidance:
          typeof parsed.foodGuidance === 'string'
            ? parsed.foodGuidance
            : 'Take with fresh water as advised by your doctor.',
        simplePrecautions: Array.isArray(parsed.simplePrecautions)
          ? parsed.simplePrecautions
          : ['Take at the same fixed time each day.', 'Do not stop without doctor guidance.'],
        missedDoseAdvice:
          'Please ask your doctor or pharmacist what to do if you miss a dose. Never take a double dose.',
        storageTip:
          typeof parsed.storageTip === 'string'
            ? parsed.storageTip
            : 'Keep in a cool, dry place away from heat, direct sunlight, and moisture.',
        disclaimer: 'I only explain; your doctor decides. Always follow your physician’s exact prescription.',
        source: 'ai',
      };

      return res.json(sanitized);
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
