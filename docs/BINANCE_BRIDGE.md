# Binance bridge — safe first phase

This phase intentionally supports **public spot prices** and an optional **private read-only account snapshot**. It does not place, amend, or cancel orders and cannot withdraw or transfer funds.

## Endpoints

- `GET /api/binance` — reports which capabilities are configured; never returns secrets.
- `GET /api/binance/market?symbol=BTCUSDT` — public spot ticker.
- `GET /api/binance/account` — private balances, protected by a separate bearer token and server-side Binance credentials.

## Configure the private read-only snapshot

Set these values in the hosting provider's encrypted environment-variable settings, not in source code, browser code, chat, or GitHub:

- `BINANCE_API_KEY` — a Binance API key with **read-only / Enable Reading only** permission.
- `BINANCE_API_SECRET` — corresponding secret, held only by the server.
- `BINANCE_BRIDGE_TOKEN` — a separate long random bearer token used to protect the account endpoint.
- Optional: `BINANCE_API_BASE_URL` — leave unset for the official Binance Spot API.

Send `GET /api/binance/account` with `Authorization: Bearer <BINANCE_BRIDGE_TOKEN>` from a trusted server-side client only. Do not put this token in `index.html`, `app.js`, a public dashboard, or a public URL. The endpoint returns sensitive account information, so expose it only behind an authenticated private client or add a stronger identity layer before making it available to a browser.

## Binance key setup

1. In Binance API Management, create a dedicated key labelled for KaricimGPT.
2. Enable **reading only**; leave spot trading, futures trading, margin, transfers, and withdrawals disabled.
3. Restrict the key to trusted IPs if the deployment platform provides stable outbound IP addresses. If it does not, do not weaken the account's security controls merely to make the connection work; use a fixed-egress server or keep the bridge unconfigured.
4. Store secrets only in hosting environment variables. Never commit them to GitHub or send them in ChatGPT.
5. Verify `GET /api/binance` first, then test market data. Only test the account endpoint from a trusted private client.

## Trading automation is deliberately not enabled

A read-only connection verifies the integration and lets the system inspect balances; it does not authorize an order engine. Live trading requires a separately reviewed design for explicit symbol allowlists, order-size caps, maximum daily loss, stale-price checks, duplicate-order protection, stop-loss handling, kill switch, audit logs, and a sandbox/testnet validation. Do not enable live trading merely by adding a secret or changing an environment variable.

## Local checks

Run `node test/binance.test.js` and `npm run check`. The existing `npm run check` chain may need the Binance test added to the package script if the project test command is being updated.
