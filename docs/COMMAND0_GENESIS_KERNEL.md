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

## Agent, policy, and recovery modules

- `lib/command0-agent-registry.js` registers unique agent identities and immutable-at-registration capability lists. Revocation clears capabilities.
- `lib/command0-policy.js` applies a default-deny capability allow-list, per-capability risk ceilings, and approval-reference requirements.
- `lib/command0-recovery.js` classifies failures and recommends at most three retries for an allow-listed set of transient errors, always from a supplied checkpoint reference. It does not execute retries itself.

## Owner authentication integration

The kernel's privileged actions require an injected asynchronous `authorizeOwner` verifier. The default rejects all owner actions. The hosting/API integration must connect this callback to a real authenticated owner session and validate approval references server-side. The string `actor: 'owner'` alone is not authentication. Do not use a client-supplied role label as proof of identity.

## Current implementation boundary

The agent registry and recovery records are in-memory MVP components. They are not yet durable across process restarts and are not a distributed consensus or remote execution layer. Production use requires durable storage, authenticated API integration, key management, concurrency controls across multiple processes, and independent security review.
