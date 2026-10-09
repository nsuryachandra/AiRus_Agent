import pg from 'pg';
import crypto from 'crypto';
import { config } from '../config/env.js';

let pool = null;
let fallbackStore = null;

// Initialize in-memory fallback store for development/testing when PostgreSQL is not configured
function initFallbackStore() {
  if (!fallbackStore) {
    fallbackStore = {
      users: new Map(),
      conversations: new Map(),
      messages: new Map()
    };
  }
  return fallbackStore;
}

if (!config.database.useFallback && config.database.url) {
  const isSsl = config.database.url.includes('sslmode=require') || config.env === 'production';
  pool = new pg.Pool({
    connectionString: config.database.url,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  pool.on('error', (err) => {
    console.error('[DB Pool Error]', err.message);
  });
} else {
  initFallbackStore();
}

/**
 * Fallback SQL Query Executor for local dev & offline test runs
 */
async function executeFallbackQuery(text, params = []) {
  const store = initFallbackStore();
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Test / Health check
  if (lower.startsWith('select 1')) {
    return { rows: [{ '?column?': 1 }], rowCount: 1 };
  }

  // INSERT INTO users
  if (lower.startsWith('insert into users')) {
    const id = crypto.randomUUID();
    const [email, name, passwordHash] = params;
    
    // Check unique email
    for (const u of store.users.values()) {
      if (u.email === email.toLowerCase()) {
        const err = new Error('duplicate key value violates unique constraint "users_email_key"');
        err.code = '23505';
        throw err;
      }
    }

    const now = new Date();
    const user = {
      id,
      email: email.toLowerCase(),
      name,
      password_hash: passwordHash,
      created_at: now,
      updated_at: now
    };
    store.users.set(id, user);
    return { rows: [{ id, email: user.email, name: user.name, created_at: user.created_at }], rowCount: 1 };
  }

  // SELECT ... FROM users WHERE email = $1
  if (lower.startsWith('select') && lower.includes('from users') && lower.includes('where lower(email) = lower($1)')) {
    const email = (params[0] || '').toLowerCase();
    for (const u of store.users.values()) {
      if (u.email === email) {
        return { rows: [{ ...u }], rowCount: 1 };
      }
    }
    return { rows: [], rowCount: 0 };
  }

  // SELECT ... FROM users WHERE id = $1
  if (lower.startsWith('select') && lower.includes('from users') && lower.includes('where id = $1')) {
    const id = params[0];
    const user = store.users.get(id);
    if (user) {
      const { password_hash, ...safeUser } = user;
      return { rows: [safeUser], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // INSERT INTO conversations
  if (lower.startsWith('insert into conversations')) {
    const id = crypto.randomUUID();
    const [userId, title] = params;
    const now = new Date();
    const conv = {
      id,
      user_id: userId,
      title: title || 'New Conversation',
      created_at: now,
      updated_at: now
    };
    store.conversations.set(id, conv);
    return { rows: [conv], rowCount: 1 };
  }

  // SELECT ... FROM conversations WHERE user_id = $1
  if (lower.startsWith('select') && lower.includes('from conversations') && lower.includes('where user_id = $1')) {
    const userId = params[0];
    const results = [];
    for (const c of store.conversations.values()) {
      if (c.user_id === userId) {
        results.push({ ...c });
      }
    }
    results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return { rows: results, rowCount: results.length };
  }

  // SELECT ... FROM conversations WHERE id = $1 AND user_id = $2
  if (lower.startsWith('select') && lower.includes('from conversations') && lower.includes('where id = $1') && lower.includes('user_id = $2')) {
    const [id, userId] = params;
    const c = store.conversations.get(id);
    if (c && c.user_id === userId) {
      return { rows: [{ ...c }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // UPDATE conversations SET title = ... OR updated_at = ...
  if (lower.startsWith('update conversations')) {
    if (lower.includes('set title = $1') && lower.includes('id = $2') && lower.includes('user_id = $3')) {
      const [title, id, userId] = params;
      const c = store.conversations.get(id);
      if (c && c.user_id === userId) {
        c.title = title;
        c.updated_at = new Date();
        return { rows: [{ ...c }], rowCount: 1 };
      }
    }
    if (lower.includes('set updated_at = current_timestamp') && lower.includes('where id = $1')) {
      const id = params[0];
      const c = store.conversations.get(id);
      if (c) {
        c.updated_at = new Date();
        return { rows: [{ ...c }], rowCount: 1 };
      }
    }
    return { rows: [], rowCount: 0 };
  }

  // DELETE FROM conversations WHERE id = $1 AND user_id = $2
  if (lower.startsWith('delete from conversations') && lower.includes('where id = $1') && lower.includes('user_id = $2')) {
    const [id, userId] = params;
    const c = store.conversations.get(id);
    if (c && c.user_id === userId) {
      store.conversations.delete(id);
      // Cascade delete messages
      for (const [mId, m] of store.messages.entries()) {
        if (m.conversation_id === id) {
          store.messages.delete(mId);
        }
      }
      return { rows: [{ id }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // INSERT INTO messages
  if (lower.startsWith('insert into messages')) {
    const id = crypto.randomUUID();
    const [convId, role, content, metadata] = params;
    const now = new Date();
    const msg = {
      id,
      conversation_id: convId,
      role,
      content,
      metadata: typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {}),
      created_at: now
    };
    store.messages.set(id, msg);
    return { rows: [msg], rowCount: 1 };
  }

  // SELECT ... FROM messages WHERE conversation_id = $1
  if (lower.startsWith('select') && lower.includes('from messages') && lower.includes('where conversation_id = $1')) {
    const convId = params[0];
    const msgs = [];
    for (const m of store.messages.values()) {
      if (m.conversation_id === convId) {
        msgs.push({ ...m });
      }
    }
    msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return { rows: msgs, rowCount: msgs.length };
  }

  // Generic fallback response
  return { rows: [], rowCount: 0 };
}

/**
 * Standard database query interface
 */
export async function query(text, params = []) {
  if (pool) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (err) {
      console.error('[Database Query Error]', { text: text.slice(0, 100), error: err.message });
      throw err;
    }
  }

  return executeFallbackQuery(text, params);
}

/**
 * Checks database connectivity and health
 */
export async function checkDbHealth() {
  if (pool) {
    try {
      const res = await pool.query('SELECT 1 as healthy');
      return { connected: true, provider: 'PostgreSQL', error: null };
    } catch (err) {
      return { connected: false, provider: 'PostgreSQL', error: err.message };
    }
  }
  return { connected: true, provider: 'In-Memory Development Store', error: null };
}

/**
 * Close database pool on shutdown
 */
export async function closePool() {
  if (pool) {
    await pool.end();
  }
}
