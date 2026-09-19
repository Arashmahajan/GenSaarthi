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
  const controller = new AbortController();

  let timer: NodeJS.Timeout | null = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: options.systemInstruction,
        responseMimeType: options.responseMimeType,
        responseSchema: options.responseSchema,
        abortSignal: controller.signal,
      },
    });

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    const text = response.text || '';
    return { text };
  } catch (err: any) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (controller.signal.aborted || err?.name === 'AbortError') {
      const timeoutErr: any = new Error('AI request timed out');
      timeoutErr.code = 'TIMEOUT';
      mapGeminiError(timeoutErr);
      throw timeoutErr;
    }
    mapGeminiError(err);
    throw err;
  }
}

export async function* callGeminiStream(
  contents: any,
  options: GeminiCallOptions = {}
): AsyncGenerator<any, void, unknown> {
  const ai = getGeminiClient();
  if (!ai) {
    const err: any = new Error('Gemini API key is not configured');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const timeoutMs = options.timeoutMs || LIMITS.GEMINI_TIMEOUT_MS;
  const controller = new AbortController();

  let chunkTimer: NodeJS.Timeout | null = null;
  const resetChunkTimer = () => {
    if (chunkTimer) clearTimeout(chunkTimer);
    chunkTimer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    if (typeof chunkTimer.unref === 'function') {
      chunkTimer.unref();
    }
  };

  resetChunkTimer();

  try {
    const responseStream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: options.systemInstruction,
        abortSignal: controller.signal,
      },
    });

    for await (const chunk of responseStream) {
      resetChunkTimer();
      yield chunk;
    }
  } catch (err: any) {
    if (controller.signal.aborted || err?.name === 'AbortError') {
      const timeoutErr: any = new Error('AI streaming timed out');
      timeoutErr.code = 'TIMEOUT';
      mapGeminiError(timeoutErr);
      throw timeoutErr;
    }
    mapGeminiError(err);
    throw err;
  } finally {
    if (chunkTimer) {
      clearTimeout(chunkTimer);
    }
  }
}

export async function verifyGeminiModelAtStartup(): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('[Gemini Service] GEMINI_API_KEY not set - running in honest fallback mode.');
    return false;
  }

  try {
    const ai = getGeminiClient();
    if (!ai) return false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: 'Ping',
      config: {
        maxOutputTokens: 1,
        abortSignal: controller.signal,
      },
    });
    clearTimeout(timer);
    console.log(`[Gemini Service] Model "${GEMINI_MODEL}" verified and ready.`);
    return true;
  } catch (err: any) {
    console.warn(`[Gemini Service] Model startup ping notice: ${err?.message || err}`);
    return false;
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
