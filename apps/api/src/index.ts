import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { shopRouter } from './routes/shop.routes.js';
import { pool } from './db/pool.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

app.get('/api/v1/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ data: { status: 'ok', aiEnabled: config.aiEnabled } });
  } catch {
    res.status(503).json({ error: 'Database unavailable', code: 'DB_DOWN' });
  }
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/shops/:shopId', shopRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
});
