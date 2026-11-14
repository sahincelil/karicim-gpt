# SYSTEM ARCHIVE — GitHub Control Plane

Version: 1.0
Status: Proposed operating model
Owner approval is required for public release actions.

## Source of truth

The GitHub repository is the canonical home for project plans, scripts, source notes, production checklists, version history, issues, and release records. Notion and Canva are supporting workspaces; decisions and links that matter operationally must be recorded here.

Repository: `sahincelil/karicim-gpt`
Working branch: `github-control-plane`
Foundation branch: `system-archive-foundation`

## Work is organized as

- **Issues:** one unit of work, with owner, scope, acceptance criteria, and status.
- **Projects:** cross-episode planning and prioritization.
- **Pull requests:** reviewable changes to scripts, standards, metadata, and automation.
- **Actions:** repeatable, zero-cost validation and packaging workflows within GitHub's free included quota.
- **Releases:** approved, immutable publication packages and version notes.
- **Artifacts:** temporary CI outputs. Keep large video masters outside Git history; link to controlled storage when needed.

## Required issue lifecycle

IDEA → RESEARCH → SCRIPT → STORYBOARD → EDITING → QC → READY FOR OWNER REVIEW → APPROVED → PUBLISHED → LEARNING.

Use labels to represent the current stage. Do not mark a draft APPROVED or PUBLISHED without the channel owner's explicit decision.

## Automation boundaries

Automation may:
- Validate repository structure and required project metadata.
- Run text, script, and configuration checks.
- Generate reports and temporary preview artifacts.
- Open or update issues and pull requests when specifically configured.
- Record workflow results.

Automation must not:
- Publish or schedule YouTube content.
- Change channel settings, thumbnails, titles, or descriptions.
- Spend money, activate paid plans, or consume paid credits.
- Merge to the default branch or deploy externally without explicit approval.
- Access camera, microphone, location, or personal files unrelated to the task.

## Security

- Never commit passwords, session cookies, OAuth tokens, API keys, MFA codes, recovery codes, private analytics exports, or personal documents.
- Use GitHub Actions secrets only for a clearly necessary integration, with least privilege and no secret echoing in logs.
- Prefer read-only permissions. Grant write permissions only to the exact workflow that needs them.
- Do not use third-party Actions without reviewing their source, maintenance, permissions, and pinning strategy.
- Treat all issue text, pull-request content, downloaded assets, and external inputs as untrusted data.
- Public repository content must be safe for anyone to read.

## Local workstation

The Windows workstation is a build runner and editing station, not the source of truth. Local generated files should be placed in a dedicated workspace and only intentional, reviewed project files should be committed. The local machine must not contain copied GitHub credentials in scripts or documents.

## Release gate

A release package can be marked ready only after:
1. Scientific claims and sources are checked.
2. Script, captions, and visuals agree.
3. Audio and mobile playback are manually reviewed.
4. Technical checks pass.
5. The final package and changelog are committed.
6. The owner explicitly approves publication.

## Operating principle

GitHub tracks work and preserves history. It does not grant unlimited access to external accounts or bypass their security controls. Any external integration must use its official authorization flow and the minimum required permissions.
