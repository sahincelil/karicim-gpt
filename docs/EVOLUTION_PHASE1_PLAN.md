# Evolution Phase 1: Durable Memory and Deployment Readiness

Status: proposal only — no runtime behavior changed.

## Objective

Make KaricimGPT's memory behavior explicit and reliable across local development and production deployments, while preserving human approval for infrastructure changes.

## Current known architecture

- Runtime: Node.js server with `/api/chat` and related API routes.
- Memory: file-backed storage configured through `MEMORY_FILE` / `DATA_DIR`.
- Operations: health, self-test, audit, proposals, evolve, and maintenance endpoints.
- CI: scheduled tests and runtime health checks.
- Guardrails: no unattended production deployment, rollback, destructive operations, arbitrary shell execution, or secret disclosure.

## Phase 1A — Establish the deployment target

Before implementing a storage backend, confirm the actual hosting model and its persistence guarantees.

Questions to answer:
1. Is production hosted on a serverless platform, a persistent Node.js host, or a user-managed machine?
2. Does the host provide a durable mounted volume? If not, file-backed memory must not be treated as durable production storage.
3. Which managed database/KV service is available in the selected hosting environment, and what are its backup, access-control, and retention properties?

Do not add provider-specific credentials or select a paid service until the deployment target is confirmed.

## Phase 1B — Storage adapter proposal

Introduce a small storage interface so chat and memory logic do not depend directly on filesystem paths. Keep the current file adapter for local development. Add a production adapter only after the hosting provider and persistence service are confirmed.

Required behavior:
- Explicit configuration and startup validation.
- Fail closed or return a clear, bounded error when persistent storage is unavailable; do not silently claim a write succeeded.
- Per-user/session data isolation, with no cross-user memory reads.
- Bounded payload sizes and input validation.
- No API keys, credentials, or raw sensitive conversation content in logs.
- No automatic migration or destructive data rewrite.

## Phase 1C — Tests

Add automated tests for:
- Save and read round-trip.
- Data remains available after a process restart when using the durable adapter.
- Isolation between distinct user/session identifiers.
- Empty, malformed, oversized, and unsupported payloads.
- Storage timeout/unavailable behavior.
- Missing configuration and invalid configuration.
- Secret redaction in errors/logging.
- Existing memory behavior remains compatible with the file adapter.

Use a fake/in-memory adapter for deterministic unit tests; use an opt-in integration test for the real provider. CI must not require production secrets.

## Phase 1D — Staging verification

In a staging environment only:
1. Configure the chosen durable storage service.
2. Run health, self-test, audit, and maintenance endpoints.
3. Write a test record, restart/redeploy the staging process, and verify the record remains.
4. Verify access isolation and inspect logs/artifacts for secret leakage.
5. Document recovery and rollback steps.

Production changes require explicit human approval.

## Acceptance criteria

- Existing regression checks pass.
- Local file-backed development remains usable.
- The selected production adapter demonstrably survives process restart.
- Health/readiness output accurately distinguishes a reachable HTTP server from a functioning durable memory backend.
- Missing or unhealthy storage is visible and never reported as a successful persistence operation.
- Environment variables and staging setup are documented without including actual secret values.
- No automatic production deployment, destructive migration, or rollback is introduced.

## Decisions still required

- Actual production host and runtime model.
- Whether that host guarantees persistent volumes.
- Approved database/KV provider and data-retention requirements.
- Whether the app has a stable authenticated user identity suitable for memory partitioning.

## Implementation boundary

This document is a plan only. Do not claim the app has durable production memory until the adapter is implemented, tests pass, and the staging restart test succeeds.
