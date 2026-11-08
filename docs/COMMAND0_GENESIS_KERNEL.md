# COMMAND-0 Genesis Kernel (MVP)

This module is the first executable foundation for the COMMAND-0 architecture. It is deliberately a task-control kernel, not an autonomous shell or remote-access agent.

## Scope

- Unique task IDs and idempotency keys.
- Persistent JSON task state with atomic file replacement.
- Explicit task state transitions.
- Owner-only authorization; agents cannot grant themselves permissions.
- Capability allow-list and bounded resource budgets.
- Explicit approval references for high/critical risk tasks.
- Evidence-required verification.
- Owner emergency halt and resume.
- Append-only HMAC-signed audit events when `COMMAND0_AUDIT_KEY` is configured.

## Integration

Import `createCommand0Kernel` from `lib/command0-kernel.js`. Configure an absolute writable path outside the public web root and set `COMMAND0_AUDIT_KEY` through the hosting provider's secret manager. Never commit the signing key or personal task data.

The kernel does not execute arbitrary code, grant OS privileges, access credentials, deploy to production, or connect to remote compute. Those require separate, narrowly scoped adapters and explicit policy review.

## Verification

Run `node --test test/command0-kernel.test.js`. Tests use temporary directories and a test-only signing key.
