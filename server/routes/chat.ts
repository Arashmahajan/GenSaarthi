import { Router, Request, Response, NextFunction } from 'express';
import { validateChatRequest } from '../validation/requestValidators';
import { getSeniorSystemInstruction } from '../prompts/system';
import { getChatUserPrompt } from '../prompts/chat';
import { callGeminiGenerate, callGeminiStream } from '../services/gemini';
import { generateHonestFallbackChatReply } from '../fallbacks/chatReply';

export const chatRouter = Router();

chatRouter.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validateChatRequest(req.body);
    if (!validation.isValid || !validation.data) {
      return res.status(validation.error?.statusCode || 400).json({
        error: {
          code: validation.error?.code || 'INVALID_INPUT',
          message: validation.error?.message || 'Please provide a valid question.',
        },
      });
    }

    const { message, conversationHistory, language, userName, stream } = validation.data;
    const systemInstruction = getSeniorSystemInstruction(language, userName);

    // Prepare contents array for Gemini
    const contents: any[] = [];
    for (const turn of conversationHistory) {
      contents.push({
        role: turn.role,
        parts: [{ text: turn.text }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: getChatUserPrompt(message) }],
    });

    // If client requested SSE streaming
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let clientConnected = true;
      req.on('close', () => {
        clientConnected = false;
      });

      try {
        const streamIterable = await callGeminiStream(contents, {
          systemInstruction,
        });

        for await (const chunk of streamIterable) {
          if (!clientConnected || res.writableEnded) {
            break;
          }
          const chunkText = chunk.text || '';
          if (chunkText) {
            res.write(`data: ${JSON.stringify({ chunk: chunkText, source: 'ai' })}\n\n`);
          }
        }

        if (clientConnected && !res.writableEnded) {
          res.write(`data: [DONE]\n\n`);
          res.end();
        }
        return;
      } catch (streamErr) {
        if (clientConnected && !res.writableEnded) {
          console.warn('[Chat Route] Streaming error, sending fallback chunk.');
          const fallbackText = generateHonestFallbackChatReply(message, language);
          res.write(`data: ${JSON.stringify({ chunk: fallbackText, source: 'fallback' })}\n\n`);
          res.write(`data: [DONE]\n\n`);
          res.end();
        }
        return;
      }
    }

    // Standard non-streaming JSON response
    try {
      const result = await callGeminiGenerate(contents, {
        systemInstruction,
      });

      const reply = result.text.trim();
      if (reply) {
        return res.json({ reply, source: 'ai' });
      }
    } catch (aiErr) {
      console.warn('[Chat Route] AI call unavailable, using fallback chat reply.');
    }

    const fallbackReply = generateHonestFallbackChatReply(message, language);
    return res.json({ reply: fallbackReply, source: 'fallback' });
  } catch (err) {
    next(err);
  }
});
