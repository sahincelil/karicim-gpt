# COMMAND-0 Bootstrap Plan

Status: planning and isolated bootstrap branch only.
Branch: command-0/bootstrap
Base: main
Production deployment: not authorized and not performed.

## Objective

Evolve KaricimGPT into a private, cloud-hosted COMMAND-0 prototype while preserving the existing main branch and production environment.

## Verified repository observations

- The repository default branch is `main`.
- The existing runtime is a Node.js ES-module application with API handlers and a browser frontend.
- Existing AI routes include chat and agent handlers.
- Existing memory and digital-twin modules use file-backed storage on the default branch.
- The default branch includes rate limiting and baseline response security headers.
- A separate branch, `evolution/phase-1-postgres-memory`, contains a PostgreSQL-backed memory implementation and production configuration checks.
- That PostgreSQL branch has diverged from main (18 commits ahead, 27 behind at inspection time). It must not be merged wholesale without reviewing the intervening changes and conflicts.
- Existing maintenance code describes autonomous observation, analysis and proposal generation while explicitly disabling autonomous source writes, deployment, rollback and destructive actions.

## Security findings to address before private cloud exposure

1. Add authenticated user sessions to chat and agent APIs; IP rate limiting alone is not user authentication.
2. Replace wildcard CORS fallback with an explicit allowlist in production.
3. Review proxy trust before relying on X-Forwarded-For for rate limiting.
4. Move rate limits to shared storage if more than one app instance is used.
5. Use per-user authorization and data isolation for memory and digital-twin endpoints.
6. Keep secrets in Railway's secret variables; never commit credentials or print variable values in logs.
7. Require explicit human approval for production deploys, destructive database operations, secret changes and financial actions.
8. Treat retrieved documents, webpages, repository content and memory as untrusted data, not instructions.

## Implementation sequence

### Phase A — Isolated foundation
- Keep all work on `command-0/bootstrap`.
- Add automated checks for auth, CORS, rate limits and memory behavior.
- Review the PostgreSQL branch file-by-file and port only compatible changes.
- Do not merge to main or deploy.

### Phase B — Private PostgreSQL
- Confirm the intended Railway workspace/project and environment before any provisioning or variable changes.
- Use a non-production/staging environment.
- Provision PostgreSQL only after the target account, project and cost are confirmed.
- Configure `DATABASE_URL` as a secret reference; never expose its value.
- Test create/read/update/delete behavior, restart persistence, migrations and backup/restore.

### Phase C — Private COMMAND-0 core
- Add user authentication and authorization.
- Add a task orchestrator with bounded tool permissions.
- Start with Research and Builder agents in read-only or sandboxed execution.
- Add audit events, request IDs, token/cost quotas and failure handling.
- Keep production deployment and irreversible actions behind human approval.

### Phase D — Acceptance gates
- Unauthorized requests are rejected.
- One user's memory cannot be read by another user.
- Secrets do not appear in API responses, commits or logs.
- Memory survives application restarts and database failover tests.
- Automated tests pass in CI.
- A staging smoke test succeeds before any production release is considered.

## Explicit non-actions

- No changes to `main`.
- No production deployment or Railway configuration change.
- No Railway project, service, database, volume or environment variable created or modified.
- No secrets read, copied, printed or committed.
- No automatic merge or deployment.
