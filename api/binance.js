import { securityHeaders } from '../lib/security.js';
import { getAccountSnapshot, getMarketPrice, safeEqual } from '../lib/binance.js';

function send(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'Yalnızca GET destekleniyor.' });
  const url = new URL(req.url || '/api/binance', 'http://localhost');
  try {
    if (url.pathname.endsWith('/market')) {
      const market = await getMarketPrice(url.searchParams.get('symbol') || 'BTCUSDT');
      return send(res, 200, { ok: true, market });
    }
    if (url.pathname.endsWith('/account')) {
      const bridgeToken = process.env.BINANCE_BRIDGE_TOKEN;
      if (!bridgeToken) return send(res, 503, { ok: false, error: 'Binance account bridge is not enabled; configure a server-side bridge token first.' });
      const authorization = req.headers?.authorization || '';
      const suppliedToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
      if (!safeEqual(suppliedToken, bridgeToken)) return send(res, 401, { ok: false, error: 'Unauthorized.' });
      const account = await getAccountSnapshot();
      return send(res, 200, { ok: true, account });
    }
    return send(res, 200, {
      ok: true,
      service: 'KaricimGPT Binance bridge',
      marketData: true,
      privateAccountRead: Boolean(process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET && process.env.BINANCE_BRIDGE_TOKEN),
      liveTrading: false,
      withdrawals: false,
      message: 'This bridge only reads public market data and, when securely configured, private account balances. It cannot place or cancel orders.'
    });
  } catch (error) {
    return send(res, error?.status || 502, { ok: false, error: error?.message || 'Binance request failed.' });
  }
}
