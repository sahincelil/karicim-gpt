const buckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const MAX_BUCKETS = 10_000;

export function isOriginAllowed(origin, configuredOrigin) {
  // Requests without an Origin are typically server-to-server or non-browser clients;
  // CORS is not authentication, so sensitive routes still require their own auth.
  if (!origin) return true;
  if (!configuredOrigin || configuredOrigin === '*') return false;
  return origin === configuredOrigin;
}

export function clientKey(req) {
  // X-Forwarded-For is attacker-controlled unless a trusted proxy is explicitly
  // configured to overwrite it. Do not use it for security decisions by default.
  return String(req.socket?.remoteAddress || 'unknown').trim().slice(0, 100);
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
