import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import {
  login,
  createPasswordResetToken,
  resetPasswordWithToken,
} from '../services/auth.service.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid email or password', code: 'VALIDATION' });
      return;
    }

    const result = await login(parsed.data.email, parsed.data.password);
    if (!result) {
      res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
      return;
    }

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid email required', code: 'VALIDATION' });
      return;
    }

    const token = await createPasswordResetToken(parsed.data.email);
    const payload: { message: string; resetToken?: string } = {
      message:
        'If an account exists for this email, a reset link has been created. Contact admin or use the link below.',
    };

    if (token && config.nodeEnv !== 'production') {
      payload.resetToken = token;
    }

    res.json({ data: payload });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid reset request', code: 'VALIDATION' });
      return;
    }

    const ok = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
    if (!ok) {
      res.status(400).json({ error: 'Invalid or expired reset link', code: 'INVALID_TOKEN' });
      return;
    }

    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', authMiddleware, async (req, res) => {
  res.json({
    data: {
      user: {
        id: req.user!.sub,
        email: req.user!.email,
        role: req.user!.role,
        shopId: req.user!.shopId,
        wholesalerId: req.user!.wholesalerId,
        status: 'active' as const,
      },
    },
  });
});
