import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://postgres:Admin%40123@localhost:5432/turnover_check',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  aiEnabled: process.env.AI_ENABLED === 'true',
};
