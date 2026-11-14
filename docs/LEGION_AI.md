# LEGION AI Command Center

## Purpose

LEGION is a GitHub-first task control plane for KaricimGPT. GitHub Issues are the durable task inbox, GitHub Actions validates intake packets, and pull requests are the review boundary for proposed code changes.

This first release is deliberately an **intake and governance layer**. It does not claim to run thousands of independent agents, does not invoke an LLM, and does not execute issue instructions. Provider-backed worker execution can be added later behind a separately reviewed sandbox and explicit secret configuration.

## Existing KaricimGPT foundation

- Frontend: `index.html` and `app.js`
- Runtime: `server.js`
- AI routes: `/api/chat`, `/api/agent`, `/api/grok`, `/api/council`
- Maintenance routes: `/api/self-test`, `/api/audit`, `/api/proposals`, `/api/evolve`, `/api/maintenance`
- Persistence: file-backed memory and versioned digital-twin profile
- CI: syntax checks, regression tests, integration tests, and runtime health checks

LEGION should orchestrate these existing capabilities rather than create a parallel runtime or bypass the existing security contract.

## Agent roles

| Role | Responsibility | Default access |
|---|---|---|
| Commander / Dispatcher | Classify, split, prioritize, and track tasks | Issue metadata only |
| Research | Gather evidence and identify uncertainty | Read-only |
| Architect | Propose designs and interfaces | Read-only |
| Builder | Prepare code changes on a branch | No production credentials |
| QA | Run tests and report regressions | Test environment only |
| Security | Review permissions, secrets, dependencies, and threat boundaries | Read-only |
| Operations | Prepare deployment/rollback plans | Read-only; human executes |
| Analyst | Produce data and decision analysis | Minimum necessary data |
| Documentation | Maintain guides and runbooks | Branch + PR only |
| Reviewer | Challenge assumptions and verify acceptance criteria | Read-only |

These are role profiles, not ten permanently running processes. The orchestrator may delegate bounded subtasks to workers when a future execution adapter is installed. Start with a maximum of **3 concurrent worker jobs** and increase only after measuring reliability, cost, and rate limits.

## Task lifecycle

1. A user creates a task using the LEGION issue form.
2. The intake workflow validates required fields and prints a bounded task summary in the Actions log.
3. A human reviews scope, risk, and acceptance criteria.
4. Research and planning tasks may proceed with read-only access.
5. Code changes are proposed on a feature branch and submitted as a pull request.
6. CI and security review run before a human merges.
7. The issue is closed only after the acceptance criteria are met.

Suggested labels for maintainers to create in GitHub:

- `legion:queued`
- `legion:triage`
- `legion:planned`
- `legion:in-progress`
- `legion:review`
- `legion:blocked`
- `legion:done`
- `legion:needs-approval`

## Security model

- Treat issue titles, bodies, comments, branch names, and artifacts as untrusted input.
- Never interpolate issue text into shell commands, JavaScript source, SQL, or file paths.
- The intake workflow has read-only permissions and does not check out or execute repository code.
- Do not use `pull_request_target` to run untrusted pull-request code.
- Do not expose provider keys, personal tokens, deployment credentials, or other secrets to issue-triggered workflows.
- Do not allow an agent to run arbitrary shell commands, access arbitrary URLs, or write arbitrary repository paths.
- Use allowlisted tools and task types; impose time, token, output-size, and concurrency limits.
- Code changes must be proposed through a branch and reviewed pull request.
- Deployment, rollback, deletion, purchases, financial transactions, external messages, account/security changes, and access to sensitive personal data always require explicit human approval.
- Never put secrets or confidential customer/workplace data in this public repository's Issues, files, or logs.

## Execution stages

### Stage 1: GitHub task inbox (this release)

- Structured issue form.
- Read-only intake validation.
- Explicit task type and impact declaration.
- No LLM calls, code execution, or external side effects.

### Stage 2: Provider-backed planner (implemented on feature branch)

- Manual GitHub Actions dispatch reads one selected Issue with read-only permissions.
- OpenRouter is called using the `OPENROUTER_API_KEY` repository Actions secret.
- Planner emits a bounded JSON plan; fixed allowlists validate task types, roles, and risk.
- Plan is stored as a seven-day workflow artifact.
- This stage is planning-only: no worker processes, code changes, issue comments, deployments, or external side effects.

See `docs/LEGION_RUNTIME_V2.md` for setup and operation.

### Stage 3: Worker delegation

- Each future worker receives only its assigned task and minimum required context.
- Worker output is an artifact or pull-request proposal, never an instruction to execute arbitrary commands.

### Stage 3: Sandboxed workers

- Use isolated, ephemeral runners or containers with no production credentials.
- Default network access off; allowlist destinations only when justified.
- Enforce maximum three concurrent workers initially.
- Separate read-only analysis from write-capable code proposal jobs.
- Require a human approval gate before any privileged operation.

### Stage 4: Measured scaling

Scale worker count only after task success rate, review rejection rate, latency, token spend, and security incidents are measured. "Thousands of agents" should mean a logical catalog of role profiles and queued tasks, not thousands of always-on processes.

## Definition of ready

- Issue form creates a consistent task packet.
- Intake workflow validates allowed task types and required fields.
- Workflow token is read-only.
- Issue text is never executed or passed to a shell.
- Existing CI remains the source of truth for tests.
- All code modifications flow through pull requests.
- No deployment or destructive action is automated.
