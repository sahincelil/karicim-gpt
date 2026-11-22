# LEGION Runtime v3

## What is connected

The GitHub Actions workflow \`.github/workflows/legion-planner.yml\` processes a manually selected Issue or an automatically opened \`[LEGION]\` Issue. Issue-triggered runs are restricted to authors with OWNER, MEMBER, or COLLABORATOR repository association. The provider-backed durable queue and role routing were merged into \`main\` through [MASTER BRAIN PR #58](https://github.com/sahincelil/karicim-gpt/pull/58) on 19 November 2026.

The workflow has two model stages:

1. **Planner:** converts the Issue into a bounded JSON plan with up to five logical subtasks.
2. **Specialist workers:** sends each subtask to a separate model call using its assigned role (Research, Architect, Builder, QA, Security, Operations, Analyst, Documentation, or Reviewer).

At most **three worker model calls run concurrently**. The resulting plan and per-role reports are uploaded together as a seven-day workflow artifact.

## One-time GitHub configuration

Open [Repository Actions secrets](https://github.com/sahincelil/karicim-gpt/settings/secrets/actions/new) and add:

- Secret name: \`OPENROUTER_API_KEY\`
- Secret value: your OpenRouter API key

Optionally add a repository variable named \`OPENROUTER_LEGION_MODEL\` with a model slug available to your OpenRouter account. If absent, the workflow uses \`openrouter/free\`.

Never paste the key into an Issue, pull request, chat message, workflow file, commit, or log. The key is injected only into the job steps that call the provider.

## Run the system

**Automatic intake:** create a task using the [LEGION issue form](https://github.com/sahincelil/karicim-gpt/issues/new?template=legion-task.yml). The form creates a \`[LEGION]\`-prefixed Issue; only an Issue opened by a repository owner, member, or collaborator passes the job-level gate and can start provider calls.

**Manual retry:** open **Actions → LEGION Agent Planner → Run workflow**, enter the Issue number, and start the workflow.

Download the \`legion-results-N\` artifact from the completed run. It contains \`legion-plan.json\` and \`legion-workers.json\`; artifacts expire after seven days.

## Execution and safety boundary

- One planner call plus at most five specialist calls per run.
- Maximum three simultaneous specialist calls.
- Workers receive only the task summary, role, objective, expected deliverable, and acceptance criteria.
- Workers have no tools, browser, shell, GitHub write permission, or production credentials.
- The queue workflow has \`contents: none\` and \`issues: write\` only to append durable status comments.
- No source files are changed; no issue comments, deployments, financial actions, account changes, or external messages are performed by the workers.
- Worker output is data for review, not verified fact or executable instructions. Research requiring live sources must be checked separately.
- If worker calls fail, their per-role status is recorded in the artifact. A run with no completed workers fails.
- High-risk and ambiguous tasks still require human approval before any later privileged stage.

Because the repository is public, do not put confidential, personal, customer, or workplace information in its Issues. Provider calls may process the submitted task text.

## RAG evidence gate

The application agent now accepts optional retrieval candidates at \`POST /api/agent\`. See [RAG Evidence Gate](RAG_EVIDENCE_GATE.md) for the request contract, scoring model, domain allowlist and current limitations. This API-layer evidence gate is distinct from the GitHub Issue planner/worker workflow.

## Future stage

The next stage, if enabled, is isolated tool-using workers with per-role allowlists, ephemeral environments, short-lived credentials, branch/PR-only code proposals, and explicit approval gates. The current planner workers deliberately do not receive those permissions.

See [LEGION ASCENSION](LEGION-ASCENSION.md) for the integrated architecture, connected-app status and rollout gates.
