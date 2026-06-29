import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'shop' | 'wholesaler';
  shopId: string | null;
  wholesalerId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' });
    return;
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, config.jwtSecret) as JwtPayload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
}

export function requireRole(...roles: JwtPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
      return;
    }
    next();
  };
}

export function requireShopAccess(req: Request, res: Response, next: NextFunction) {
  const shopId = req.params['shopId'] as string | undefined;
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (req.user.role === 'admin') {
    next();
    return;
  }
  if (req.user.role === 'shop' && req.user.shopId === shopId) {
    next();
    return;
  }
  res.status(403).json({ error: 'Access denied to this shop', code: 'SHOP_FORBIDDEN' });
}
