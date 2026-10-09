import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, closePool } from './db.js';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('[Migration] Starting database schema migration...');
  
  if (config.database.useFallback || !config.database.url) {
    console.log('[Migration] Using in-memory/development store; schema migration not required for PostgreSQL.');
    return true;
  }

  try {
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    let sql;
    if (fs.existsSync(schemaPath)) {
      sql = fs.readFileSync(schemaPath, 'utf8');
    } else {
      const localSchema = path.resolve(__dirname, 'schema.sql');
      sql = fs.readFileSync(localSchema, 'utf8');
    }

    await query(sql);
    console.log('[Migration] Database schema migrated successfully.');
    return true;
  } catch (err) {
    console.error('[Migration Error] Failed to run schema migration:', err.message);
    throw err;
  }
}

// Allow direct CLI invocation
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('[Migration] Finished successfully.');
      return closePool();
    })
    .catch((err) => {
      console.error('[Migration] Failed:', err);
      process.exit(1);
    });
}
