# LEGION OSINT Intelligence

**Status:** Partial / backend MVP proposed  
**Mode:** Passive, authorized domain reconnaissance only

## What the source reel points to

The Instagram reel is titled “Hackler nası bilgi toplar”. The linked discussion points viewers to two directories:

- [OSINT Framework](https://osintframework.com/) is a browsable index of free OSINT resources. It explicitly describes itself as a framework for finding tools and resources, not as a single collection engine.
- [OSINTPanel](https://www.osintpanel.com/) is a third-party directory that says it reviews 60+ tools across identity, domain, breach, metadata, infrastructure, investigation-framework, and archive categories. Its tool notes are useful for discovery, but its claims and each upstream tool still need independent verification.

Neither directory should be treated as a trusted executable dependency. LEGION should maintain its own curated, source-cited connector registry.

## Design decision

The first implementation is deliberately narrower than a general-purpose people-search toolkit. It audits domains that the operator has explicitly placed in the server-side allowlist.

### MVP data sources

| Source | Use | Interaction |
|---|---|---|
| [crt.sh](https://crt.sh/) | Public certificate-transparency names for a domain and its subdomains | Passive lookup |
| [Internet Archive CDX](https://web.archive.org/cdx/search/cdx) | Historical host coverage and snapshot date ranges | Passive lookup |

### Explicitly out of scope for v1

- Personal profiling, account enumeration, stalking, or doxxing workflows.
- Credential collection, password reset probing, or breach-dump retrieval.
- Port scanning, service probing, DNS brute force, exploitation, or login attempts.
- Scraping content behind authentication or bypassing platform restrictions.

These exclusions keep the first release useful for an organization's external attack-surface inventory without turning a tool directory into an unrestricted targeting console.

## API contract

### GET /api/osint

Returns module availability and the configured source names. It does not reveal the allowlisted domains or secret values.

### POST /api/osint

Headers:

- Authorization: Bearer <OSINT_ADMIN_TOKEN>
- Content-Type: application/json

Body:

    { "targetDomain": "example.com" }

The target must exactly match a domain in OSINT_ALLOWED_DOMAINS or be a subdomain of one of those entries.

Server-side environment:

    OSINT_ADMIN_TOKEN=<long-random-secret>
    OSINT_ALLOWED_DOMAINS=example.com,example.org

No secrets belong in the frontend bundle, Git commits, Issues, or logs.

The response contains certificate-transparency subdomains, archive coverage aggregated by host, source URLs, collection time, and explicit caveats. Raw archive paths and query strings are not returned.

## Runtime and safeguards

- Server-side only; no browser-side API secrets.
- Exact allowlist / subdomain boundary check before external requests.
- Constant-time bearer-token comparison.
- Existing shared rate limiter and standard security headers.
- Fixed upstream hosts; caller input cannot select a URL or create an SSRF target.
- Nine-second upstream timeout and bounded response/body sizes.
- Partial results are surfaced when one source is unavailable.
- Findings are leads, not verified vulnerabilities. No active scanning is performed.

## Investigation workflow

1. Record the domain owner, business purpose, and approved scope.
2. Run the passive certificate and archive lookups.
3. Normalize and deduplicate hostnames.
4. Verify important findings against at least one independent source and the owner's asset inventory.
5. Record source URL, collection timestamp, analyst decision, and confidence.
6. Escalate to active testing only in a separate, explicitly approved assessment.

## Next increments

1. Add RDAP and DNS record lookups as separately tested passive connectors.
2. Add evidence records with source URL, first-seen/last-seen, confidence, and SHA-256 for retained evidence files.
3. Add an analyst-reviewed asset graph and CSV/JSON export.
4. Add scheduled change detection for allowlisted domains.
5. Add enterprise tenancy, audit log retention, and role-based authorization before customer deployment.

## Verification status

The code and unit tests are submitted in the feature/legion-osint-passive-domain branch for CI review. This documentation does not claim that the module is deployed or that live upstream lookups have been run against a customer domain.
