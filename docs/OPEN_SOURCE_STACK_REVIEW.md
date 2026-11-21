# LEGION Open-Source Stack Review

**Review date:** 21 November 2026  
**Source:** Instagram carousel by @web_development_legend: https://www.instagram.com/p/Dfm_FsEgAq4/  
**Scope:** All 10 carousel slides checked. The post does not contain a PDF. Nine slides point to identifiable software repositories; the Buddy slide does not resolve to the claimed open-source GitHub repository.  
**Repository:** `sahincelil/karicim-gpt`  
**Decision:** Keep the existing LEGION control plane. Adopt only narrowly useful integrations after a separate deployment and license gate. This review is not a deployment.

## Executive decision

Do not clone or deploy all ten entries. Several are complete products unrelated to the command core, and three have important licensing qualifications that the Instagram caption omits.

**Recommended disposition**

1. **Plausible — evaluate first for public-site analytics.** Useful for the KaricimGPT public website if a verified production domain exists. It does not replace YouTube analytics; retain the existing YouTube/Supermetrics workflow.
2. **Anytype — optional human knowledge vault, not the LEGION memory database.** It is local-first and exposes a local API / agent extension points, but the desktop application is source-available, not OSI open source. Confirm allowed-network and commercial-use terms before business use.
3. **Twenty — optional CRM pilot only after a real lead/customer pipeline exists.** The main project is mostly AGPL-3.0 with commercially licensed enterprise-marked files and MIT packages. If HubSpot is already serving CRM needs, do not create a second CRM.
4. **Documenso — future document-signing workflow.** Useful only when there is a concrete need for signature collection. It needs PostgreSQL, SMTP, TLS/reverse proxy, and a signing certificate; AGPL-3.0 community edition and commercial enterprise edition are distinct.
5. **Papermark — defer.** Document analytics/sharing is not currently a core need. Its repository is mixed-license; official self-hosting guidance says personal self-hosting is for personal/non-commercial use and commercial team use needs a self-hosting license.
6. **Nuxt — do not migrate the current app now.** It is MIT-licensed and capable, but the existing Node.js + static frontend works as a small control plane. A framework migration adds risk without a proven product requirement.
7. **tldraw — prototype only until license is resolved.** Its SDK's default license is development-only; production use requires a valid trial, commercial, or hobby license key.
8. **Immich — separate personal media archive only.** Not a LEGION runtime dependency. Official guidance asks for at least 6 GB RAM (8 GB recommended) and a stable local SSD for PostgreSQL.
9. **Jellyfin — separate media streaming service only.** GPL-2.0 server; useful for a personal media library, not an AI orchestration capability.
10. **Buddy — do not classify as open source or a GitHub repository.** The carousel's `buddy-works/buddy` URL returns 404 in the connected GitHub check. Buddy's official self-hosted license is a paid, limited-term proprietary license. Keep the current GitHub Actions CI unless a specific Buddy feature justifies the cost.

## Ten-slide source register

| Slide | Name shown | Repository / official destination | License / verification | LEGION disposition |
|---:|---|---|---|---|
| 1 | Immich | https://github.com/immich-app/immich | AGPL-3.0; official hardware requirements: 6 GB RAM minimum, 8 GB recommended | Separate media archive; no control-plane integration |
| 2 | Anytype | Canonical repository: https://github.com/anyproto/anytype-ts. The carousel URL `anytype-io/anytype` is not the canonical repo. | Any Source Available License 1.0 for client; protocols such as any-sync / any-block are MIT. Not OSI open source as a whole. | Optional human knowledge vault; license check and local API boundary first |
| 3 | Twenty CRM | https://github.com/twentyhq/twenty | Mostly AGPL-3.0; some MIT packages and commercially licensed enterprise-marked files | CRM pilot only if existing CRM is insufficient |
| 4 | Papermark | https://github.com/papermark/papermark (historical path in carousel: `mfts/papermark`) | AGPLv3 outside enterprise-marked paths; official guidance restricts free self-hosting to personal/non-commercial use, commercial team use needs a self-hosting license | Defer; no current document-analytics requirement |
| 5 | Jellyfin | https://github.com/jellyfin/jellyfin | GPL-2.0 | Personal media service, outside LEGION core |
| 6 | tldraw | https://github.com/tldraw/tldraw | Proprietary tldraw SDK license; development use by default, production requires license key | Prototype only; do not embed in production before licensing |
| 7 | Documenso | https://github.com/documenso/documenso | Community edition AGPL-3.0; Enterprise commercial | Future signature workflow, approval-gated |
| 8 | Nuxt | https://github.com/nuxt/nuxt | MIT | Future frontend option; no migration now |
| 9 | Plausible Analytics | https://github.com/plausible/analytics | Community edition AGPLv3-or-later; JS tracker MIT | First analytics candidate for public website only |
| 10 | Buddy | Claimed URL https://github.com/buddy-works/buddy returns 404; official product: https://buddy.works/ | Proprietary paid self-hosted license, not an open-source repo | Reject as open-source integration; current GitHub Actions remains |

## Architecture decisions

KaricimGPT remains the orchestration and policy control plane. External products must remain separate services with explicit adapters. Do not import their application source code into the core repository merely to claim an integration.

```text
KaricimGPT / LEGION control plane
  ├─ MASTER BRAIN, task queue, audit and maintenance
  ├─ provider and service adapter boundary
  │    ├─ Plausible       [website events and aggregated metrics]
  │    ├─ Twenty          [optional CRM records]
  │    ├─ Documenso       [approved signature requests]
  │    └─ Anytype         [selected knowledge objects, optional]
  └─ GitHub Actions      [existing CI; retain]
  
Separate optional services, not control-plane dependencies:
  ├─ Papermark          [document sharing]
  ├─ Immich             [photo/video archive]
  └─ Jellyfin           [media streaming]
  
Not approved for production integration:
  ├─ tldraw             [license key required]
  ├─ Nuxt               [no migration case]
  └─ Buddy              [claimed repo invalid; proprietary product]
```

### First implementation slice: analytics adapter

Plausible is the best first candidate only if the public KaricimGPT website has a stable production domain and a need for first-party site metrics.

- Start with a narrowly scoped page-view and event integration; do not ingest personal or sensitive user data.
- Keep YouTube channel performance in the existing YouTube/Supermetrics reporting flow.
- Prefer a pinned, documented release and a separate deployment over bundling Plausible into the Node.js application.
- Before enabling a tracker, confirm the exact production domain, data-retention needs, privacy notice, consent requirements, and hosting capacity.
- Plausible Community Edition uses AGPLv3-or-later. Review obligations before modifying or offering a network-accessible modified service.

No tracker was added to the frontend in this documentation-only change because the production domain and privacy configuration have not been verified.

## Deployment and integration gates

Any future service pilot must satisfy all applicable gates:

1. Pin a reviewed release tag and commit; inspect dependency and license notices.
2. Identify the target host and measure CPU, RAM, storage, and network requirements.
3. Put credentials in the target secret manager or server environment only; never commit keys, tokens, signing certificates, or SMTP passwords.
4. Define TLS, DNS, ingress, outbound egress, webhook signature checks, and rate limits.
5. Keep each service's data in its own database/storage and sync only the minimum fields needed.
6. Test backup and restore before importing real data.
7. Add health checks and non-destructive authenticated smoke tests.
8. Make external writes approval-gated and idempotent.
9. Record service owner, upgrade path, incident runbook, and rollback plan.
10. Obtain human approval before production enablement.

## Verified repository facts and official references

- Anytype application licensing and architecture: https://github.com/anyproto/anytype-ts ; https://anytype.io/faq/ ; https://github.com/anyproto/legal-docs
- Twenty repository and license: https://github.com/twentyhq/twenty ; https://github.com/twentyhq/twenty/blob/main/LICENSE
- Papermark repository, license, and self-hosting terms: https://github.com/papermark/papermark ; https://github.com/papermark/papermark/blob/main/LICENSE ; https://www.papermark.com/help/article/self-hosting
- Immich requirements and license: https://github.com/immich-app/immich/blob/main/docs/docs/install/requirements.md ; https://github.com/immich-app/immich/blob/main/LICENSE
- Jellyfin license and overview: https://github.com/jellyfin/jellyfin ; https://github.com/jellyfin/jellyfin/blob/master/LICENSE
- tldraw production license: https://tldraw.dev/community/license ; https://github.com/tldraw/tldraw/blob/main/LICENSE.md
- Documenso requirements and license: https://docs.documenso.com/docs/self-hosting/getting-started/requirements ; https://docs.documenso.com/docs/policies/licenses
- Nuxt README and MIT license: https://github.com/nuxt/nuxt ; https://github.com/nuxt/nuxt/blob/main/LICENSE
- Plausible self-hosting and license: https://github.com/plausible/analytics ; https://plausible.github.io/docs/self-hosting
- Buddy self-hosted license: https://buddy.works/enterprise-license

## Current status

- Instagram carousel inspected: 10 slides. No PDF was attached to the post.
- Repository / product identities and license caveats recorded above.
- This change updates architecture decisions and documentation only.
- No third-party service has been deployed or connected.
- No production credentials, user records, or personal data have been copied.
- Existing GitHub Actions CI remains the automation baseline.
- The pull request is for review; it has not been merged or deployed.
