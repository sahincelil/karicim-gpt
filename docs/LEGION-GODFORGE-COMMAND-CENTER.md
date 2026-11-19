# LEGION GODFORGE Command Center

**Canonical repository:** `sahincelil/karicim-gpt`  
**Default branch:** `main`  
**Purpose:** one governed control plane for planning, reviewed software changes, operational evidence and approved integrations.

## Mission

Turn this repository into the coordination hub for LEGION without pretending GitHub is a permanently running machine. GitHub stores source, issues, pull requests, workflow definitions and bounded artifacts. Runtime services and private devices remain separate systems that must be explicitly enrolled and verified.

## Command map

| Command surface | Use | Evidence / entry point |
|---|---|---|
| Project cockpit | Current project status and blockers | [Execution Dashboard](EXECUTION_DASHBOARD.md) |
| Architecture | System boundaries and integrated modules | [LEGION ASCENSION](LEGION-ASCENSION.md) |
| Task intake | Submit a bounded task | GitHub Issue titled `[LEGION] ...` |
| Planning | Decompose accepted work | Existing LEGION planner workflow |
| Specialist analysis | Read-only, bounded worker tasks | Existing agent-swarm workflow |
| Quality gates | Syntax, regression and security checks | GitHub Actions |
| Change delivery | Reviewable code changes | Feature branch + Pull Request |
| Private nodes | Owner-enrolled, least-privilege devices | [Node Operations](LEGION-GITHUB-NODE-OPERATIONS.md) |

## Module registry

The machine-readable registry is [LEGION-MODULE-STATUS.yml](LEGION-MODULE-STATUS.yml). Its status values distinguish source-level implementation from verified live operations.

- **MASTER BRAIN:** task intake, planning and routing.
- **AGENT SWARM:** bounded specialist analysis.
- **AUTONOMOUS FACTORY:** tests, change proposals and pull-request preparation.
- **SELF-HEALING:** health checks, audit and maintenance recommendations.
- **SENTINEL CORE:** dependency, secret and workflow-permission review.
- **DEVICE MESH:** private nodes only after owner enrollment and security checks.
- **WEALTH ENGINE:** business experiments and measurement, not a claim of revenue.
- **SYSTEM ARCHIVE:** content planning and publishing workflow, separately permissioned.

## Operating loop

1. Create an issue with the `[LEGION]` prefix and a clear outcome.
2. Keep the task non-sensitive. Never paste credentials, patient information, private workplace data or customer secrets.
3. Let the intake workflow validate the request and produce a bounded plan.
4. Review specialist findings and workflow artifacts.
5. Implement changes on a feature branch and open a pull request.
6. Require CI and human review before merge.
7. Deploy only through an authorized hosting project and an explicit release approval.
8. Record test evidence and update the dashboard.

## Autonomy policy

LEGION may autonomously perform bounded planning, read-only analysis, tests, linting, health checks, dependency review and draft change preparation. It must not self-approve or self-merge code, deploy to production, roll back production, provision credentials, alter account permissions, execute arbitrary shell commands from model output, contact third parties, spend money or access sensitive data without a separate authorized human approval.

## Secrets and infrastructure

- Store provider keys only in GitHub Actions Secrets or an authorized hosting secret manager.
- Never commit `.env` files, tokens, private keys, device credentials or reusable registration tokens.
- Use GitHub-hosted runners for untrusted CI. Self-hosted runners require separate owner enrollment, isolation and least privilege.
- Private Windows nodes are not reachable merely because they are described in repository documentation.
- Keep firewall and tailnet policies narrow. Do not expose administrative ports to the public internet.

## Acceptance criteria for an operational module

A module is **verified** only when all applicable items are evidenced:
- source and configuration exist;
- required secrets are configured in the correct secret store;
- automated tests pass;
- an authenticated, non-sensitive smoke test passes;
- permissions and resource limits are documented;
- logs or artifacts demonstrate the result.

A workflow passing in GitHub Actions does not prove that a production deployment or third-party provider is live.

## First command

Open a GitHub Issue with title `[LEGION] <desired outcome>`. Include scope, acceptance criteria, allowed data, and whether the work is analysis-only or may prepare a pull request. Keep deployment, external communications and other consequential actions behind human approval.
