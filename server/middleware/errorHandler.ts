import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Short safe log on server, never logging message text or sensitive payload
  const errorName = err?.name || 'Error';
  const errorCode = err?.code || 'INTERNAL_SERVER_ERROR';
  console.error(`[API Error] ${errorName} (${errorCode})`);

  if (res.headersSent) {
    return;
  }

  const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;

  res.status(statusCode).json({
    error: {
      code: typeof err?.code === 'string' ? err.code : 'INTERNAL_SERVER_ERROR',
      message:
        typeof err?.clientMessage === 'string'
          ? err.clientMessage
          : 'Something went wrong. Please try again in a moment.',
    },
  });
}
