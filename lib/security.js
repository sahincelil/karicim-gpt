import { isIP } from 'node:net';

const buckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const MAX_BUCKETS = 10_000;

function socketAddress(req) {
  const address = String(req.socket?.remoteAddress || '').trim();
  return isIP(address) ? address : 'unknown';
}

// Only trust X-Forwarded-For when the deployment explicitly configures
// the exact number of trusted reverse-proxy hops. Otherwise use the socket peer.
export function clientKey(req) {
  const socket = socketAddress(req);
  const hops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '0', 10);
  if (!Number.isInteger(hops) || hops < 1 || hops > 10 || socket === 'unknown') return socket;

  const raw = req.headers?.['x-forwarded-for'];
  if (typeof raw !== 'string' || raw.length > 1_000) return socket;

  const forwarded = raw.split(',').map((part) => part.trim());
  if (forwarded.length < hops) return socket;
  if (forwarded.some((address) => !isIP(address))) return socket;

  // The socket peer is the nearest (right-most) trusted proxy.
  // Select the first address beyond the configured trusted proxy chain.
  const clientIndex = forwarded.length - hops;
  return forwarded[clientIndex] || socket;
}

function prune(now) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (now - bucket.started >= WINDOW_MS) buckets.delete(key);
    if (buckets.size <= MAX_BUCKETS) break;
  }
}

export function rateLimit(req) {
  const now = Date.now();
  prune(now);
  const key = clientKey(req);
  const current = buckets.get(key);
  if (!current || now - current.started >= WINDOW_MS) {
    buckets.set(key, { started: now, count: 1 });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }
  if (current.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((WINDOW_MS - (now - current.started)) / 1000) };
  }
  current.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - current.count };
}

export function securityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
}
