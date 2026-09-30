# KaricimGPT Architecture

## Runtime layers

- **Frontend:** `index.html` + `app.js`
- **HTTP body:** `server.js`
- **AI routes:** `/api/chat`, `/api/agent`, `/api/grok`, `/api/council`
- **Maintenance:** `/api/self-test`, `/api/audit`, `/api/proposals`, `/api/evolve`, `/api/maintenance`
- **Persistence:** file-backed memory with configurable `MEMORY_FILE` / `DATA_DIR`
- **Automation:** GitHub Actions runs tests and runtime health checks

## Autonomous maintenance model

The system can automatically observe runtime state, analyze failures, generate maintenance proposals, run regression tests, and verify the result.

Source modification, deployment, rollback, destructive operations, arbitrary shell execution, and secret disclosure remain explicitly disabled. A proposal is an analysis artifact, not an instruction to mutate infrastructure.

## Council

Council asks independent providers in parallel, extracts bounded evidence/uncertainty signals, and optionally asks OpenRouter for a structured synthesis. The response exposes whether the structured synthesis was actually parsed through `coordination.structuredParse`.

## Operational endpoints

- `GET /health` — runtime health and heartbeat
- `GET /api/body` — capabilities and safety contract
- `GET /api/self-test` — deterministic internal regression checks
- `GET /api/audit` — runtime audit and fingerprint
- `GET /api/proposals` — bounded maintenance proposals
- `GET /api/maintenance` — consolidated maintenance report
- `GET /api/evolve` — evolution pipeline and guardrails

## Design principle

KaricimGPT is designed for **controlled autonomy**: maximize automated observation, reasoning, testing, and proposal generation while keeping irreversible infrastructure actions behind explicit human control.
