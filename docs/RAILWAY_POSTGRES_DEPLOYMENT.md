# Phase 1: Railway API + PostgreSQL deployment runbook

## Decision

Use GitHub Pages for the static frontend and Railway for the Node.js API with Railway PostgreSQL for server-side memory. This matches the repository's existing Node.js server and avoids treating an ephemeral container filesystem as durable storage.

**This document is a runbook only. It does not create Railway resources, set secrets, connect a GitHub deployment, or deploy production.**

## Required service configuration

API service:
- Source: this GitHub repository, branch `main` only after the relevant PRs have been reviewed and merged.
- Start command: `npm start` (Node.js 24 or newer).
- Health check path: `/health`.
- Required secret environment variables: existing model-provider keys required by enabled API routes, a strong random `BODY_ADMIN_TOKEN`, and a separate random `TRUSTED_GATEWAY_SECRET` of at least 32 characters.
- `DATABASE_URL`: Railway PostgreSQL connection URL, provided as a Railway variable reference rather than committed text.
- `CORS_ORIGIN`: one exact published frontend origin, for example `https://sahincelil.github.io` (confirm the repository's actual Pages URL before setting it). Do not use `*`. Browser-origin requests are rejected when this variable is unset or the request Origin does not exactly match it; requests without an Origin are not authenticated by this check and still need route-level authorization.
- `NODE_ENV=production`.
- Every `/api/*` request in production now requires `x-karicimgpt-gateway-secret` to match `TRUSTED_GATEWAY_SECRET`; absent configuration fails closed with HTTP 503, and a missing/incorrect header gets HTTP 401. A trusted gateway must strip any client-supplied copy of this header and inject the secret only on the server-to-server hop. Never put this secret in GitHub Pages or browser JavaScript. This is a shared gateway boundary, **not** end-user identity or per-user quota enforcement.

Database service:
- Provision PostgreSQL in the same Railway project/environment as the API.
- Reference its private connection URL as `DATABASE_URL` where possible.
- Use `PGSSLMODE=require` only when connecting through an endpoint that requires TLS. Certificate verification remains enabled; do not add a setting that disables it.
- Backups/restore policy must be configured and tested before real user data is stored.

## Durable-memory behavior

When `DATABASE_URL` is configured, `lib/memory.js` stores memory records in the `karicimgpt_memories` PostgreSQL table. The table is initialized with `CREATE TABLE IF NOT EXISTS` on first use. Records are bounded to the latest 100 entries and each text entry to 4,000 characters. Health reports `backend: postgres`.

When `NODE_ENV=production` and `DATABASE_URL` is absent, the application refuses to use the local JSON file as a fallback. This prevents an apparently healthy but ephemeral deployment from silently losing memory on restart. Local development and existing file-based tests continue to use `MEMORY_FILE` / `DATA_DIR` when `DATABASE_URL` is absent.

## Staging acceptance checklist

- [ ] Deploy to a non-production Railway environment only after a human review of the implementation PR.
- [ ] Set all API provider credentials and `BODY_ADMIN_TOKEN` through Railway's secret-variable UI; never put them in GitHub Pages files.
- [ ] Set one exact `CORS_ORIGIN`; verify a matching Origin succeeds and a mismatched Origin gets HTTP 403. Never treat this check as authentication.
- [ ] Put a trusted gateway in front of the API, configure `TRUSTED_GATEWAY_SECRET` only on the API and gateway, and verify direct requests without the injected header get HTTP 401 (or HTTP 503 when the secret is not configured). Confirm the gateway overwrites/removes caller-supplied copies of the header.
- [ ] Confirm `/health` reports `memory.backend = postgres`.
- [ ] Add a harmless test memory through the authorized API, restart/redeploy the staging API, and confirm the record remains.
- [ ] Confirm invalid/missing admin token cannot read or write `/api/memory`.
- [ ] Confirm malformed JSON, oversized requests, database downtime, and connection failures return safe errors without leaking connection strings.
- [ ] Test database backup restoration in staging and record the recovery procedure.
- [ ] Only after all checks pass, separately review and authorize any production deployment.

## Rate-limit deployment note

The in-process limiter is only a best-effort local guard: its counters are not shared across replicas and must not be treated as production abuse or budget control. It deliberately uses the socket peer address rather than trusting caller-supplied `X-Forwarded-For`. Before public exposure, configure and validate a trusted gateway/proxy that overwrites forwarding headers and enforce distributed rate limits and spend quotas there or in shared storage. Do not enable proxy-header trust based only on the presence of a header.

## Public API launch blocker

Before exposing the API publicly, complete [Issue #18](https://github.com/sahincelil/karicim-gpt/issues/18): abuse/rate controls for model-backed routes, budget controls, production CORS validation, and automated authorization tests. CORS is not authentication. The browser must never contain provider keys or the shared admin token. This runbook and a passing CI run are not evidence that these controls or live PostgreSQL restart persistence have been tested.

## Important security note

The current `/api/memory` route is guarded by `BODY_ADMIN_TOKEN`; this change does not implement end-user identity or per-user memory isolation. Do not treat the shared admin-protected memory endpoint as multi-user personal memory. Before exposing personal memories to multiple users, implement authentication, per-user authorization, and isolation tests in a separate reviewed change.

## Rollback

Set the prior reviewed commit as the service source or roll back the Railway deployment using Railway's deployment controls. Do not delete or recreate the PostgreSQL service as a rollback method. Keep the database and backups intact until the previous version has been verified.