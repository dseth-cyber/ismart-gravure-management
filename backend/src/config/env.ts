import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://redis:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  MAX_CONCURRENT_SESSIONS: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5', 10),
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  LOCKOUT_DURATION_MINUTES: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10),
  LDAP_URL: process.env.LDAP_URL || '',
  LDAP_BASE_DN: process.env.LDAP_BASE_DN || '',
  LDAP_BIND_DN: process.env.LDAP_BIND_DN || '',
  LDAP_BIND_CREDENTIALS: process.env.LDAP_BIND_CREDENTIALS || '',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Validate critical variables
if (!env.DATABASE_URL) {
  throw new Error('CRITICAL CONFIG ERROR: DATABASE_URL environment variable is missing.');
}
