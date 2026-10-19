# GitHub Pages frontend deployment boundary

## Confirmed repository behavior

- The repository contains a Node.js HTTP server (`server.js`) and server-side API routes (`/api/chat`, `/api/agent`, `/api/council`, and `/api/memory`).
- The browser already stores up to 50 chat messages in `localStorage` under `karicimgpt-messages`. This survives a browser/app restart in the same browser profile, but is not a server backup and does not sync across devices or browsers.
- Server-side memory in `lib/memory.js` is stored in a JSON file configured by `MEMORY_FILE` / `DATA_DIR`. That file is not provided by GitHub Pages.
- No GitHub Pages deployment workflow is introduced by this change. No production deploy is triggered.

## GitHub Pages architecture

GitHub Pages can serve the static frontend only. It cannot execute `server.js`, host the AI API routes, or guarantee server-side file persistence. To use the frontend from a GitHub Pages project site:

1. Host the Node.js API separately on a supported server/runtime.
2. Configure `window.KARICIMGPT_API_BASE_URL` in `config.js` to the public HTTPS origin of that API. The URL is public configuration, not a secret.
3. Configure the API host's `CORS_ORIGIN` to the exact GitHub Pages origin. Do not put AI-provider keys or admin tokens in `config.js` or any browser asset.
4. Select and configure a durable backend store for server-side memory on that API host. A file adapter is durable only if the host explicitly guarantees persistent storage.
5. Verify restart persistence and access isolation in staging before considering production.

If the frontend is served from GitHub Pages and no API base URL is configured, chat requests now show a clear configuration error rather than silently posting to a nonexistent `/api/*` path on the static host.

## Scope of this PR

This PR makes the static frontend compatible with GitHub Pages project-site paths, adds explicit API-origin configuration, and adds CI assertions. It does **not** deploy the site, host the API, introduce a database, or claim that server-side memory is durable. The actual persistent-memory adapter remains blocked on selecting the API host and its supported database/KV service, as tracked by Issue #14 and the Phase 1 plan in PR #15.

## Browser-local memory limits

Browser `localStorage` can preserve this browser's chat across restarts, but it can be cleared by the user/browser, is limited to that origin and browser profile, and is not a safe substitute for server-side, cross-device durable memory. Do not store provider secrets or admin credentials in it.
