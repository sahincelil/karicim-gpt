# LEGION IDENTITY SHIELD — Implementation Roadmap

## Scope
A coordinated defensive product with four workstreams:
1. FAMILY SHIELD — anti-impersonation response and family readiness.
2. OSINT GUARD — consent-based audit of the owner's public digital footprint.
3. CYBER DEFENSE — extend the existing LEGION CYBER SHIELD SOC scaffold.
4. SYSTEM ARCHIVE — evidence-led educational content.

## Current delivery status
| Workstream | Status | Evidence |
|---|---|---|
| FAMILY SHIELD | MVP implemented, review required | `family-shield/index.html`, `docs/FAMILY_SHIELD_MVP.md` |
| OSINT GUARD | Specification and manual workflow planned | `docs/OSINT_GUARD.md` |
| CYBER DEFENSE | Existing parser/dashboard scaffold | `docs/CYBER_SHIELD_MVP.md` |
| SYSTEM ARCHIVE | Six-episode content package planned | `docs/SYSTEM_ARCHIVE_IDENTITY_SERIES.md` |

## Delivery order
1. Ship and review FAMILY SHIELD local-only education MVP.
2. Add OSINT GUARD as a consent-based, manual-first self-audit. Do not collect credentials, bypass access controls, or build dossiers on third parties.
3. Harden CYBER DEFENSE using synthetic fixtures and read-only adapters. No live customer network connections or automated response without separate owner authorization.
4. Produce SYSTEM ARCHIVE scripts and editing packages. Publishing remains a separate human action.
5. Integrate only after privacy, access control, retention, threat model, and test evidence are reviewed.

## Platform status known at implementation start
- GitHub repository: `sahincelil/karicim-gpt`.
- Existing CYBER SHIELD draft PR: #63.
- Existing Vercel preview has previously reported Ready; production status is not inferred from preview status.
- Supabase project `legion-core-memory` was reported INACTIVE at inspection time. No database operations should be attempted until its status and intended use are confirmed.
- Existing daily and weekly SYSTEM ARCHIVE automations remain separate from this code change.

## Release gates
- CI and policy checks pass.
- Human review before merge.
- Separate human approval before production deployment.
- No secrets in Git; no PII in synthetic test fixtures.
- Read-only integrations first; incident response actions remain human-approved.
