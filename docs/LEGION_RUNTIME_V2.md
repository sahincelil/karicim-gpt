# LEGION Runtime v2

## What is connected

The repository now has a manual, provider-backed planner workflow at
`.github/workflows/legion-planner.yml`. It reads one existing GitHub Issue,
sends its bounded title/body to OpenRouter, validates the returned JSON plan,
and stores the plan as a seven-day workflow artifact.

This is a real model call when the required repository secret is configured.
It is intentionally **planning-only**: it does not start worker processes,
write source files, comment on issues, run generated commands, deploy, or
perform external side effects.

## One-time GitHub configuration

In the repository, open **Settings → Secrets and variables → Actions → New repository secret**:

- Name: `OPENROUTER_API_KEY`
- Value: your OpenRouter API key

Optionally add a repository variable:

- Name: `OPENROUTER_LEGION_MODEL`
- Value: a model slug available to your OpenRouter account; if omitted, the workflow uses `openrouter/free`.

Never paste the key into an Issue, chat, workflow file, commit, or log. The workflow does not print the key.

## Run a plan

1. Open **Actions → LEGION Agent Planner → Run workflow**.
2. Enter the existing Issue number.
3. Start the workflow.
4. Open the completed run and download the `legion-plan-N` artifact. It expires after seven days.

The workflow is manually dispatched, uses read-only repository permissions, accepts Issues rather than pull requests, serializes planner runs, and validates the model output against fixed role/type/risk allowlists.

## Current boundary

- One planner model call per manually selected Issue.
- Maximum five logical subtasks in the plan.
- No concurrent worker execution yet.
- No generated code execution or repository write permission.
- High-risk or unclear tasks require human approval.
- Because this repository is public, do not put confidential, personal, customer, or workplace information in its Issues.

The next stage is isolated workers with per-role tool allowlists, bounded concurrency (initially no more than three), short-lived credentials, and branch/PR-only code proposals. That stage must be reviewed separately before enabling write-capable agents.
