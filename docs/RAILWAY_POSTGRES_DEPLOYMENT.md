# Phase 1: Railway API + PostgreSQL deployment runbook

## Decision

Use GitHub Pages for the static frontend and Railway for the Node.js API with Railway PostgreSQL for server-side memory. This matches the repository's existing Node.js server and avoids treating an ephemeral container filesystem as durable storage.

**This document is a runbook only. It does not create Railway resources, set secrets, connect a GitHub deployment, or deploy production.**

## Required service configuration

API service:
- Source: this GitHub repository, branch `main` only after the relevant PRs have been reviewed and merged.
- Start command: `npm start` (Node.js 24 or newer).
- Health check path: `/health`.
- Required secret environment variables: existing model-provider keys required by the enabled API routes, plus a strong random `BODY_ADMIN_TOKEN`.
- `DATABASE_URL`: Railway PostgreSQL connection URL, provided as a Railway variable reference rather than committed text.
- `CORS_ORIGIN`: exact published GitHub Pages origin, for example `https://sahincelil.github.io` (confirm the repository's actual Pages URL before setting it).
- `NODE_ENV=production`.

Database service:
- Provision PostgreSQL in the same Railway project/environment as the API.
- Reference its private connection URL as `DATABASE_URL` where possible.
- Use `PGSSLMODE=require` only when connecting through an endpoint that requires TLS; do not disable certificate verification casually.
- Backups/restore policy must be configured and tested before real user data is stored.

## Durable-memory behavior

When `DATABASE_URL` is configured, `lib/memory.js` stores memory records in the `karicimgpt_memories` PostgreSQL table. The table is initialized with `CREATE TABLE IF NOT EXISTS` on first use. Records are bounded to the latest 100 entries and each text entry to 4,000 characters. Health reports `backend: postgres`.

When `NODE_ENV=production` and `DATABASE_URL` is absent, the application refuses to use the local JSON file as a fallback. This prevents an apparently healthy but ephemeral deployment from silently losing memory on restart. Local development and existing file-based tests continue to use `MEMORY_FILE` / `DATA_DIR` when `DATABASE_URL` is absent.

## Staging acceptance checklist

- [ ] Deploy to a non-production Railway environment only after a human review of the implementation PR.
- [ ] Set all API provider credentials and `BODY_ADMIN_TOKEN` through Railway's secret-variable UI; never put them in GitHub Pages files.
- [ ] Set the exact `CORS_ORIGIN`; test both the allowed origin and a disallowed origin.
- [ ] Confirm `/health` reports `memory.backend = postgres`.
- [ ] Add a harmless test memory through the authorized API, restart/redeploy the staging API, and confirm the record remains.
- [ ] Confirm invalid/missing admin token cannot read or write `/api/memory`.
- [ ] Confirm malformed JSON, oversized requests, database downtime, and connection failures return safe errors without leaking connection strings.
- [ ] Test database backup restoration in staging and record the recovery procedure.
- [ ] Only after all checks pass, separately review and authorize any production deployment.

## Important security note

The current `/api/memory` route is guarded by `BODY_ADMIN_TOKEN`; this change does not implement end-user identity or per-user memory isolation. Do not treat the shared admin-protected memory endpoint as multi-user personal memory. Before exposing personal memories to multiple users, implement authentication, per-user authorization, and isolation tests in a separate reviewed change.

## Rollback

Set the prior reviewed commit as the service source or roll back the Railway deployment using Railway's deployment controls. Do not delete or recreate the PostgreSQL service as a rollback method. Keep the database and backups intact until the previous version has been verified.