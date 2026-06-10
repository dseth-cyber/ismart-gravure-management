import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Validate critical variables
if (!env.DATABASE_URL) {
  throw new Error('CRITICAL CONFIG ERROR: DATABASE_URL environment variable is missing.');
}
