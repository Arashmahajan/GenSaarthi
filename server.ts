import express from 'express';
import path from 'path';
import { PORT, LIMITS, TRUST_PROXY } from './server/config';
import { securityHeaders } from './server/middleware/security';
import { apiRateLimiter, aiRateLimiter, uploadRateLimiter } from './server/middleware/rateLimit';
import { errorHandler } from './server/middleware/errorHandler';
import { healthRouter } from './server/routes/health';
import { checkRouter } from './server/routes/check';
import { chatRouter } from './server/routes/chat';
import { medicineRouter } from './server/routes/medicine';
import { planRouter } from './server/routes/plan';
import { verifyGeminiModelAtStartup } from './server/services/gemini';
import { createServer as createViteServer } from 'vite';

export const app = express();

app.set('trust proxy', TRUST_PROXY);

app.use(securityHeaders);
app.use(express.json({ limit: LIMITS.JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: LIMITS.JSON_BODY_LIMIT }));

// Apply general rate limiting to all /api routes
app.use('/api', apiRateLimiter);

// Mount API routes with endpoint-specific rate limiters
app.use('/api', healthRouter);
app.use('/api', uploadRateLimiter, checkRouter);
app.use('/api', aiRateLimiter, chatRouter);
app.use('/api', aiRateLimiter, medicineRouter);
app.use('/api', aiRateLimiter, planRouter);

// Unknown /api routes return JSON 404
app.all('/api/*', (_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API endpoint does not exist.',
    },
  });
});

// Global error handler for API routes
app.use(errorHandler);

// Vite middleware & Static SPA serving for non-API routes
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Saarthi Server running on http://0.0.0.0:${PORT}`);
      verifyGeminiModelAtStartup().catch(() => {});
    });
  }
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer();
}
