# SYSTEM ARCHIVE — GitHub Control Plane

Version: 1.1
Status: Active operating model
Owner approval is required only for consequential external actions such as public publication, spending, or destructive account changes.

## Source of truth

GitHub is the primary control plane and canonical source of truth for SYSTEM ARCHIVE. Project plans, agent instructions, scripts, source notes, production checklists, tasks, version history, automation definitions, test results, and release records live here.

Repository: `sahincelil/karicim-gpt`
Active foundation branch: `system-archive-foundation`

Notion, Canva, and the workstation are optional supporting tools. They are not required for routine project coordination.

## GitHub-first operating model

- **Issues:** tasks, blockers, acceptance criteria, and status.
- **Pull requests:** all reviewable code, prompt, policy, and workflow changes.
- **Actions:** scheduled or manually triggered tests, validation, packaging, and status reports.
- **Releases:** versioned, owner-approved production packages.
- **Repository docs:** canonical operating instructions and agent roles.
- **Workflow summaries:** concise execution results; never include credentials or private channel analytics in public logs.

## Work lifecycle

IDEA → RESEARCH → SCRIPT → STORYBOARD → EDITING → QC → READY FOR OWNER REVIEW → APPROVED → PUBLISHED → LEARNING.

Use labels and issue checklists to track each stage. Do not mark a draft APPROVED or PUBLISHED without the channel owner's explicit decision.

## Automation policy

Automation may:
- Validate repository structure, scripts, metadata, and configuration.
- Run tests and static checks.
- Generate non-sensitive reports and production packages.
- Open or update issues and pull requests.
- Record workflow outcomes and maintenance status.
- Run on GitHub-hosted runners where the workflow and data classification permit it.

Automation must not:
- Publish or schedule YouTube content without explicit approval for that release.
- Change channel settings, thumbnails, titles, or descriptions without explicit approval.
- Spend money, activate paid plans, or consume paid credits.
- Exfiltrate credentials, private analytics, or unrelated personal data.
- Run arbitrary shell commands from untrusted issue or pull-request content.
- Deploy externally or perform destructive account changes without explicit approval.

## Data classification

- **Public repository:** source code, non-sensitive documentation, templates, synthetic test data, and public production notes only.
- **Secrets:** OAuth credentials and API keys must never be committed, placed in issue text, printed in logs, or included in artifacts. Use a narrowly scoped secret store only after the integration design and workflow are reviewed.
- **Private analytics:** real channel metrics must not be written to public workflow logs, artifacts, commits, or issues. Keep them in an appropriately private destination. If GitHub is to store private analytics, first move the project to a private repository or establish an explicitly private storage design.
- **Large media:** keep video masters out of Git history; use controlled storage and link to it from GitHub.

## External account authorization

GitHub is the command center, not a substitute for authorization by Google, YouTube, or other external services. Initial OAuth consent and any required account-owner action must use the provider's official flow. Request only the scopes required for the specific task.

For the current YouTube analytics integration, the repository's workflow runs synthetic-data tests only. Live channel OAuth is not yet connected. Do not claim live analytics access until a real read-only authorization succeeds.

## Release gate

A release package can be marked ready only after:
1. Scientific claims and sources are checked.
2. Script, captions, and visuals agree.
3. Audio and mobile playback are manually reviewed.
4. Technical checks pass.
5. The final package and changelog are committed.
6. The owner explicitly approves publication.

## Operating principle

Use GitHub first for planning, coordination, code, automation, and evidence. Use another system only when an external provider requires it or when privacy/data handling makes GitHub unsuitable. Never bypass external account security.
