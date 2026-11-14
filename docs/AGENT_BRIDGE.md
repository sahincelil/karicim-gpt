# LEGION AI Agent Bridge

## Goal

Provide one provider-neutral integration contract so authorized AI agents, bots, and external services can exchange bounded tasks with KaricimGPT through GitHub. GitHub Issues remain the durable inbox and pull requests remain the code-review boundary. The repository exposes an authenticated `POST /api/bridge` endpoint for `health` and `agent` actions. The multi-agent task queue and provider-specific worker adapters described below are the next layer, not yet live.

## Topology

```text
External agents / bots / AI providers
          | HTTPS + scoped credentials
          v
Provider adapters (one adapter per provider)
          | normalized Agent Task Envelope
          v
LEGION dispatcher and policy validation
          | GitHub Issues / labels / artifacts
          v
Bounded worker queue (initial concurrency: 3)
          |
          +--> read-only research / planning
          +--> isolated code proposal branch --> Pull Request
          +--> QA report / audit artifact
          |
          v
Human approval gate --> merge / deploy / external side effect
```

## Integration contract

Every adapter MUST:
1. Authenticate with a dedicated, revocable credential stored only in a server-side secret manager or GitHub Actions Secrets.
2. Identify provider, model/agent, task ID, requested capabilities, and callback/result destination.
3. Submit the versioned JSON envelope in `schemas/agent-task.schema.json`.
4. Treat GitHub issue text, comments, artifacts, and provider output as untrusted data.
5. Enforce task, token, time, output-size, network, and concurrency limits.
6. Return structured status and evidence. Never interpret model output as executable shell instructions.
7. Use idempotency keys to prevent duplicate work and record correlation IDs for audit.
8. Request only the minimum scopes and context required for the assigned task.

## Initial supported integration pattern

- GitHub Issues: durable task intake and status.
- GitHub Actions: schema validation, policy checks, tests, and bounded reporting.
- Native provider routes: `/api/claude` (Anthropic Messages API) and `/api/gemini` (Google Gemini `generateContent` API). Each requires its provider API key and a separate `PROVIDER_SHARED_SECRET` configured server-side.
- Existing routes: `/api/chat` supports OpenAI, xAI, and OpenRouter; `/api/grok` uses xAI; `/api/council` can call xAI, OpenRouter, Anthropic Claude, and Google Gemini when configured. OpenRouter performs optional synthesis.
- Additional adapters: OpenRouter, local Ollama gateways, and custom HTTPS bots can be added under the same provider-neutral contract. A code route is not a live connection until credentials and deployment are configured.
- Results: issue comments or artifacts for reports; feature branches and pull requests for code proposals.

## Provider endpoint authentication

Both native provider endpoints reject unauthenticated requests before calling a paid provider API.

- Required server secret: `PROVIDER_SHARED_SECRET`, a long random value distinct from every provider API key and from `BRIDGE_SHARED_SECRET`.
- Headers: `X-Provider-Timestamp` (Unix milliseconds) and `X-Provider-Signature` (lowercase or uppercase hex HMAC-SHA256).
- Signature input: `<timestamp>.<JSON.stringify(requestBody)` using the exact JSON serialization sent in the HTTP body.
- Replay window: five minutes. Requests must use POST and a JSON object body.
- Body limit: 180 KB after JSON parsing. A per-IP rate limit is also applied.
- The caller computes HMAC-SHA256 with `PROVIDER_SHARED_SECRET`; provider API keys remain server-side and are never sent to the caller.

Example Node.js signing snippet:

```js
import crypto from 'node:crypto';

const timestamp = String(Date.now());
const body = { messages: [{ role: 'user', content: 'Hello' }] };
const serialized = JSON.stringify(body);
const signature = crypto.createHmac('sha256', process.env.PROVIDER_SHARED_SECRET)
  .update(`${timestamp}.${serialized}`)
  .digest('hex');

await fetch(`${process.env.APP_URL}/api/claude`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-provider-timestamp': timestamp,
    'x-provider-signature': signature
  },
  body: serialized
});
```

## Permission tiers

| Tier | Capabilities | Default |
|---|---|---|
| T0 | Read task metadata and public repository docs | Allowed |
| T1 | Read approved context and return analysis | Allowlisted |
| T2 | Create proposal artifacts / feature branch / PR | Explicitly configured |
| T3 | Merge, deploy, rollback, delete, spend money, send messages, change account security, or access sensitive data | Human approval every time |

No agent receives production credentials by default. No provider may elevate its own permissions.

## Trust and safety requirements

- Never commit API keys, tokens, passwords, recovery codes, or personal data.
- Never expose secrets in issues, logs, prompts, artifacts, or model responses.
- Do not run issue text or model output as code, shell, SQL, or file paths.
- Do not use `pull_request_target` to execute untrusted pull-request code.
- Use ephemeral isolated workers; network disabled unless a reviewed allowlist is configured.
- Validate provider responses against schemas and reject unknown task types or capabilities.
- Apply per-provider budgets, rate limits, timeouts, retry ceilings, and circuit breakers.
- Keep the initial worker concurrency at three until measured reliability and cost justify a change.
- Require a human review of all code changes and explicit approval for privileged or external side effects.

## Rollout

1. **Provider routes:** native Claude and Gemini routes plus existing OpenAI, xAI, and OpenRouter routes are present in source. Live availability depends on server-side keys and deployment.
2. **Read-only pilot:** configure one provider using a restricted server-side secret; smoke-test research/planning requests.
3. **Proposal pilot:** enable isolated branch/PR creation after security review.
4. **Measured expansion:** add providers one at a time; track success rate, latency, cost, rejection rate, and security events.

## Acceptance checklist

- [ ] Schema validation rejects malformed or unknown task packets.
- [ ] Provider secrets are configured outside the repository.
- [ ] Adapter identity and requested capabilities are authenticated and allowlisted.
- [ ] Duplicate submissions are idempotent.
- [ ] Logs contain correlation IDs but no secrets or sensitive payloads.
- [ ] Read-only pilot passes tests and rate limits.
- [ ] Code proposal flow creates reviewable PRs only.
- [ ] Human approval gates are tested for every privileged operation.

## Current status

This branch contains native provider routes and a four-provider Council implementation, but this PR is not merged or deployed. No live connection is confirmed until provider credentials are configured in the hosting environment and authenticated smoke tests pass.

## Existing live gateway contract

The current application routes `POST /api/bridge` to `api/bridge.js`.

- Actions: `health` and `agent`.
- Authentication: HMAC-SHA256 over the exact string `<timestamp>.<raw JSON body>`.
- Headers: `X-Bridge-Timestamp` (Unix milliseconds) and `X-Bridge-Signature` (hex HMAC).
- Replay window: five minutes.
- Request body limit: 180 KB.
- Rate limiting: uses the shared application rate limiter.
- Agent input: up to 20 messages, each content string bounded to 12,000 characters.

Configure `BRIDGE_SHARED_SECRET` only in the server environment. The calling bot must receive the same secret through its own secret manager. Configure model-provider API keys separately on the server; do not distribute provider keys to calling bots. Use `examples/bridge-client.mjs` as a minimal Node.js 24 reference client.

The current gateway is not yet a durable multi-agent queue: it forwards one bounded conversation to the configured agent and returns its response. GitHub Issues, the task schema, and reviewed PRs provide the governance foundation for the later dispatcher/worker layer.
