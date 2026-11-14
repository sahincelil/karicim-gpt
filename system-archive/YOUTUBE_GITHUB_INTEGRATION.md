# SYSTEM ARCHIVE — YouTube × GitHub Integration

Status: Local read-only analytics integration prepared; Google OAuth owner setup pending.
Channel: SYSTEM ARCHIVE
Channel ID: UC2Iins0HcTm2EcSKmNHJHBA
Repository: public. Its Actions logs and artifacts are visible to people with repository read access.

## Privacy decision

Do not run real channel analytics in this public repository's GitHub Actions. GitHub documents that public-repository Actions history and logs are visible to everyone, and artifacts are available to people with repository read access. The analytics script therefore saves private report JSON only to a local path on the owner's computer. The GitHub Actions workflow runs synthetic unit tests only and does not use OAuth secrets.

Do not change repository visibility as part of this setup.

## YouTube access model

Use official Google OAuth 2.0 with only:
- \`https://www.googleapis.com/auth/yt-analytics.readonly\`

The local script uses a Desktop OAuth client and opens Google's consent flow in the owner's browser. It stores the OAuth token cache in the user's private home directory, not in Git. Never share Google passwords, one-time codes, recovery codes, client secrets, token files, or refresh tokens in chat, issues, pull requests, or repository files.

Do not request upload or broad account-management scopes for analytics.

## Local setup (Windows)

1. In Google Cloud Console, create/select a project and enable **YouTube Analytics API**.
2. Configure the OAuth consent screen. Create an OAuth client with application type **Desktop app** and download its JSON file.
3. On the owner's Windows account, create this private folder:
   \`%USERPROFILE%\.system-archive\`
4. Move the downloaded OAuth client JSON into that folder and rename it to:
   \`oauth-client.json\`
   Keep it outside the repository, public cloud-sync folders, and shared folders.
5. Install Python 3.12, then from the repository folder run:
   \`\`\`powershell
   python -m pip install -r requirements-youtube-analytics.txt
   python scripts/youtube_analytics.py --output "$env:USERPROFILE\.system-archive\analytics-private.json"
   \`\`\`
6. On the first run, a browser window opens. Sign in to the Google account that owns/manages SYSTEM ARCHIVE and approve only the read-only analytics scope.
7. The script stores its token cache at \`%USERPROFILE%\.system-archive\youtube-token.json\` and writes the private report to the output path. Keep both files private. Do not upload them to GitHub or send them in chat.

To validate OAuth without producing a report:
\`\`\`powershell
python scripts/youtube_analytics.py --check-only
\`\`\`

Optional custom paths:
\`\`\`powershell
python scripts/youtube_analytics.py --client-secrets "C:\private\oauth-client.json" --credentials "C:\private\youtube-token.json" --output "C:\private\analytics.json"
\`\`\`

## Report coverage

The script retrieves the previous 28 complete calendar days using the YouTube Analytics API. It returns:
- Channel-level summary metrics: engaged views, views, watch time, average view duration/percentage, likes, comments, shares, and subscribers gained/lost.
- Daily metrics split by \`creatorContentType\`, including Shorts and standard videos.
- Current seven-day versus previous seven-day comparisons, with percentage changes withheld when either period lacks complete daily coverage.
- Data coverage metadata. Missing rows are unknown, not zero.

Average view duration and average view percentage are weighted by engaged views. The API's engaged-views definition is distinct from views. YouTube Studio surfaces additional metrics that this script does not fabricate: Shorts "stayed to watch" is not inferred from engaged views. Thumbnail impression CTR is available through a separate YouTube Reporting API channel reach report and is not yet included in this script.

## GitHub Actions

Workflow: \`.github/workflows/youtube-analytics.yml\`

The workflow runs offline tests using synthetic data only. It does not connect to Google, consume OAuth secrets, print private analytics, or upload reports/artifacts. This is intentional while the repository remains public.

## Future publishing integration

Video upload is a separate capability requiring the \`youtube.upload\` OAuth scope. It must be implemented separately, with a dry-run/review step and owner confirmation before a video becomes public. Do not request \`youtube\`, \`youtube.force-ssl\`, or partner scopes for a simple analytics/reporting workflow.

## Operational guardrails

- No real channel analytics in public Actions logs or artifacts.
- No OAuth secrets in repository files, Issues, PR comments, Actions variables, or chat.
- No automated public upload, deletion, comment posting, or channel-setting changes.
- Revoke OAuth access from the Google Account if the integration is no longer needed.
