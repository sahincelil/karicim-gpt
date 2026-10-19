# Deployment blocker — verified diagnosis

Checked: 2026-10-19

## Tests performed

1. Listed Vercel projects in the connected Hobby team: **0 projects**.
2. Listed Vercel deployments in that team: **0 deployments**.
3. Attempted to create a Git-linked project from `sahincelil/karicim-gpt`: Vercel returned **403 Forbidden — no permission to create a project**.
4. Attempted a separate, static-only preview deployment using the existing landing-page HTML (no API keys, no backend): Vercel again returned **403 Forbidden — no permission to create a project**.
5. Added a GitHub Actions workflow for a static-only GitHub Pages deployment. The run reached `actions/configure-pages` but failed: **Resource not accessible by integration** while trying to create the Pages site. The connected workflow token cannot enable Pages for this repository.
6. GitHub CI and maintenance workflows passed on the previous commits; that does not establish hosting availability.

## Conclusion

Both available hosting paths are blocked by account/repository permissions, not by a demonstrated app build failure. Repeating unchanged requests will not fix this. No public deployment has been created.

## Safe next paths

- For GitHub Pages, a repository owner/admin needs to enable Pages in repository **Settings → Pages**, select **GitHub Actions** as the build/deployment source, and then rerun the [static landing page workflow](../actions/workflows/pages.yml). The workflow publishes only `docs/landing-page-preview.html` as a static page.
- For the full AI app, use the Vercel account/team that owns the intended project, or have an account owner grant the connected identity permission to create/deploy projects.
- If a Vercel project already exists under another team, select that authorized project/team rather than creating a duplicate.
- Static hosting will not run the server-side AI API. Never put `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, or `XAI_API_KEY` in browser code, static hosting, or committed files.

## What remains unverified

- Public URL availability and production health.
- AI-provider environment variables and real API calls.
- End-to-end chat behavior on a deployed serverless runtime.

No user spending, external outreach, or production service changes were made by these tests. A Pages deployment workflow was committed to the repository but has not deployed a site.
