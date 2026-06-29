import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { createShopWithUser, listShops } from '../services/auth.service.js';

export const adminRouter = Router();

adminRouter.use(authMiddleware, requireRole('admin'));

const createShopSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  address: z.string().optional(),
  gstin: z.string().optional(),
});

adminRouter.get('/shops', async (_req, res) => {
  const shops = await listShops();
  res.json({ data: shops });
});

adminRouter.post('/shops', async (req, res) => {
  const parsed = createShopSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', code: 'VALIDATION' });
    return;
  }
  try {
    const result = await createShopWithUser(parsed.data);
    res.status(201).json({ data: result });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
      res.status(409).json({ error: 'Email already exists', code: 'DUPLICATE_EMAIL' });
      return;
    }
    throw err;
  }
});
