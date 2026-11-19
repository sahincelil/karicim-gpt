# LEGION SINGULARITY — MASTER BRAIN

## Purpose

This layer turns the existing GitHub Issue intake and bounded planner/worker workflow into a durable, inspectable task-coordination loop. GitHub Issues are the persistent inbox and task identity; GitHub Actions runs are execution attempts; issue comments are durable state events; workflow artifacts contain detailed planner and worker output.

This is a GitHub-backed queue, not a Redis/PostgreSQL queue. It avoids introducing an unconfigured infrastructure dependency. It is suitable for a controlled pilot, not a claim of high-throughput distributed execution.

## Architecture

```text
GitHub Issue [LEGION] (durable task record)
        |
        v
Issue-scoped Actions concurrency group
        |
        v
MASTER BRAIN planner (OpenRouter)
        |
        v
Validated plan JSON (max 5 subtasks)
        |
        v
AGENT SWARM (max 3 concurrent workers)
        |
        +--> role-specific model selected from repository variables
        |
        v
Validated worker JSON + QA / security reports
        |
        +--> issue comments: RUNNING / COMPLETED / FAILED_OR_PARTIAL
        +--> seven-day workflow artifact
        |
        v
Human review before any privileged action
```

## Durable task lifecycle

1. **Submitted:** a trusted repository owner, member, or collaborator opens an Issue whose title starts with `[LEGION]`; manual dispatch is separately protected by GitHub Actions permissions.
2. **Running:** the workflow writes a status comment containing the run ID and attempt number.
3. **Planned:** the planner produces a bounded JSON plan and validates role, risk, task type, and output limits.
4. **Dispatched:** specialist workers execute in batches of at most three.
5. **Completed:** all specialist workers returned valid structured output.
6. **Failed or partial:** planner or one or more specialist workers failed; the workflow run and issue comment preserve the failure reference.

A manual workflow retry creates a new run attempt. The original Issue remains the durable task identity. Workflow artifacts are retained for seven days; the issue comments and workflow-run history remain the durable audit trail subject to repository retention and permissions.

## Delivery semantics

- Treat delivery as **at-least-once**, not exactly-once.
- The workflow is serialized per issue; different issues may run independently.
- A retry may call a model again and incur additional provider usage.
- No external side effect is performed by planner or specialist workers.
- Before adding any side-effecting worker, require an idempotency key, durable completion record, bounded retry policy, and a tested approval gate.

## Multi-GPT model routing

The planner uses `OPENROUTER_LEGION_MODEL` (fallback: `openrouter/free`).

Each worker can use a different OpenRouter model through repository Actions variables:

| Role | Variable |
|---|---|
| Research | `OPENROUTER_LEGION_MODEL_RESEARCH` |
| Architect | `OPENROUTER_LEGION_MODEL_ARCHITECT` |
| Builder | `OPENROUTER_LEGION_MODEL_BUILDER` |
| QA | `OPENROUTER_LEGION_MODEL_QA` |
| Security | `OPENROUTER_LEGION_MODEL_SECURITY` |
| Operations | `OPENROUTER_LEGION_MODEL_OPERATIONS` |
| Analyst | `OPENROUTER_LEGION_MODEL_ANALYST` |
| Documentation | `OPENROUTER_LEGION_MODEL_DOCUMENTATION` |
| Reviewer | `OPENROUTER_LEGION_MODEL_REVIEWER` |

Unset role variables fall back to `OPENROUTER_LEGION_MODEL`, then the planner's selected model, then `openrouter/free`. This is multi-model routing through one gateway. It does **not** prove direct live connectivity to OpenAI, Anthropic, Google, or xAI. The repository's separate native provider routes remain subject to their own server-side credentials and authenticated smoke tests.

## Intake authorization

- Issue-triggered model runs require both the `[LEGION]` title prefix and an author association of `OWNER`, `MEMBER`, or `COLLABORATOR`.
- Public contributors and first-time reporters cannot start provider-backed runs, preventing arbitrary public Issues from consuming the repository's model budget.
- Manual workflow dispatch remains subject to GitHub's workflow-dispatch permission boundary.
- The authorization is evaluated at the job level before a runner is started and before provider secrets are exposed to a step.

## Permissions and data handling

- The workflow receives `issues: write` only to append queue status comments; it has no repository contents write permission.
- Workers receive no tools, shell, browser, repository-write permission, or production credentials.
- Worker output is data, never executable instructions.
- High-risk, ambiguous, financial, deployment, account/security, or external communication tasks require human review.
- The repository is public. Never place secrets, patient data, workplace-confidential information, or private customer data in Issues. Authorized provider calls process the submitted issue text.
- No automatic merge, deploy, rollback, purchase, payment, or external message is enabled.

## Operational checks

1. A repository owner, member, or collaborator creates an Issue using the `[LEGION]` title prefix.
2. Confirm the workflow posts a RUNNING comment.
3. Confirm the planner and workers complete.
4. Confirm the final issue comment links the run and reports outcomes.
5. Download `legion-plan.json` and `legion-workers.json` from the workflow artifact.
6. Configure distinct role model variables only after checking model availability and cost.
7. Re-run the repository test workflow after each code change.

## Known limitations

- GitHub Issues/Actions is not a low-latency queue service.
- Artifacts expire after seven days.
- This first stage uses OpenRouter for the planner and role-routed workers; per-provider direct adapters are not yet orchestrated by this workflow.
- The current CodeWords free-credit limit prevented a fresh CodeWords runtime smoke test during this implementation.
- Provider credentials and live provider availability must be verified in the repository/hosting environment. No secrets are read or printed by this design.
