# LEGION ASCENSION — Integrated Architecture

**Status snapshot:** 22 November 2026  
**Canonical repository:** \`sahincelil/karicim-gpt\`  
**Architecture rule:** one control plane, bounded workers, shared policy, reviewed changes.

## Executive architecture

LEGION is not a single always-on super-agent. It is a coordinated system made from the KaricimGPT application runtime, GitHub governance, bounded model workers, retrieval/evidence validation, operational checks, and separately enrolled infrastructure.

\`\`\`
User / maintainer
      |
      v
GitHub Issue [LEGION] or authorized manual dispatch
      |
      v
Intake policy gate
  - issue title prefix
  - author association: OWNER / MEMBER / COLLABORATOR
  - manual dispatch remains under GitHub Actions access controls
      |
      v
GitHub Issues task record + issue-scoped Actions concurrency
      |
      v
MASTER BRAIN planner (OpenRouter)
      |
      +--> validated plan: at most 5 bounded subtasks
      |
      v
AGENT SWARM (at most 3 concurrent read-only specialists)
      |
      +--> role-routed models through OpenRouter
      +--> structured findings / risks / questions / deliverables
      |
      v
RAG EVIDENCE GATE (optional retrieval candidates)
      - source URL and content checks
      - relevance ranking and duplicate rejection
      - source-domain allowlist signal
      |
      v
Issue status comments + workflow artifacts
      |
      v
QA / security / human review
      |
      +--> reviewed feature branch and pull request
      |
      v
Human merge / deployment approval
\`\`\`

The GitHub queue is durable enough for a controlled pilot, but it is not a Redis/PostgreSQL high-throughput queue. Delivery is at-least-once, retries can invoke models again, and separate issue IDs can execute independently.

## Integrated layers

| Layer | Responsibility | Current implementation state |
|---|---|---|
| MASTER BRAIN | Intake, task planning, routing and lifecycle state | Merged to main in PR #58 on 19 November 2026 |
| AGENT SWARM | Specialist decomposition, bounded parallel work and structured results | Read-only specialists, max 3 workers and max 5 subtasks per plan |
| MULTI-GPT NETWORK | Provider abstraction and role-based model choice | OpenRouter role routing is in main; direct provider credentials and authenticated smoke tests remain unverified |
| RAG EVIDENCE GATE | Validate and rank supplied retrieval candidates before generation | Partial; optional /api/agent evidence input, max 12 candidates and 6 selected sources; not yet a vector retriever |
| AUTONOMOUS FACTORY | Propose changes, run tests, package artifacts and open PRs | GitHub branch/PR workflow and CI; production source mutation and deployment remain human-controlled |
| SELF-HEALING | Health, self-test, audit, maintenance proposals and readiness reporting | Partial; repair/deploy/rollback remain human-controlled |
| MEMORY CORE | Conversation/application memory and user profile persistence | File-backed memory plus a versioned digital-twin profile; not a distributed agent memory bus |
| DEVICE MESH | Owner-enrolled private compute nodes | Blocked pending supported OS, device-owner sign-in, least-privilege tailnet rules and authenticated read-only checks |
| OBSERVABILITY | Status, health, audit, artifacts and workflow evidence | /health, /api/self-test, /api/audit, /api/maintenance, /api/evolve, Actions logs and artifacts |
| WEALTH ENGINE | Business analysis and revenue experiments | No verified financial execution, automated trading, customer revenue or payment integration in this repository |
| SYSTEM ARCHIVE | YouTube research, content planning and publishing operations | Separate content-operation domain until its data sources and publishing permissions are explicitly integrated |

## Application runtime

The KaricimGPT application is the service layer that LEGION should orchestrate rather than replace.

- **Frontend and server:** \`index.html\`, \`app.js\`, \`server.js\`.
- **AI routes:** \`/api/chat\`, \`/api/agent\`, \`/api/grok\`, \`/api/claude\`, \`/api/gemini\`, \`/api/council\`.
- **Agent bridge:** authenticated \`POST /api/bridge\` with HMAC request signing and bounded message inputs.
- **Memory:** file-backed memory and a versioned digital-twin profile.
- **Operations:** self-test, audit, proposals, Evolve and maintenance endpoints.
- **RAG:** optional retrieval candidates pass through \`lib/evidence-gate.js\` before being added to the agent system context.

A provider route existing in source does not establish a live provider connection. Each provider needs its own server-side key, approved host configuration, authenticated smoke test and spend limits.

## Governance and execution boundaries

- Issue title/body, comments, model outputs, retrieved source text and artifacts are untrusted data.
- The issue-triggered planner accepts only \`[LEGION]\` issues authored by repository owners, members or collaborators. Public contributors cannot trigger the provider-backed run.
- Manual workflow dispatch is governed by GitHub's Actions permissions.
- The planner emits structured plans; workers return bounded analysis. Worker output is never executed as code.
- Initial worker concurrency is capped at three and each plan is capped at five subtasks.
- The queue workflow has \`contents: none\`; its issue-write permission is used for queue status comments.
- Provider credentials remain in GitHub Actions Secrets or a hosting secret manager. They never belong in issues, source files or artifacts.
- Merges, production deployments, rollback, purchases, payments, external messages, account/security changes and access to sensitive data require human approval.

## Deployment and connected-app status

- **GitHub:** repository metadata and branch/PR writes are available to the connected account.
- **Vercel:** the GitHub integration has reported Ready Preview deployments for recent changes. Production deployment and provider connectivity are not established by a preview result.
- **CodeWords:** a fresh service inventory and runtime validation could not be completed because the connected account returned a free-credit exhaustion response.
- **AppDeploy:** existing LEGION apps are deployed, but the connected account reports expired deployment access; no new deployment was attempted.
- **Private devices:** no self-hosted worker runner is registered. Device-owner sign-in, supported OS upgrades and least-privilege network rules are required before enrollment.
- **Production providers:** API routes and model-routing configuration are source-level capabilities. Live credentials, budget limits and authenticated provider tests remain separate deployment gates.

## Verification gates

1. Run the main-branch CI and focused RAG evidence tests on each code change.
2. Configure provider credentials and per-role model variables in the secret/configuration store; never store them in Git.
3. Set provider budgets, rate limits and concurrency controls before enabling additional model calls.
4. Configure and review \`EVIDENCE_TRUSTED_DOMAINS\`; otherwise candidate sources remain provisional.
5. Verify each provider with an authenticated, non-sensitive smoke test.
6. Reconcile deployment access and project ownership, then verify preview and production separately.
7. Complete device-owner sign-in, supported OS upgrades, least-privilege tailnet rules and read-only health checks before enrolling any private node.
8. Connect business and System Archive workflows only through explicit data contracts, access scopes and measurable acceptance tests.

## Source documents

- [MASTER BRAIN queue and routing](MASTER_BRAIN.md)
- [LEGION AI command center](LEGION_AI.md)
- [LEGION Runtime v3](LEGION_RUNTIME_V3.md)
- [RAG Evidence Gate](RAG_EVIDENCE_GATE.md)
- [Agent Bridge contract](AGENT_BRIDGE.md)
- [GitHub control plane and private node operations](LEGION-GITHUB-NODE-OPERATIONS.md)
- [Application architecture](ARCHITECTURE.md)
- [Digital Twin Core](DIGITAL_TWIN.md)
