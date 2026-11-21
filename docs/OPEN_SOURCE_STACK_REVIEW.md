# LEGION Open-Source Stack Review

**Review date:** 21 November 2026  
**Scope:** Five high-confidence candidates inferred from the publicly visible @hfnhq Instagram carousel. This is not a reconstruction of the promised ten-item PDF: the public carousel did not expose all repository names, so unverified identities are deliberately excluded.  
**Repository:** `sahincelil/karicim-gpt`  
**Decision:** Document and stage candidates; do not deploy or connect production credentials as part of this review.

## Executive decision

Do not install all five projects as one local stack. They solve different problems, duplicate parts of the existing KaricimGPT/LEGION platform, and have materially different operating requirements.

Recommended order for a future, separately approved pilot:

1. **Twenty** — best direct business-operations fit if a real customer pipeline is validated.
2. **Documenso** — useful for document workflow after signing, email, storage, and jurisdictional requirements are confirmed.
3. **AppFlowy** — optional team knowledge workspace; avoid duplicating the existing LEGION memory/digital-twin layer without a clear data contract.
4. **Immich** — optional media archive, not a LEGION control-plane dependency.
5. **Stalwart** — defer. Running an internet-facing mail server is mainly a networking and deliverability project, not just a Docker install.

Use the existing Node.js application as the orchestration/control plane. Treat each external project as an independently deployed service connected through narrow, authenticated adapters. The user's desktop should remain a control surface, not the host for the complete stack.

## Candidate register

| Candidate | Category fit | Repository signal observed 21 Nov 2026 | License signal | Fit for LEGION |
|---|---|---|---|---|
| [Twenty](https://github.com/twentyhq/twenty) | Open-source CRM | Active; latest inspected commit 21 Nov 2026, `80f03c8` | Mostly AGPL-3.0; repository notes MIT-licensed packages and commercially licensed enterprise-marked files | **P1 — pilot candidate** |
| [Documenso](https://github.com/documenso/documenso) | Electronic document signing | Active; latest inspected commit 20 Nov 2026, `80550e7` | Community edition AGPL-3.0; Enterprise edition commercial | **P2 — pilot after requirements check** |
| [AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) | Notion-like workspace | Latest inspected commit 28 Oct 2026, `8fcee27` | AGPL-3.0 badge and root license | **P3 — optional workspace** |
| [Immich](https://github.com/immich-app/immich) | Self-hosted photos and video | Active; latest inspected commit 20 Nov 2026, `9b3d3d8` | AGPL-3.0 | **P4 — separate media service** |
| [Stalwart](https://github.com/stalwartlabs/stalwart) | Mail and collaboration server | Active; latest inspected release commit 16 Nov 2026, `3adead9` (v1.1.1) | README shows AGPL-3.0; verify release-specific terms before use | **P5 — defer** |

Repository activity and license labels above are discovery signals, not a security audit or legal opinion. Recheck the exact tag, dependency tree, license notices, and advisories before pinning a production version.

## Deployment and operational constraints

### Twenty — CRM

- Official self-hosting documentation states at least **2 GB RAM**, with Docker and Docker Compose.
- Generate and protect the `ENCRYPTION_KEY`; the vendor warns that losing it can make stored OAuth tokens, application variables, and TOTP secrets inaccessible.
- The repository is mostly AGPL-3.0 but explicitly identifies MIT packages and files marked for commercial licensing. Review the actual files and packages used by any fork, hosted service, or proprietary integration.
- LEGION integration proposal: store business leads and customer lifecycle records in Twenty; keep model orchestration and internal system state in KaricimGPT. Do not copy sensitive health, patient, or workplace records into a general CRM.

Sources:
- https://github.com/twentyhq/twenty
- https://github.com/twentyhq/twenty/blob/main/LICENSE
- https://github.com/twentyhq/twenty/blob/main/packages/twenty-docs/developers/self-host/capabilities/docker-compose.mdx

### Documenso — document signing

- Current self-hosting requirements list PostgreSQL 14+, an SMTP service, reverse proxy/TLS, and a `.p12` signing certificate.
- The app may start without a signing certificate, but document signing will fail until one is configured.
- Published hardware guidance: 1 CPU core / 1 GB RAM / 10 GB storage for testing; 2+ CPU cores / 2+ GB RAM / 20+ GB storage recommended for production.
- The official docs warn that outbound-request checks for webhooks are not a complete SSRF mitigation and fail open. Production deployment therefore needs outbound network restrictions and an explicit egress policy.
- LEGION integration proposal: use only for a user-approved document workflow. Add an approval step before sending a signature request; record document ID, signer status, timestamps, and a stable audit reference. Do not treat a self-hosted signature workflow as proof of jurisdiction-specific legal compliance.

Sources:
- https://docs.documenso.com/docs/self-hosting/getting-started/requirements
- https://docs.documenso.com/docs/policies/licenses
- https://docs.documenso.com/docs/self-hosting

### AppFlowy — knowledge workspace

- AppFlowy describes itself as an open-source Notion alternative and an AI workspace.
- Its Cloud self-hosting architecture is a multi-service Docker deployment. The docs identify GoTrue authentication, AppFlowy Cloud HTTP/WebSocket services, PostgreSQL, MinIO, and administration interfaces.
- That creates a separate identity, database, object-storage, and backup surface. This may be worthwhile for a shared human team workspace, but is not a replacement for LEGION's existing runtime memory or versioned digital-twin API.
- LEGION integration proposal: defer until there is a specific need for a staff-facing wiki or task workspace. Use a dedicated service account and a one-way, selected-document sync rather than syncing all conversation or profile data.

Sources:
- https://github.com/AppFlowy-IO/AppFlowy
- https://github.com/AppFlowy-IO/AppFlowy/blob/main/LICENSE
- https://docs.appflowy.io/docs/documentation/appflowy-cloud/deployment

### Immich — photo and video archive

- The current official requirements specify **6 GB RAM minimum and 8 GB recommended**, and 2 CPU cores minimum / 4 recommended.
- For a 4 GB host, the docs say it can be run with machine-learning features disabled. PostgreSQL needs a stable local SSD; its database should not be placed on a network share. Thumbnails and transcoded video can add roughly 10–20% to library storage.
- Immich's README warns users to keep a 3-2-1 backup strategy and not to treat the application as the only copy of important media.
- LEGION integration proposal: keep this out of the command core. Consider it only as an independent media/archive service with a tested backup and restore process.

Sources:
- https://docs.immich.app/install/requirements/
- https://github.com/immich-app/immich
- https://github.com/immich-app/immich/blob/main/LICENSE

### Stalwart — mail server

- Stalwart supports SMTP, IMAP, JMAP, CalDAV, CardDAV, and WebDAV.
- Production mail delivery depends on a domain, static public IP, matching reverse-DNS/PTR, DNS control, and port 25 open in both directions. Many residential and cloud providers block port 25 by default.
- The current memory guidance says the default configured limits can total about 2.4 GiB on a 2 GiB host; small deployments need explicit tuning.
- LEGION integration proposal: do not replace managed email or an already functioning email connector with a new mail server yet. First prove DNS, PTR, port 25, abuse handling, spam controls, backups, and deliverability from the intended hosting provider.

Sources:
- https://www.stalwart.email/docs/install/requirements/
- https://www.stalwart.email/docs/performance/memory/
- https://github.com/stalwartlabs/stalwart

## Proposed LEGION integration architecture

```text
KaricimGPT / LEGION control plane
  ├─ existing MASTER BRAIN + guarded task queue
  ├─ existing audit / self-test / maintenance endpoints
  └─ integration adapter layer (proposed)
       ├─ Twenty adapter       [CRM records, customer status]
       ├─ Documenso adapter    [approved document workflows]
       ├─ AppFlowy adapter     [selected team knowledge, optional]
       ├─ Immich adapter       [media metadata, optional]
       └─ Stalwart adapter     [mail protocols, deferred]
```

Adapter contract for any later implementation:

- Configure base URL, credential reference, timeout, and allowed endpoints in server-side environment/configuration only.
- Never put tokens, signing certificates, SMTP passwords, or encryption keys in Git, issues, browser code, logs, or model prompts.
- Use least-privilege service identities, scoped API tokens, request-size limits, rate limits, and explicit outbound host allowlists.
- Verify webhook signatures where supported; reject replayed events with idempotency keys.
- Keep service data in its own database/storage. Only pass the minimum fields needed to LEGION.
- Add a health check and a non-destructive authenticated smoke test for every adapter.
- Default all write actions to disabled until a separate approval gate is added and tested.
- Keep backup, restore, upgrade, and incident runbooks independent for each service.

## Release gates

No service is considered integrated or production-ready until all applicable checks pass:

1. Exact release tag and commit are pinned; dependency and license review is complete.
2. A deployment target with measured CPU/RAM/storage capacity is identified.
3. Secrets are provisioned in the target's secret manager, not in the repository.
4. Network exposure, TLS, DNS, webhook ingress, and outbound egress are reviewed.
5. Backups are created and a restore test is recorded.
6. Health, authentication, permissions, and API smoke tests pass.
7. LEGION adapter tests cover timeouts, malformed payloads, duplicate events, denied permissions, and provider outages.
8. A human approves production enablement and any external write action.

## Current status

- This review is documentation only.
- No container has been deployed.
- No external service has been connected to production.
- No user or customer records have been copied.
- No credentials or API keys have been added to Git.
- The ten-item PDF list remains unverified; this review must be reconciled if the original PDF becomes available.

## Review sources

All official documentation and GitHub repositories linked above were accessed on 21 November 2026. Recheck moving requirements and licensing before a production rollout.
