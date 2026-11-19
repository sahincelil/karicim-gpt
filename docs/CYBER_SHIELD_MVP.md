# LEGION CYBER SHIELD — MVP 0.1

## Status
A static, browser-only demonstration backed by synthetic fixtures. It is not connected to a SIEM, EDR, network, identity provider, or customer environment.

Open `../cyber-shield/index.html` locally or serve the repository root with any static file server.

## Included views
- Overview metrics and severity distribution
- Synthetic asset inventory
- Detection queue with severity filters
- Incident timeline
- MITRE ATT&CK technique reference mapping
- Demo audit trail

## Event contract
The normalized event shape for future read-only adapters:

| Field | Type | Meaning |
|---|---|---|
| id | string | Stable source or normalized event identifier |
| timestamp | ISO-8601 string | Event time in UTC |
| severity | enum | critical, high, medium, low, informational |
| title | string | Short human-readable summary |
| asset_id | string | Pseudonymous inventory key |
| asset_name | string | Display name |
| source | string | EDR, IDS, IAM, SIEM or OpenTelemetry adapter name |
| description | string | Sanitized event summary |
| technique_id | string/null | MITRE ATT&CK reference, not a verdict |
| tactic | string/null | ATT&CK tactic reference |
| status | enum | open, triage, closed |
| evidence_ref | string/null | Opaque pointer to evidence stored in the source system |

## Planned read-only adapters
- Wazuh alerts
- Suricata EVE JSON
- OpenTelemetry logs
- Later evaluation: Microsoft Sentinel, Splunk, Elastic, MISP and TheHive

These are integration candidates only. No adapter is implemented or authenticated in this MVP.

## Security boundaries
- Synthetic data only.
- No live network scanning, exploitation, credential collection, or endpoint commands.
- No automated blocking, isolation, remediation, or ticket dispatch.
- No secrets or production customer data in the repository.
- Any future connector must be read-only, least-privilege, explicitly configured by the system owner, and tested with non-sensitive data.
- Human review is required before incident response actions or production deployment.

## Acceptance checklist
- [x] Static demo UI with six views
- [x] Synthetic asset, event, timeline, ATT&CK and audit fixtures
- [x] Severity filtering
- [x] No external runtime dependencies
- [ ] Automated browser-level accessibility and rendering test
- [ ] Authenticated read-only adapter smoke test (requires a separately authorized environment)
