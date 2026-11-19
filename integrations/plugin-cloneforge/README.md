# LEGION Plugin CloneForge

This directory is the first independently versioned provider registry and adapter boundary for KaricimGPT / LEGION.

## What this release does

- Catalogues 94 provider namespaces and 3,309 observed tool operations from the connected tool inventory snapshot.
- Separates code that already exists elsewhere in the repository from providers that are only catalogued.
- Provides a read-only JSON API at `GET /api/plugin-catalog`.
- Provides a standalone searchable UI at `/plugins.html`.
- Defines a provider-neutral adapter contract and an example read-only GitHub adapter shape.

## What it does not claim

The catalog is not a clone of vendor plugin source code, and it does not mean that any provider is connected. Existing provider-specific source code elsewhere in this repository is not proof of live credentials or a verified connection. Each provider needs its own documented API adapter, least-privilege credentials, contract tests, and a successful health check.

## Adapter contract

Each adapter must declare:

- stable provider and adapter IDs;
- authentication mode;
- explicit capability allowlist;
- health-check operation;
- timeout, rate, retry, payload, and audit behavior.

Supported auth patterns are OAuth 2.0 Authorization Code + PKCE, app-installation tokens, API keys held server-side, signed webhooks, and public APIs. Do not implement a fake generic OAuth flow; each provider's authorization server and scopes must be documented independently.

## Security baseline

- Use OAuth authorization-code flows with PKCE and exact redirect URI matching where supported.
- Never use the Resource Owner Password or implicit grant.
- Keep provider credentials server-side in a secret manager; never add credentials to this repository or browser storage.
- Never request broad scopes where a narrower read-only scope is sufficient.
- Health checks must return only success/failure metadata, not raw tokens or provider payloads.
- Separate read-only capabilities from write, financial, account-security, publication, or destructive capabilities.
- Require explicit human approval for material external side effects.

## Roadmap

1. **Registry (this PR):** provider inventory, searchable catalog UI, JSON API, adapter interface, baseline tests.
2. **Read-only adapters:** implement and verify selected providers individually, starting with GitHub, Notion, Gmail/Calendar, and OpenAI.
3. **Workflow adapters:** add task-specific operations with per-capability scopes and audit records.
4. **Multi-provider orchestration:** add queues, idempotency, retry ceilings, cost budgets, circuit breakers, and approval gates.
5. **Scale-out:** migrate state to a durable transactional store and add per-provider monitoring.

## Run tests

```bash
node test/plugin-registry.test.js
```

The root `npm run check` script includes this test after this change is merged.
