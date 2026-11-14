# LEGION Runtime v3

## What is connected

The manual GitHub Actions workflow `.github/workflows/legion-planner.yml` reads one selected GitHub Issue and calls OpenRouter using the server-side `OPENROUTER_API_KEY` repository secret.

The workflow now has two model stages:

1. **Planner:** converts the Issue into a bounded JSON plan with up to five logical subtasks.
2. **Specialist workers:** sends each subtask to a separate model call using its assigned role (Research, Architect, Builder, QA, Security, Operations, Analyst, Documentation, or Reviewer).

At most **three worker model calls run concurrently**. The resulting plan and per-role reports are uploaded together as a seven-day workflow artifact.

## One-time GitHub configuration

Open [Repository Actions secrets](https://github.com/sahincelil/karicim-gpt/settings/secrets/actions/new) and add:

- Secret name: `OPENROUTER_API_KEY`
- Secret value: your OpenRouter API key

Optionally add a repository variable named `OPENROUTER_LEGION_MODEL` with a model slug available to your OpenRouter account. If absent, the workflow uses `openrouter/free`.

Never paste the key into an Issue, pull request, chat message, workflow file, commit, or log. The key is injected only into the job steps that call the provider.

## Run the system

1. Create a task using the [LEGION issue form](https://github.com/sahincelil/karicim-gpt/issues/new?template=legion-task.yml).
2. Open **Actions → LEGION Agent Planner → Run workflow**.
3. Enter the Issue number and start the workflow.
4. Download the `legion-results-N` artifact from the completed run. It contains `legion-plan.json` and `legion-workers.json`; artifacts expire after seven days.

## Execution and safety boundary

- One planner call plus at most five specialist calls per run.
- Maximum three simultaneous specialist calls.
- Workers receive only the task summary, role, objective, expected deliverable, and acceptance criteria.
- Workers have no tools, browser, shell, GitHub write permission, or production credentials.
- The workflow has `contents: none` and `issues: read` permissions.
- No source files are changed; no issue comments, deployments, financial actions, account changes, or external messages are performed.
- Worker outputs are recommendations, not verified facts or executed work. Research requiring live sources must be checked separately.
- If worker calls fail, their per-role status is recorded in the artifact. A run with no completed workers fails.
- High-risk and ambiguous tasks still require human approval before any later privileged stage.

Because the repository is public, do not put confidential, personal, customer, or workplace information in its Issues. Provider calls may process the submitted task text.

## Future stage

The next stage, if enabled, is isolated tool-using workers with per-role allowlists, ephemeral environments, short-lived credentials, branch/PR-only code proposals, and explicit approval gates. This version deliberately does not grant those permissions.
