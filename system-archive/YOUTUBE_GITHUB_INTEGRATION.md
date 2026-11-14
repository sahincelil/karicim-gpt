# SYSTEM ARCHIVE — YouTube × GitHub Integration

Status: Read-only analytics integration prepared; OAuth setup pending.
Channel: SYSTEM ARCHIVE
Channel ID: UC2Iins0HcTm2EcSKmNHJHBA

## What GitHub can manage

GitHub is the workflow control plane:
- Issues and Projects track production work.
- Pull requests review scripts, metadata, and changes.
- GitHub Actions run repeatable checks and scheduled/manual reporting.
- Releases preserve approved source packages and version notes.

The local Windows computer remains a production workstation. It is not granted administrator/root access by GitHub.

## YouTube access model

Use official Google OAuth 2.0. Never share Google passwords, one-time codes, recovery codes, client secrets, or refresh tokens in chat or commit them to Git.

Start with the minimum read-only scopes:
- `https://www.googleapis.com/auth/yt-analytics.readonly` for channel analytics.
- `https://www.googleapis.com/auth/youtube.readonly` only if a future feature needs channel/video metadata.

Do not request upload or broad account-management scopes for analytics.

## Prepared analytics workflow

Workflow: `.github/workflows/youtube-analytics.yml`
Script: `scripts/youtube_analytics.py`

It is manually triggered and queries daily channel metrics for the previous 28 complete days. It prints a compact report to the workflow log. It does not upload, edit, delete, schedule, or publish videos. It does not commit analytics data back into the repository.

Required GitHub Actions repository secrets:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

These values must be created through Google Cloud OAuth and stored directly in GitHub Settings → Secrets and variables → Actions. Never put their values in an Issue, PR, workflow file, or chat.

## OAuth setup, owner action required

1. In Google Cloud Console, create/select a project and enable YouTube Analytics API.
2. Configure the OAuth consent screen and create an OAuth client suitable for a local desktop authorization flow.
3. Authorize the Google account that owns/manages the channel using only the read-only analytics scope.
4. Store the client ID, client secret, and refresh token as the three repository Actions secrets listed above.
5. Run the workflow manually and inspect the report.

Google may require OAuth app verification or test-user configuration depending on the app's publishing status and requested scopes.

## Future publishing integration

Video upload is a separate capability requiring the `youtube.upload` OAuth scope. It must be implemented only when requested, with explicit privacy defaults, a dry-run/review step, and owner confirmation before a video becomes public. Do not request `youtube`, `youtube.force-ssl`, or partner scopes for a simple analytics/reporting workflow.

## Operational guardrails

- Read-only analytics may run on a schedule after credentials are configured.
- A workflow must never echo secret values or persist OAuth tokens as artifacts.
- Pull-request workflows must not receive OAuth secrets.
- No automated public upload, deletion, comment posting, or channel-setting changes.
- Disable/revoke OAuth access from the Google Account if the integration is no longer needed.
