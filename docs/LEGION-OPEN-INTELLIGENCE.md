# LEGION OPEN INTELLIGENCE FOUNDATION

**Status:** architecture and configuration contract; provider integrations are not newly activated by this document.  
**Branch:** `feat/legion-open-intelligence-foundation`  
**Control plane:** existing KaricimGPT Node.js 24 runtime and LEGION MASTER BRAIN.

## Objective

Build a provider-independent model network that can use locally hosted open-weight models and separately authorized commercial APIs through one internal contract. LEGION owns task state, routing policy, memory, evaluation data, and audit records. Model providers are replaceable execution backends.

This project does not access provider infrastructure outside documented interfaces, reuse private credentials, or copy proprietary model weights/source. OpenAI and other commercial providers are optional adapters using credentials supplied by the account owner.

## Current repository baseline

- `/api/chat` already has native OpenAI, OpenRouter and xAI request paths with server-side environment variables.
- The default application path currently uses OpenRouter when configured; existing routes and defaults must be preserved until a tested migration is approved.
- MASTER BRAIN uses GitHub Issues/Actions for durable task identity and bounded specialist work; it is not a high-throughput queue.
- The RAG evidence gate is a validation layer for supplied candidates, not yet a complete crawler/vector retrieval system.
- A provider route in source is not proof of a live connection. Each adapter needs a configured secret and an authenticated smoke test.

## Target architecture

```text
User / authorized task intake
          |
          v
LEGION MASTER BRAIN (Node.js control plane)
          |
          +--> policy, budgets, task schema, idempotency
          |
          v
Model Router (provider-neutral contract)
          |
          +--> Ollama (local open-weight inference)
          +--> vLLM (self-hosted GPU inference)
          +--> OpenRouter (optional model gateway)
          +--> OpenAI Responses API (optional authorized adapter)
          +--> other explicitly configured adapters
          |
          v
Specialist agents: research / science / health / engineering / analyst
          |
          v
Evidence gate + independent evaluation + human review
          |
          v
LEGION-owned memory and auditable task result
```

## Adapter contract

Every provider adapter should implement the same internal interface:

- `id`: stable provider identifier.
- `capabilities()`: models, modalities, tool support, context limits, and operational status.
- `generate(request, signal)`: normalized request/response; no provider-specific fields leak into agent code.
- `healthcheck()`: non-sensitive connectivity check.
- `estimateCost(request)`: estimate when provider pricing is known; otherwise return `unknown`.

A normalized request contains `taskId`, `role`, `messages`, `modelAlias`, `maxOutputTokens`, `timeoutMs`, and a policy-approved tool list. A normalized response contains `provider`, `model`, `output`, `usage`, `latencyMs`, and `requestId`.

## Routing policy

1. Resolve role to an approved model alias in the versioned registry.
2. Filter by required capabilities, context size, availability, license approval, and deployment policy.
3. Rank eligible candidates by task quality, latency, and known cost.
4. Apply per-provider concurrency, timeout, retry, and spend limits.
5. Use fallback only for retryable availability failures; do not silently switch models for policy or authentication errors.
6. Record selected provider/model and reason in the audit event. Never record API keys or private prompt data in routine logs.

## Initial model registry

The companion `config/model-registry.example.json` is a non-secret template. It intentionally marks unconfigured local and commercial backends as disabled. Model IDs are examples/placeholders and must be verified against the chosen runtime before activation.

For local inference, begin with Ollama's local API or its OpenAI-compatible endpoint. Consider vLLM only after hardware/VRAM benchmarking. LiteLLM may be introduced as a separate gateway when multiple backends need centralized routing; do not add it as a mandatory dependency before a local smoke test proves the need.

## Data and privacy boundaries

- Provider credentials belong only in the deployment secret manager or local environment, never in Git, Issues, logs, or client bundles.
- Do not send patient-identifiable, workplace-confidential, or other sensitive data to a provider unless the relevant service, agreement, and data-handling configuration explicitly permit it.
- Keep memory and retrieval stores under LEGION-controlled infrastructure; provider context is transient and minimized.
- Treat retrieved documents, model outputs, tool results, and uploaded artifacts as untrusted data.
- Tool permissions are granted per task and role, not inherited from the model.
- Model output is never executed as shell, SQL, deployment, or account-management instructions.

## Rollout sequence

### Phase A — contract and inventory
- Keep existing `/api/chat` behavior unchanged.
- Add registry schema validation and provider capability reporting.
- Add tests for unknown aliases, disabled providers, missing secrets, and policy-denied tools.

### Phase B — local open model
- Install Ollama on an owner-controlled machine.
- Select a model only after checking its license, hardware requirements, and language/task evaluation.
- Configure the local endpoint outside source control.
- Run a non-sensitive smoke test and compare latency/quality with the current route.

### Phase C — unified routing
- Add the provider-neutral adapter behind a feature flag.
- Run shadow evaluations without changing user-visible production routing.
- Enable role-based routing for one low-risk task class at a time.

### Phase D — independent operations
- Add provider health, budget ceilings, retry policy, and alerting.
- Add regression evaluations and model-version pinning.
- Require human review for model changes, privileged tool grants, merges, and production deployment.

## Acceptance tests

- Registry schema rejects duplicate aliases and unknown providers.
- Disabled providers cannot receive requests.
- Missing credentials fail closed without exposing secret values.
- A local provider can complete a non-sensitive prompt through the normalized contract.
- Provider timeout and rate-limit errors are classified; only retryable failures trigger fallback.
- Model choice, latency, usage, and fallback reason are auditable without logging secrets.
- Prompt injection in retrieved content cannot grant tools or override system policy.
- Existing chat, council, MASTER BRAIN, and repository checks remain green.

## Not included in this phase

No provider credentials are created or changed; no commercial API is activated; no model weights are copied; no production deployment, merge, automated source mutation, or external account action is performed. This branch is an implementation foundation for review and subsequent tested adapter work.
