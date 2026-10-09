import express from 'express';
import { checkDbHealth } from '../database/db.js';
import { config } from '../config/env.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  const dbHealth = await checkDbHealth();
  const isHealthy = dbHealth.connected;

  const status = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'AiRus Voice AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.env,
    database: {
      connected: dbHealth.connected,
      provider: dbHealth.provider,
      error: dbHealth.error ? 'Database connection error' : null
    },
    aiConfig: {
      provider: 'NVIDIA API',
      configured: Boolean(config.nvidia.apiKey),
      model: config.nvidia.model
    }
  };

  return res.status(isHealthy ? 200 : 503).json(status);
});

export default router;
