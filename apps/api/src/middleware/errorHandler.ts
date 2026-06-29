import type { Request, Response, NextFunction } from 'express';

function dbErrorMessage(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const code = 'code' in err ? String(err.code) : '';
  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
    return 'Database unavailable. Start PostgreSQL and check DATABASE_URL in .env';
  }
  if (code === '28P01') {
    return 'Database login failed. Check postgres username/password in .env';
  }
  if (code === '3D000') {
    return 'Database does not exist. Run: npm run db:setup';
  }
  return null;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);

  const dbMsg = dbErrorMessage(err);
  if (dbMsg) {
    res.status(503).json({ error: dbMsg, code: 'DB_ERROR' });
    return;
  }

  if (err instanceof Error && err.name === 'ZodError') {
    res.status(400).json({ error: 'Validation failed', code: 'VALIDATION' });
    return;
  }

  if (err instanceof Error && err.message) {
    res.status(400).json({ error: err.message, code: 'BAD_REQUEST' });
    return;
  }

  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL' });
}
