# LEGION AI Agent Bridge

## Goal

Provide one provider-neutral integration contract so authorized AI agents, bots, and external services can exchange bounded tasks with KaricimGPT through GitHub. GitHub Issues remain the durable inbox and pull requests remain the code-review boundary. This bridge is an integration contract, not a claim that every provider is already connected or continuously running.

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
- Provider adapters: separately configured server-side clients for OpenAI-compatible APIs, Anthropic-compatible APIs, Google/Gemini APIs, OpenRouter, local Ollama gateways, and custom HTTPS bots. Listing a provider here means the contract can accommodate it, not that credentials or a live connection exist.
- Results: issue comments or artifacts for reports; feature branches and pull requests for code proposals.

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

1. **Contract only:** validate schema and document adapter requirements. No provider is considered connected yet.
2. **Read-only pilot:** connect one provider using a restricted server-side secret; permit only research/planning tasks.
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

This document defines the bridge contract and rollout plan. It does not establish live connections to external providers, deploy a service, or grant agents access to the user's other accounts or devices.
