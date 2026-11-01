# PROJECT Ω — Hybrid Adaptive Intelligence

Status: prototype architecture, plan-only execution.

## Mission

Build a modular assistant that can reason over digital systems and, later, interact with physical robotics through explicitly authorized adapters. "Hybrid" means digital orchestration plus a hardware-independent robotics layer; it does not imply consciousness, general intelligence, or unrestricted control.

## Architecture

```text
Human Control Plane
        |
        v
Ω Orchestrator — goal intake, planning, state and observability
        |
        +--> Policy Engine — adaptive risk classification and approval gates
        |
        +--> Model Gateway — provider-neutral reasoning (existing KaricimGPT routes)
        |
        +--> Memory — existing memory + digital twin (durable production storage unverified)
        |
        +--> Tool Adapter Registry
        |       +--> Research (read-only first)
        |       +--> GitHub / CI (branch + PR first; merge/deploy gated)
        |       +--> Finance (read-only first; no trading/transfers)
        |       +--> Robotics simulator (initial embodiment)
        |               +--> Live hardware adapter (disabled)
        |
        +--> Evidence & Audit — tests, event log, outcome verification
```

## Adaptive autonomy policy

| Risk | Behaviour | Execution |
|---|---|---|
| Low | Plan autonomously | Plan-only prototype |
| Medium | Prepare proposal and request review | Disabled |
| High | Require explicit human approval | Disabled |
| Critical | Block and explain | Disabled |

Risk is classified from the requested goal, but keyword classification is only a first safety layer. Every future adapter must independently enforce authorization, schemas, quotas, idempotency and allowlists.

## Existing integrations

- GitHub: connected and repository write access is visible. Use isolated branches and pull requests; do not merge automatically.
- Vercel: no project was returned for this repository by the connected account.
- Supabase: no project was returned by the connected account.
- Railway: four existing projects were visible, but none has been verified as the PROJECT Ω runtime or database.
- Other ChatGPT connectors: availability in ChatGPT does not automatically grant credentials or API access to the deployed Node.js app. Each adapter needs a documented connection, minimal scopes and server-side secrets.

## Prototype 0.1

- `GET /api/omega`: authenticated status and capability manifest.
- `POST /api/omega`: authenticated `{ "action": "plan", "goal": "..." }`; returns a bounded plan and risk tier.
- `POST /api/omega`: authenticated `{ "action": "simulate_robot", "commands": [...] }`; runs a deterministic 2D simulation only. Supports bounded move, turn, stop and emergency_stop commands.
- Both routes require a dedicated `Authorization: Bearer OMEGA_API_TOKEN`; it must not be reused from the broader memory-admin token.
- No external tool calls, source writes, financial actions, deployment or physical actuation are performed.
- Robotics is simulation-only until hardware, emergency stop, geofence/workspace limits, force/speed caps and independent operator controls are tested.

## Production gates

1. User identity and per-user authorization.
2. Durable storage with restart-persistence tests and backups.
3. Shared rate limits, provider-spend budgets and request-size/time limits.
4. Secret management and connector-specific least-privilege scopes.
5. Audit trail with redaction and retention controls.
6. Staging tests for auth bypass, prompt injection, data isolation, replay, rate limits and failure modes.
7. Robotics safety case before any live actuator connection.
8. Human approval for merge, deployment, purchases, messages, transfers, destructive changes and physical movement.

## First milestones

- M0: plan-only API and deterministic tests.
- M0.1: deterministic 2D robotics simulator with bounded movement, emergency stop and no hardware connection.
- M1: provider-neutral model gateway and structured plan/evidence objects.
- M2: read-only adapters (GitHub metadata, research and market data).
- M3: durable per-user state and audited approvals.
- M4: robotics simulation and hardware interface contract.
- M5: staged pilot; no production autonomy until every gate passes.
