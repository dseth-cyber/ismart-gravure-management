import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Read Docker secrets (files in /run/secrets/)
function readSecret(name: string): string | undefined {
  const secretPath = `/run/secrets/${name}`;
  try {
    return fs.readFileSync(secretPath, 'utf8').trim();
  } catch {
    return undefined;
  }
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: readSecret('db_url') || process.env.DATABASE_URL || '',
  REDIS_URL: readSecret('redis_url') || process.env.REDIS_URL || 'redis://redis:6379',
  JWT_SECRET: readSecret('jwt_secret') || process.env.JWT_SECRET || 'super_secret_jwt_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: readSecret('jwt_refresh_secret') || process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  MAX_CONCURRENT_SESSIONS: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5', 10),
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  LOCKOUT_DURATION_MINUTES: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10),
  LDAP_URL: process.env.LDAP_URL || '',
  LDAP_BASE_DN: process.env.LDAP_BASE_DN || '',
  LDAP_BIND_DN: process.env.LDAP_BIND_DN || '',
  LDAP_BIND_CREDENTIALS: process.env.LDAP_BIND_CREDENTIALS || '',
  LDAP_USER_FILTER: process.env.LDAP_USER_FILTER || '',
  LDAP_GROUP_ATTR: process.env.LDAP_GROUP_ATTR || 'memberOf',
  LDAP_ROLE_MAP: process.env.LDAP_ROLE_MAP || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_FORMAT: process.env.LOG_FORMAT || 'text',
  BACKUP_DIR: process.env.BACKUP_DIR || './backups',
  BACKUP_RETENTION_DAILY: parseInt(process.env.BACKUP_RETENTION_DAILY || '7', 10),
  BACKUP_RETENTION_WEEKLY: parseInt(process.env.BACKUP_RETENTION_WEEKLY || '4', 10),
  BACKUP_RETENTION_MONTHLY: parseInt(process.env.BACKUP_RETENTION_MONTHLY || '3', 10),
  CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5000',
  API_KEY_ENABLED: process.env.API_KEY_ENABLED === 'true',
  API_KEYS: (readSecret('api_keys') || process.env.API_KEYS || '').split(',').filter(Boolean),
  HELMET_CSP: process.env.HELMET_CSP || "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:",
  HSTS_MAX_AGE: parseInt(process.env.HSTS_MAX_AGE || '31536000', 10),
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'minio',
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'minio',
  MINIO_PORT: parseInt(process.env.MINIO_PORT || '9000', 10),
  MINIO_ACCESS_KEY: readSecret('minio_access_key') || process.env.MINIO_ACCESS_KEY || 'minioadmin',
  MINIO_SECRET_KEY: readSecret('minio_secret_key') || process.env.MINIO_SECRET_KEY || 'minioadmin',
  MINIO_BUCKET: process.env.MINIO_BUCKET || 'gravure-files',
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10), // 10MB
};

// Validate critical variables
if (!env.DATABASE_URL) {
  throw new Error('CRITICAL CONFIG ERROR: DATABASE_URL environment variable is missing.');
}
