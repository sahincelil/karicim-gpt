# LEGION AI Company Blueprint

**Canonical repository:** `sahincelil/karicim-gpt`  
**Status:** Architecture and delivery blueprint; implementation is staged and evidence-gated.  
**Operating principle:** Build a useful, measurable AI product before expanding the platform.

## Product thesis

LEGION is a coordinated AI work platform for small teams. It turns a user goal into a bounded plan, delegates research and drafting to specialist workers, assembles evidence-backed deliverables, runs quality checks, and leaves consequential actions under human approval.

LEGION is not represented as conscious, self-owning, or independently authorized to spend money, contact people, change accounts, or deploy production code.

## Product surfaces

1. **LEGION Workbench** — project intake, task board, run history, approvals, and deliverables.
2. **LEGION Brain** — task decomposition, provider/model routing, budgets, and synthesis.
3. **LEGION Workers** — bounded research, writing, coding, QA, and analytics specialists.
4. **LEGION Memory** — project-scoped decisions, user-approved preferences, source references, and retention controls.
5. **LEGION Forge** — code proposals, isolated tests, review branches, and pull requests.
6. **LEGION Sentinel** — authentication, policy checks, audit events, dependency and runtime health.
7. **LEGION Factory** — reusable workflows and customer-specific templates.
8. **LEGION Market** — plans, usage metering, customer onboarding, and billing integration, only after legal and payment-provider readiness.

## Reference architecture

```text
Web / API clients
      |
      v
Auth + tenant / project boundary
      |
      v
Orchestrator (Brain)
  |-- policy + approval gate
  |-- budget / rate-limit manager
  |-- durable task state
  |
  +--> Research worker
  +--> Writing worker
  +--> Coding worker
  +--> QA / Sentinel worker
      |
      v
Evidence + artifact store
      |
      v
Human review / approved integrations
      |
      v
Usage metering + product analytics
```

The existing KaricimGPT runtime, GitHub control plane, model routes, agent bridge, memory, audit, and maintenance endpoints are the starting substrate. Existing endpoints are not proof of multi-tenant SaaS readiness.

## Non-negotiable engineering rules

- Tenant and project authorization is checked server-side on every read and write.
- Secrets stay in hosting secret stores; never in browser bundles, Git, issues, logs, or artifacts.
- Every model call has a provider allowlist, timeout, bounded input/output, retry policy, and configurable spend ceiling.
- Treat prompts, retrieved documents, tool results, and model output as untrusted data.
- Workers return typed proposals and artifacts. They do not execute arbitrary shell commands or mutate production infrastructure.
- External messages, purchases, payments, account changes, production deploys, and destructive actions require explicit human approval.
- Keep an audit record of actor, tenant, project, action, approval, timestamp, and outcome, without logging secrets or unnecessary personal data.
- Provide project-level data export and deletion workflows before onboarding external customers.
- Do not place patient, workplace-confidential, or other sensitive personal data into demonstrations or test fixtures.

## First customer wedge

Start with one narrow offer: **AI operations assistant for small businesses**.

Initial workflow:
1. Ingest customer-approved FAQ and business documents.
2. Answer internal staff questions with source references.
3. Draft customer replies for human review.
4. Turn recurring questions into a proposed FAQ update.
5. Report unanswered questions and content gaps.

Do not launch broad autonomous execution first. The initial value proposition is faster, more consistent staff responses with a clear approval trail.

## Delivery stages and exit criteria

### Stage 0 — Foundation and inventory
- Preserve the existing application and its passing test suite.
- Confirm current branch, CI, runtime, provider configuration, and deployment ownership.
- Record every integration as one of: verified live, configured but untested, catalog-only, or blocked.
- Exit: a reproducible baseline and no unsupported production claims.

### Stage 1 — Single-tenant workbench pilot
- Add a project/task/run data model and a minimal workbench.
- Show task state, worker outputs, citations, costs, and approvals.
- Keep existing auth and persistence constraints explicit.
- Exit: end-to-end demo workflow passes automated tests and manual acceptance.

### Stage 2 — Bounded specialist workers
- Introduce typed worker contracts for research, writing, coding, and QA.
- Add per-run token/cost ceilings, timeout, cancellation, and idempotency.
- Require evidence references for factual research outputs.
- Exit: failure, retry, budget, and prompt-injection tests pass.

### Stage 3 — Tenant isolation and durable operations
- Implement tenant-scoped authorization, durable queue, database migrations, and retention policy.
- Add audit export, data deletion, rate limits, and operational alerts.
- Exit: cross-tenant access tests pass; backup/restore and deletion are verified.

### Stage 4 — Private beta and validation
- Recruit a small number of consenting pilot businesses.
- Use synthetic or customer-approved non-sensitive data.
- Measure task completion, time saved, answer acceptance, cost per completed task, and weekly active use.
- Exit: repeated usage and willingness-to-pay evidence, not vanity signups.

### Stage 5 — Commercial readiness
- Confirm legal eligibility, terms, privacy notice, support process, processor/subprocessor disclosures, and payment-provider setup.
- Add subscription plans and usage metering only after reconciliation tests.
- Exit: billing, cancellation, refunds, data export/deletion, and incident response are tested.

## Initial success metrics

| Metric | Pilot target |
|---|---:|
| End-to-end task completion | >= 90% on agreed test set |
| Source-backed factual answers | >= 95% on agreed test set |
| Human approval visibility | 100% of external actions |
| Cross-tenant authorization tests | 100% pass |
| Budget ceiling enforcement | 100% of test cases |
| Weekly pilot retention | Measure; do not assume |
| Cost per completed workflow | Establish baseline before pricing |

Targets are proposed acceptance criteria, not achieved results.

## Immediate next engineering tasks

1. Inspect current application routes and persistence before selecting schema changes.
2. Define typed task, run, worker-result, artifact, approval, and audit contracts.
3. Add deterministic tests for authorization, budgets, idempotency, cancellation, and untrusted worker output.
4. Implement the smallest single-tenant workbench vertical slice.
5. Run the full existing `npm test` suite and the new integration tests.
6. Open a reviewed PR; do not merge or deploy until CI and human review pass.
7. Verify preview and production independently; a Ready preview is not production proof.

## Current known constraints

- CodeWords service operations were blocked by account free-credit exhaustion at the last attempt.
- The connected Vercel team was visible, but its deployment context returned no linked projects.
- Prior repository notes report preview readiness at certain points, but production deployment and live provider credentials are not established by those notes.
- Customer outreach and revenue are not evidenced.
- Paid commercial activity requires a separate legal and employment eligibility review before launch.

## Decision rule

Prefer one working customer workflow over ten unfinished modules. Expand only when a measured user problem, passing tests, operational evidence, and an accountable approval path justify it.
