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


## Existing KaricimGPT gateway

A signed gateway already exists at `POST /api/bridge` (see `api/bridge.js`). It currently supports `health` and `agent`, authenticates requests with HMAC-SHA256 using `X-Bridge-Timestamp` and `X-Bridge-Signature`, and rejects timestamps outside a five-minute window. The gateway delegates to the server-configured agent provider. It is a secure entry point for authorized bots, but it is not yet a multi-agent queue or a provider mesh.

Reference client: `examples/bridge-client.mjs` (Node.js 24, built-in crypto/fetch). See `docs/AGENT_BRIDGE.md` for exact signing rules and limits.

To connect a bot:
1. Deploy the application through an authorized host.
2. Set a long random `BRIDGE_SHARED_SECRET` in the server's secret environment.
3. Configure the selected model provider key on the server, never in the bot's source or browser.
4. Give the bot the gateway URL and the shared secret via its own secret manager.
5. Start with read-only, non-sensitive prompts; rotate/revoke the secret if exposed.

No external provider is marked connected by this scaffold. Each provider still needs a reviewed adapter and its own credentials.
