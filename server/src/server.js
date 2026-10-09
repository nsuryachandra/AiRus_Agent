import app from './app.js';
import { config, validateEnv } from './config/env.js';
import { runMigrations } from './database/migrate.js';
import { closePool } from './database/db.js';

const validation = validateEnv();
if (!validation.valid) {
  console.error('[Configuration Error] Missing critical environment variables:');
  validation.errors.forEach(err => console.error(` - ${err}`));
  if (config.env === 'production') {
    process.exit(1);
  }
}

// Run database migrations on startup if live PostgreSQL database is present
runMigrations()
  .catch((err) => {
    console.warn('[Startup Warning] Database migration failed or deferred:', err.message);
  })
  .finally(() => {
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(`🚀 AiRus Backend Server running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.env}`);
      console.log(`📡 Health Check: http://localhost:${config.port}/api/health`);
      console.log(`🤖 NVIDIA Model: ${config.nvidia.model}`);
      console.log(`💾 DB Mode: ${config.database.useFallback ? 'In-Memory Fallback' : 'PostgreSQL'}`);
      console.log(`===============================================`);
    });

    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down AiRus server...`);
      server.close(async () => {
        await closePool();
        console.log('AiRus server closed cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  });
