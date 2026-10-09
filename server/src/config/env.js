import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-secret-airus-token-key-32chars-minimum'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || '',
    baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct'
  },
  database: {
    url: process.env.DATABASE_URL || '',
    useFallback: process.env.USE_DEV_FALLBACK_DB === 'true' || (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production')
  }
};

/**
 * Validates critical environment variables at startup
 */
export function validateEnv() {
  const errors = [];

  if (config.env === 'production') {
    if (!config.jwtSecret || config.jwtSecret.length < 16) {
      errors.push('JWT_SECRET is missing or insufficiently secure in production.');
    }
    if (!config.nvidia.apiKey) {
      errors.push('NVIDIA_API_KEY is required for production.');
    }
    if (!config.database.url && !config.database.useFallback) {
      errors.push('DATABASE_URL is required for production PostgreSQL persistence.');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
