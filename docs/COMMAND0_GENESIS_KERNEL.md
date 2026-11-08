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
- Append-only HMAC-signed, hash-chained audit events when `COMMAND0_AUDIT_KEY` is configured.

## Agent security

The agent registry requires injected `authorizeOwner` and `authorizeAgent` verifiers for privileged registration, revocation, and agent health reports. The default verifiers reject all requests. The literal actor labels `owner` and an agent ID are identifiers only, not authentication proofs. The integration must verify authenticated server-side sessions or signed agent credentials.

## Integration

Import `createCommand0Kernel` from `lib/command0-kernel.js`. Configure an absolute writable path outside the public web root and set `COMMAND0_AUDIT_KEY` through the hosting provider's secret manager. Never commit the signing key or personal task data.

The kernel does not execute arbitrary code, grant OS privileges, access credentials, deploy to production, or connect to remote compute. Those require separate, narrowly scoped adapters and explicit policy review.

## Verification

Run `npm test` with Node.js 24 or later. Tests use temporary directories and test-only signing/authentication fixtures. CI has not yet been observed for the current branch, so passing CI must not be assumed.

## Agent, policy, and recovery modules

- `lib/command0-agent-registry.js` registers unique agent identities, enforces owner-granted capabilities, bounds concurrency, verifies health-report proof, and supports owner-authenticated revocation. It remains in-memory.
- `lib/command0-policy.js` applies a default-deny capability allow-list, per-capability risk ceilings, and approval-reference verification.
- `lib/command0-recovery.js` stores in-memory checkpoints and enforces a bounded retry budget. Recovery is not distributed or durable yet.

## Owner authentication integration

The kernel's privileged actions require an injected asynchronous `authorizeOwner` verifier. The default rejects all owner actions. The hosting/API integration must connect this callback to a real authenticated owner session and validate approval references server-side. Do not use a client-supplied role label as proof of identity.

## Current implementation boundary

The task kernel persists local JSON state atomically. Agent registry and recovery records are in-memory MVP components and are not durable across process restarts. This is not a distributed consensus or remote execution layer. Production use requires durable storage, authenticated API integration, key management, concurrency controls across multiple processes, and independent security review.
