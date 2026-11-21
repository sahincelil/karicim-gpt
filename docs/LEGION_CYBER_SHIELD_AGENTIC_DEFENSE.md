# LEGION CYBER SHIELD — Agentic Threat Defense Blueprint

**Status:** Design proposal (not implemented or deployed)  
**Prepared:** 21 November 2026  
**Repository:** `sahincelil/karicim-gpt`  
**Decision:** Build a defensive patch-window and behavior-detection module. Do not replicate or deploy offensive exploit automation.

## 1. Why this module exists

Google Threat Intelligence Group (GTIG) reported on 16 November 2026 that it found an exposed staging server hosting a multi-agent framework called `exploit_agent`. According to GTIG, the framework compared software before and after patches, identified candidate vulnerabilities, drafted exploits, and automatically executed them. GTIG also reported post-compromise scripts and data exfiltration artifacts on that server. This is a threat-intelligence finding reported by Google; this repository does not independently reproduce or validate the operator's activity.

Google's October 2026 maturity model identifies Stage 5 as the current observed phase: LLM tooling is handling multiple attack-life-cycle stages in real intrusions with less human involvement. Stages 6 and 7 are forecasts, not established facts. GTIG explicitly notes that current public frameworks can trade stealth for speed and leave detectable forensic traces.

**Product implication:** reduce the time between a relevant patch or threat disclosure and a customer's verified remediation; detect suspicious identity and control-plane behavior before a single compromised credential becomes an enterprise-wide incident.

## 2. Product objective

LEGION CYBER SHIELD should answer five operational questions:

1. Which of our customer's assets are affected by a newly disclosed or actively exploited vulnerability?
2. Which exposed, business-critical assets have a patch available but not yet verified as installed?
3. What compensating control should be applied while patching is pending?
4. Which identity, API, cloud-control-plane, or data-access events suggest automated attack progression?
5. Can the customer prove when a finding was detected, prioritized, approved, remediated, and verified?

### MVP success criteria

- Import an authorized asset inventory and software/version snapshot.
- Correlate assets with vulnerability advisories and known-exploited-vulnerability sources.
- Rank findings using exploitation evidence, exposure, asset criticality, exploitability, and patch age.
- Generate a human-reviewable remediation plan with source links and evidence.
- Track the patch lifecycle from advisory publication through verified installation.
- Produce an audit-ready incident and remediation report.
- Operate read-only by default; no exploit execution or unapproved production changes.

## 3. Threat-intelligence basis

Primary source material:

- Google GTIG, [AI Threat Tracker: Agentic Threat Activity Crosses a Significant Threshold](https://cloud.google.com/blog/topics/threat-intelligence/agentic-threat-activity-crosses-a-significant-threshold), 16 November 2026. Describes `exploit_agent`, patch-differential analysis, automated exploit execution, and the narrowing patch window.
- Google GTIG / Mandiant, [ARTEX and Friends: Enter Agentic Offensive Frameworks](https://cloud.google.com/blog/topics/threat-intelligence/artex-and-friends-enter-agentic-offensive-frameworks), 30 October 2026. Defines the seven-stage maturity model and five defensive layers: protect control planes, restrict identities and keys, harden configurations and reduce attack paths, protect applications, and detect behavioral/volumetric change.
- Google GTIG, [Vulnerability Discovery and Exploitation Trends in the AI Era](https://cloud.google.com/blog/topics/threat-intelligence/vulnerability-discovery-and-exploitation-trends-in-the-ai-era), 30 September 2026. Reports vulnerability disclosure and exploitation trends and recommends threat-intelligence-driven triage.

Interpretation discipline:
- Distinguish vendor-reported observations from independent reproduction.
- Label confirmed exploitation, suspected exploitation, public PoC claims, and unverified reports separately.
- A public proof-of-concept is not proof that a customer's asset is vulnerable.
- Never treat an LLM-generated exploit claim as verified without independent, authorized validation.

## 4. Architecture

```text
Customer-owned assets / cloud / identity / endpoint / source control
                         |
            Read-only connectors and imports
                         |
                         v
             Asset & Identity Inventory
                         |
                         v
       Threat Intelligence and Advisory Ingestion
  CISA KEV | NVD | EPSS | OSV | vendor advisories
                         |
                         v
             Correlation & Risk Engine
                         |
             +-----------+-----------+
             |                       |
             v                       v
      Patch Window Queue       Behavior Signals
  patch available / missing    identity / API / cloud
  exposure / asset criticality control-plane / data
             |                       |
             +-----------+-----------+
                         |
                         v
                LEGION Specialist Agents
   Intel Collector -> Asset Correlator -> Risk Analyst
   -> Remediation Planner -> Evidence / Report Agent
                         |
                         v
                Human Approval Gate
       ticket / patch plan / containment proposal
                         |
                         v
          Approved customer-owned remediation
                         |
                         v
               Post-change verification
                         |
                         v
              Audit trail and KPI dashboard
```

### Components

| Component | Responsibility | MVP mode |
|---|---|---|
| Asset Registry | Customer-authorized inventory, owner, environment, criticality, exposure | CSV import + manually curated sample |
| Advisory Collector | Pull CVEs, vendor bulletins, known-exploited status, package advisories | Scheduled read-only ingestion |
| Asset Correlator | Match package/product/version to affected ranges | Deterministic matching; uncertain matches flagged |
| Risk Engine | Rank remediation urgency and explain each factor | Explainable rules with configurable weights |
| Patch Window Tracker | Record advisory, patch availability, install and verification timestamps | Core MVP workflow |
| Behavior Monitor | Ingest approved SIEM/identity/cloud audit events and surface unusual sequences | Sample logs first; customer connector later |
| Specialist Agents | Summarize evidence, draft plans, explain anomalies | Bounded analysis only |
| Approval & Audit | Record approver, timestamp, ticket, action, result and evidence | Required |
| Dashboard & Reports | Exposure, overdue findings, time-to-patch, incident timeline | Core MVP workflow |

## 5. Specialist-agent roles

Agents are analysis workers, not independent administrators.

- **INTEL-WATCH:** normalize advisories, identify source confidence, and extract affected product/version ranges.
- **ASSET-MATCH:** compare advisory ranges against the customer's approved inventory; return matched, not-matched, or uncertain.
- **RISK-PRIORITIZER:** explain urgency from exploitation evidence, internet exposure, asset criticality, exploitability signals, and time since patch availability.
- **PATCH-PLANNER:** produce vendor-supported remediation steps and temporary mitigations with rollback considerations.
- **BEHAVIOR-ANALYST:** correlate identity, API, endpoint, and cloud audit events for unusual sequences or volume changes.
- **EVIDENCE-AUDITOR:** check that recommendations cite sources, approvals are recorded, and post-change verification exists.

Every agent response must be structured, bounded, source-linked, and marked with uncertainty. Treat advisory text, logs, issue bodies, and model output as untrusted input.

## 6. Risk model and patch-window logic

Use a transparent, configurable score rather than an unexplained model verdict. Candidate factors:

- Exploitation evidence: CISA KEV membership, trusted threat-intelligence observation, or only an unverified PoC claim.
- Exposure: internet-facing, reachable through a sensitive control plane, or internal-only.
- Asset criticality: customer-defined business impact and data sensitivity.
- Exploitability: vendor severity, CVSS, EPSS, affected-version confidence, and prerequisites.
- Patch delay: elapsed time since a vendor fix or mitigation became available, compared with the customer's SLA.

The initial weights must be configured and validated with pilot customers. Display the factor-level explanation beside every score. Missing inventory data must lower confidence, not silently produce a low-risk result.

Track these timestamps per finding:

- `advisory_published_at`
- `patch_available_at`
- `finding_detected_at`
- `remediation_approved_at`
- `patch_applied_at`
- `verification_completed_at`

Core measurements: time-to-detect, time-to-prioritize, time-to-approve, time-to-patch, time-to-verify, overdue critical exposures, and false-positive rate.

## 7. Defensive integrations

### MVP data sources

- CISA Known Exploited Vulnerabilities (KEV) catalog.
- NVD CVE records and CVSS data.
- FIRST EPSS probability feed.
- OSV vulnerability database for supported open-source ecosystems.
- Vendor security advisories and customer-provided SBOM/inventory exports.

### Later enterprise integrations

- SIEM: Microsoft Sentinel, Splunk, Elastic.
- Endpoint: Microsoft Defender, CrowdStrike, Wazuh.
- Cloud: AWS, Azure, Google Cloud audit and asset inventories.
- Source control / CI: GitHub Advanced Security, Dependabot, code scanning.
- Ticketing: Jira, ServiceNow, Linear.
- Threat intelligence: MISP or OpenCTI.

Connector scope must be explicit per tenant. Start with read-only access and minimum required permissions. Do not collect patient data, personal files, or unrelated employee content.

## 8. Trust boundaries and execution policy

The existing KaricimGPT repository describes controlled autonomy: automated observation, reasoning, tests, and proposals, while merge, production deployment, rollback, and destructive operations remain human-controlled. Cyber Shield should inherit that model.

- No automated exploitation, exploit payload generation, persistence, credential harvesting, lateral movement, or webshell behavior.
- No scanning outside assets explicitly enrolled by the customer.
- No production patch, firewall change, account disablement, or key rotation without named human approval.
- No raw secrets, API keys, access tokens, or private data sent to an LLM.
- Use short-lived, narrowly scoped connector credentials stored in a secret manager.
- Separate customer tenants at the database, queue, and connector layers.
- Log every read, recommendation, approval, mutation, and verification.
- Require a second verification step after remediation; an API success response alone is not proof of secure state.
- Use synthetic data for demos until a customer has explicitly authorized a pilot.

## 9. Delivery roadmap

### Phase 0 — Design validation
- Confirm asset types and first customer segment.
- Define the minimum inventory schema and tenant boundary.
- Select one vulnerability-feed bundle and one ticketing destination.
- Agree on severity SLAs and approval roles.

### Phase 1 — Read-only MVP
- Asset CSV/SBOM import.
- KEV/NVD/EPSS/OSV ingestion.
- Product/version correlation and explainable prioritization.
- Patch-window tracker and evidence-linked reports.
- Synthetic-demo dataset and regression tests.

### Phase 2 — Enterprise telemetry
- One SIEM connector and one cloud identity/control-plane connector.
- Event normalization and behavior baselines.
- Correlated incident timeline and evidence export.

### Phase 3 — Approved remediation workflows
- Ticket creation and status synchronization.
- Human-approved patch orchestration through the customer's existing deployment platform.
- Staged rollout, post-change verification, and rollback proposal.
- Production connectors only after a security review and pilot acceptance.

## 10. Acceptance tests

1. A KEV-listed vulnerability matching an internet-facing critical asset is ranked above an unexposed, non-critical, unconfirmed finding.
2. An ambiguous product/version match is flagged as uncertain and never auto-closed.
3. A patch available but not installed remains open until version or approved evidence verifies the fix.
4. A claimed public PoC without reliable confirmation is labelled unverified.
5. A suspicious identity/API sequence creates an explainable alert with source events and timestamps.
6. No model response can directly invoke shell execution, patching, firewall changes, credential rotation, or deployment.
7. A tenant cannot read another tenant's inventory, findings, logs, or reports.
8. Every approval and remediation has an immutable audit record.
9. Missing connector data is reported as a visibility gap.
10. The dashboard clearly distinguishes design, test, pilot, and production states.

## 11. Commercial packaging hypothesis

| Offer | Initial scope | Commercial logic |
|---|---|---|
| Cyber Shield Starter | Asset import, vulnerability prioritization, patch-window report | Entry product for small IT teams |
| Cyber Shield Pro | Scheduled monitoring, multiple inventories, ticket workflow, audit reports | Per-asset or per-endpoint subscription |
| Cyber Shield Enterprise | SIEM/cloud/EDR integrations, RBAC, tenant controls, compliance evidence | Annual contract + implementation |
| Managed Defense Add-on | Human-reviewed triage and remediation coordination | Monthly service fee |

These are packaging hypotheses, not validated prices or revenue forecasts. Validate willingness to pay before committing to a price list.

## 12. Build decision

**Recommended first build:** Patch Window Sentinel — an explainable, read-only vulnerability-to-asset correlation and remediation tracker.

It is the smallest defensible wedge from the Google finding: it addresses the shrinking patch window, produces a measurable customer outcome, fits the current controlled-autonomy architecture, and avoids turning LEGION into an offensive exploitation framework.

**Current status:** proposal only. No code, customer connector, production monitoring, or remediation automation is claimed to exist until implemented and tested.
