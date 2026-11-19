# LEGION CYBER SHIELD — MVP 0.2

## Status
The repository now contains a browser-based SOC demo, source-specific event parsers, deterministic correlation, and an authenticated in-memory ingest API. This is an integration scaffold, not a live-connected customer SOC.

Open `../cyber-shield/index.html` through the KaricimGPT server at `/cyber-shield/index.html` after the static route is enabled, or serve the file from a local static web server. The API routes are registered in `server.js`.

## Included SOC views
- Overview metrics and severity distribution
- Synthetic asset inventory
- Detection queue with severity filters
- Incident timeline
- MITRE ATT&CK technique references
- Event correlation view
- Demo audit trail and connector readiness status

## Implemented read-only adapter parsers
- Wazuh alert JSON
- Suricata EVE JSON alert events
- Microsoft Sentinel-style alert/common event records

These parsers normalize caller-supplied records. They do not poll vendor APIs, receive webhooks, or maintain credentials to those services.

## API

### Status
`GET /api/cyber-shield`

Returns parser readiness, whether ingestion is enabled, and explicitly reports live vendor connections as disabled.

### Authenticated in-memory ingest
`POST /api/cyber-shield/ingest`

Set a long random `CYBER_SHIELD_INGEST_TOKEN` in the server environment. The API is disabled until this value exists. Supply it as a Bearer token.

Example Wazuh payload:

```json
{
  "source": "wazuh",
  "correlationWindowMinutes": 10,
  "events": [
    {
      "id": "wazuh-alert-123",
      "timestamp": "2026-11-19T10:00:00Z",
      "rule": {
        "level": 12,
        "description": "Repeated authentication failures",
        "mitre": { "id": ["T1110"], "tactic": ["Credential Access"] }
      },
      "agent": { "id": "007", "name": "host-7" },
      "data": { "srcip": "192.0.2.10" }
    }
  ]
}
```

Example request:

```sh
curl -X POST http://localhost:3000/api/cyber-shield/ingest \
  -H "Authorization: Bearer $CYBER_SHIELD_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  --data @wazuh-sample.json
```

Allowed `source` values: `wazuh`, `suricata`, `sentinel`. A request accepts 1-500 records. The response includes normalized events and deterministic correlation groups. Data is processed in memory for the request only, not persisted, queued, forwarded, or acted upon.

## Normalized event contract

| Field | Type | Meaning |
|---|---|---|
| id | string | Stable source or normalized event identifier |
| timestamp | ISO-8601 string | Event time in UTC |
| severity | enum | critical, high, medium, low, informational |
| title | string | Short human-readable summary |
| asset_id | string | Pseudonymous inventory key |
| asset_name | string | Display name |
| source | string | wazuh, suricata, microsoft-sentinel |
| description | string | Sanitized event summary |
| technique_id | string/null | MITRE ATT&CK reference, not a verdict |
| tactic | string/null | ATT&CK tactic reference |
| source_ip | string/null | Source IP when supplied by event |
| destination_ip | string/null | Destination IP when supplied by event |
| evidence_ref | string/null | Opaque source evidence reference |
| status | enum | open, triage, closed |

## Correlation logic
Events are grouped by source IP, falling back to asset identifier, and clustered when consecutive events fall within the selected time window (1-60 minutes). The result reports count, time bounds, event IDs, and highest severity. Correlation is a triage hint, not proof of compromise.

## Planned live integrations
- Wazuh API read-only polling
- Suricata EVE file/stream ingestion
- Microsoft Sentinel Log Analytics read-only query integration
- Later evaluation: Splunk, Elastic, MISP and TheHive

Live integrations require owner-provided endpoints, least-privilege read-only credentials, approved network paths, secret storage, and integration smoke tests. None are configured by this pull request.

## Security boundaries
- No live network scanning, exploitation, credential collection, or endpoint commands.
- No automated blocking, isolation, remediation, or ticket dispatch.
- No secrets or production customer data in the repository.
- Ingest token is server-side only; never put it in frontend code or Git.
- Ingest endpoint is disabled by default and requires Bearer authentication.
- Request size is bounded by the server; batch size is capped at 500 events.
- No event persistence or onward transmission in this MVP.
- Human review is required before incident response actions or production deployment.

## Acceptance checklist
- [x] SOC dashboard and correlation view
- [x] Wazuh, Suricata and Sentinel-style parsers
- [x] Common event normalization and severity mapping
- [x] Correlation engine and unit tests
- [x] Authenticated, opt-in, in-memory ingest endpoint
- [x] CI checks for parser and correlation tests
- [ ] Browser-level accessibility and rendering test
- [ ] Vendor-specific authenticated read-only smoke tests
- [ ] Persistent storage with retention and tenant isolation design
- [ ] Production security review and deployment
