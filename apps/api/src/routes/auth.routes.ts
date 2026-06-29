import { Router } from 'express';
import { z } from 'zod';
import { login } from '../services/auth.service.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
