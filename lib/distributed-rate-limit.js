import { createHash } from 'node:crypto';
import { rateLimit as localRateLimit } from './security.js';

let poolPromise;
let schemaPromise;
let callsSinceCleanup = 0;

const WINDOW_MS = 60_000;
const EXPENSIVE_LIMIT = 12;
const GENERAL_LIMIT = 60;

async function getPool() {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      throw Object.assign(new Error('DATABASE_URL is required for production distributed rate limiting.'), { code: 'RATE_LIMIT_CONFIG_MISSING' });
    }
    return null;
  }
  if (!poolPromise) {
    poolPromise = import('pg').then(({ Pool }) => new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.PGPOOL_MAX || 5),
      ...(process.env.PGSSLMODE === 'require' ? { ssl: { rejectUnauthorized: true } } : {})
    }));
  }
  return poolPromise;
}

async function ensureSchema(pool) {
  if (!schemaPromise) {
    schemaPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS karicimgpt_rate_limits (
        bucket_key TEXT NOT NULL,
        window_start BIGINT NOT NULL,
        request_count INTEGER NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (bucket_key, window_start)
      )
    `).catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
}

function clientAddress(req) {
  // This module is called only after the production gateway secret was verified.
  // The gateway MUST strip caller-provided forwarding headers before injecting its own.
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim().slice(0, 100);
  }
  return String(req.socket?.remoteAddress || 'unknown').trim().slice(0, 100);
}

function bucketFor(req, pathname) {
  const address = clientAddress(req);
  const routeClass = /^\/api\/(?:chat|agent|council|grok|bridge)(?:\/|$)/.test(pathname) ? 'model' : 'general';
  const digest = createHash('sha256').update(address).digest('hex');
  return { key: `${routeClass}:${digest}`, limit: routeClass === 'model' ? EXPENSIVE_LIMIT : GENERAL_LIMIT };
}

export async function checkDistributedRateLimit(req, pathname) {
  const pool = await getPool();
  if (!pool) {
    const local = localRateLimit({ ...req, socket: req.socket });
    return { ...local, limit: 20, backend: 'local' };
  }

  await ensureSchema(pool);
  const bucket = bucketFor(req, pathname);
  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS);
  const expiresAt = new Date((windowStart + 2) * WINDOW_MS);
  const result = await pool.query(`
    INSERT INTO karicimgpt_rate_limits (bucket_key, window_start, request_count, expires_at)
    VALUES ($1, $2, 1, $3)
    ON CONFLICT (bucket_key, window_start)
    DO UPDATE SET request_count = karicimgpt_rate_limits.request_count + 1,
                  expires_at = EXCLUDED.expires_at
    RETURNING request_count
  `, [bucket.key, windowStart, expiresAt]);
  const count = Number(result.rows[0]?.request_count || 1);

  callsSinceCleanup += 1;
  if (callsSinceCleanup >= 100) {
    callsSinceCleanup = 0;
    // Best-effort bounded retention; failure here must not change the request decision.
    pool.query('DELETE FROM karicimgpt_rate_limits WHERE expires_at < NOW()').catch(() => {});
  }

  const remaining = Math.max(0, bucket.limit - count);
  if (count > bucket.limit) {
    return { allowed: false, remaining: 0, limit: bucket.limit, retryAfter: Math.max(1, Math.ceil((windowStart + 1) * WINDOW_MS - now) / 1000), backend: 'postgres' };
  }
  return { allowed: true, remaining, limit: bucket.limit, backend: 'postgres' };
}
