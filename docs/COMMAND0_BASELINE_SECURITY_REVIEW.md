# COMMAND-0 — Initial Security Baseline Review

Review date: 2026-10-31
Reviewed ref: `main` (read-only inspection)
Work branch: `command-0/bootstrap`
Scope: selected API, security, memory, audit, and server entrypoint files.
Status: findings only; no runtime code changed by this review.
Production deployment: not authorized.

## Executive summary

The current application contains useful baseline controls (request size limits on selected routes, security headers, rate limiting, bounded tool loops, secret redaction in agent output, and explicit disabling of autonomous source modification/deployment/rollback/destructive actions in the audit policy). These controls do not yet establish a private, multi-user COMMAND-0 service.

The most important pre-exposure blockers are authentication on chat/agent routes, per-user authorization and memory isolation, and restrictive production CORS. This review is a source inspection, not a penetration test or proof of runtime behavior.

## Findings

### High priority — chat and agent endpoints lack user authentication
Files: `api/chat.js`, `api/agent.js`

- Both handlers apply rate limiting but do not verify an authenticated user/session before processing requests.
- Rate limiting is not a substitute for authentication.
- If these endpoints are reachable from an untrusted network, unauthorized callers may consume configured model-provider quota.
- Required next step: define an authentication/session boundary and test anonymous, invalid, expired, and cross-user requests before private exposure.

### High priority — memory and digital-twin data are not user-scoped
Files: `api/memory.js`, `api/digital-twin.js`, `lib/memory.js`, `lib/digital-twin.js`

- Memory and digital-twin routes use a single `BODY_ADMIN_TOKEN` gate rather than a per-user identity and authorization model.
- The file-backed memory implementation reads and writes one configured memory file; no user identifier is used to partition records in the reviewed module.
- This may be acceptable for a single-owner local prototype, but it is not a multi-user isolation design.
- Required next step: design user-scoped records and authorization checks, then add cross-user isolation tests before any multi-user deployment.

### High priority — permissive CORS fallback
File: `server.js`

- The server sets `Access-Control-Allow-Origin` to `process.env.CORS_ORIGIN || '*'`.
- If the environment variable is missing, the server permits any origin at the CORS layer.
- Required next step: fail closed in production and allow only explicitly configured trusted origins. Verify preflight and credential behavior.

### Medium priority — rate-limit identity trusts forwarded IP header
File: `lib/security.js`

- `clientKey()` uses the first value of `X-Forwarded-For` when present.
- Whether that header is trustworthy depends on the deployment proxy and trust configuration.
- Rate limits are stored in a process-local `Map`; they are not shared between instances and reset on restart.
- Required next step: define trusted proxy behavior and use shared rate-limit storage if multiple instances are deployed.

### Medium priority — global admin token is not a user identity model
Files: `api/memory.js`, `api/digital-twin.js`

- A single environment token gates administrative memory and digital-twin operations.
- This does not provide individual user roles, session revocation, per-user audit attribution, or scoped permissions.
- Required next step: retain a separate break-glass administrator path only if necessary; use user identity and least-privilege authorization for normal operations.

### Positive controls observed

- `api/chat.js` and `api/agent.js` bound message sizes, message counts, output tokens, tool rounds, and request duration.
- The agent exposes a read-only public GitHub file tool and bounds local tool calls.
- Agent output includes pattern-based secret redaction.
- `lib/security.js` sets several response security headers and `Cache-Control: no-store`.
- `lib/audit.js` reports policy flags disabling autonomous source modification, deployment, rollback, and destructive actions.
- These controls should be retained and tested; they do not replace the missing controls above.

## Scope limitations

- This was a read-only source inspection of selected files on `main`.
- No credentials, secret values, environment variables, production logs, GitHub Actions secrets, or Railway variable values were accessed.
- No live endpoint, dependency audit, penetration test, deployment configuration, or database instance was tested.
- No claim is made that the repository is fully secure.

## Recommended remediation order

1. Add authentication to chat and agent routes.
2. Add per-user authorization and memory/digital-twin isolation.
3. Make production CORS fail closed with an explicit allowlist.
4. Define trusted proxy handling and rate-limit storage semantics.
5. Add automated negative tests for unauthenticated access, cross-user access, CORS, and rate-limit bypass.
6. Re-run the full test suite and review a staging-only smoke test before considering external exposure.

## Release gate

Do not expose COMMAND-0 as a private multi-user service until the high-priority findings are remediated and tested. Keep production deployment, secret changes, destructive database operations, and permission changes behind explicit human approval.
