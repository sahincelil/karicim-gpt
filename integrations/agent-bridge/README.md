# LEGION Provider Adapter Starter

This directory defines the boundary for provider-specific integrations. Keep provider SDKs and credentials out of the shared task contract.

## Adapter responsibilities

An adapter translates a provider's API into the LEGION Agent Task Envelope:

- `submit(task)`: validate the envelope, authenticate the provider, enforce allowlisted capabilities, and enqueue the bounded task.
- `poll(taskId)`: return `queued | running | succeeded | failed | rejected` plus a bounded result reference.
- `cancel(taskId)`: request cancellation where supported.
- `health()`: report provider availability without exposing configuration or secrets.

## Required controls

- Dedicated server-side credential per provider, least privilege, rotation and revocation.
- Strict schema validation and task-type allowlist.
- Idempotency and correlation IDs.
- Per-provider rate, token, cost, timeout, retry, and output limits.
- No arbitrary shell, unrestricted filesystem, or unrestricted network access.
- No production secrets in worker environments.
- Human approval for merges, deployments, rollback, deletion, purchases, financial actions, external messages, account/security changes, or sensitive personal-data access.

## Connection status

No provider is marked connected by this scaffold. Configure one provider at a time in a server-side environment after reviewing the adapter implementation and required scopes. Never paste API keys into GitHub Issues or commit them to this repository.
