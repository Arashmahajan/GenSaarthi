import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL, LIMITS } from '../config';

let clientInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return clientInstance;
}

export interface GeminiCallOptions {
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  timeoutMs?: number;
}

export async function callGeminiGenerate(
  contents: any,
  options: GeminiCallOptions = {}
): Promise<{ text: string; error?: null }> {
  const ai = getGeminiClient();
  if (!ai) {
    const err: any = new Error('Gemini API key is not configured');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const timeoutMs = options.timeoutMs || LIMITS.GEMINI_TIMEOUT_MS;

  const generatePromise = ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: options.systemInstruction,
      responseMimeType: options.responseMimeType,
      responseSchema: options.responseSchema,
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      const err: any = new Error('AI request timed out');
      err.code = 'TIMEOUT';
      reject(err);
    }, timeoutMs);
    // Unref timer if node supports it
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  });

  try {
    const response = await Promise.race([generatePromise, timeoutPromise]);
    const text = response.text || '';
    return { text };
  } catch (err: any) {
    mapGeminiError(err);
    throw err;
  }
}

export async function callGeminiStream(
  contents: any,
  options: GeminiCallOptions = {}
): Promise<AsyncIterable<any>> {
  const ai = getGeminiClient();
  if (!ai) {
    const err: any = new Error('Gemini API key is not configured');
    err.code = 'NO_API_KEY';
    throw err;
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: options.systemInstruction,
      },
    });
    return responseStream;
  } catch (err: any) {
    mapGeminiError(err);
    throw err;
  }
}

function mapGeminiError(err: any): void {
  // Safe server log without sensitive payload
  const errCode = err?.code || err?.status || 'UNKNOWN';
  console.warn(`[Gemini Service] Operation failed (${errCode})`);

  if (err.code === 'TIMEOUT') {
    err.clientMessage = 'The request took longer than 20 seconds. Falling back to safety scanner.';
    err.statusCode = 504;
    return;
  }

  if (err.status === 429 || errCode === 'RESOURCE_EXHAUSTED' || String(err?.message).includes('429')) {
    err.code = 'AI_RATE_LIMITED';
    err.clientMessage = 'The AI companion is busy right now. Falling back to offline scanner.';
    err.statusCode = 429;
    return;
  }

  if (err?.promptFeedback?.blockReason || String(err?.message).includes('SAFETY')) {
    err.code = 'AI_SAFETY_BLOCKED';
    err.clientMessage = 'Content could not be evaluated by AI due to safety policies. Using offline scanner.';
    err.statusCode = 400;
    return;
  }

  err.clientMessage = 'AI assistant could not complete the request. Falling back to safety scanner.';
}
