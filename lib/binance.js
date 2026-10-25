import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE_URL = process.env.BINANCE_API_BASE_URL || 'https://api.binance.com';

function credentials() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;
  if (!apiKey || !apiSecret) throw Object.assign(new Error('Binance read-only API credentials are not configured.'), { status: 503 });
  return { apiKey, apiSecret };
}

export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function request(path, params = {}, signed = false) {
  const headers = { Accept: 'application/json' };
  const query = new URLSearchParams(params);
  if (signed) {
    const { apiKey, apiSecret } = credentials();
    query.set('timestamp', String(Date.now()));
    query.set('recvWindow', '5000');
    const signature = createHmac('sha256', apiSecret).update(query.toString()).digest('hex');
    query.set('signature', signature);
    headers['X-MBX-APIKEY'] = apiKey;
  }
  const response = await fetch(`${BASE_URL}${path}?${query.toString()}`, { headers, signal: AbortSignal.timeout(8000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.msg || `Binance API returned HTTP ${response.status}`);
    error.status = response.status === 429 ? 503 : response.status >= 500 ? 502 : 400;
    throw error;
  }
  return data;
}

export async function getMarketPrice(symbol = 'BTCUSDT') {
  const normalized = String(symbol).toUpperCase();
  if (!/^[A-Z0-9]{5,20}$/.test(normalized)) throw Object.assign(new Error('Invalid symbol.'), { status: 400 });
  const data = await request('/api/v3/ticker/price', { symbol: normalized });
  return { symbol: data.symbol, price: data.price, source: 'Binance Spot public market data', retrievedAt: new Date().toISOString() };
}

export async function getAccountSnapshot() {
  const data = await request('/api/v3/account', { omitZeroBalances: 'true' }, true);
  return {
    canTradeAccordingToExchange: Boolean(data.canTrade),
    accountType: data.accountType,
    balances: (data.balances || []).filter(item => Number(item.free) > 0 || Number(item.locked) > 0)
      .map(item => ({ asset: item.asset, free: item.free, locked: item.locked })),
    retrievedAt: new Date().toISOString(),
    mode: 'read-only account snapshot; no orders submitted'
  };
}
