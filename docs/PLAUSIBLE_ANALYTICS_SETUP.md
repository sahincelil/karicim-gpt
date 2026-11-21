# Plausible Analytics integration

## State

The integration code is optional and **disabled by default**. No live Vercel project or verified production domain was available during implementation, so no analytics script is currently loaded and no data is being sent to Plausible.

## Enable only after domain verification

Set one server-side environment variable on the actual deployment:

```text
PLAUSIBLE_DOMAIN=example.com
```

Use the exact hostname visitors use, without scheme, path, wildcard, or port. For a `www` production host, configure `www.example.com`; the matching is exact. Do not set this on preview environments. After setting it, deploy a reviewed release and verify `GET /api/analytics-config` returns `enabled: true` only on that exact production hostname.

The config endpoint checks all of the following:
- `NODE_ENV=production`
- a valid hostname in `PLAUSIBLE_DOMAIN`
- exact request-host equality

It does not return credentials or accept a caller-provided tracking domain. It cannot be enabled from a query parameter or browser storage.

## Events

The browser integration tracks only fixed event names:
- `Chat Message Sent`
- `Agent Mode Enabled`
- `Council Mode Enabled`
- `Chat Exported`

It never sends prompt text, assistant output, chat history, local-storage contents, account identifiers, email addresses, or custom event properties. The app does not add user IDs or session IDs.

The tracker is loaded from the fixed Plausible Cloud URL and permitted by a narrowly scoped Content Security Policy. A future self-hosted Plausible instance needs a separately reviewed script host and CSP change; do not widen CSP to arbitrary external hosts.

## Operational checks

1. Confirm the production hostname and the organization's privacy notice / KVKK obligations.
2. Add `PLAUSIBLE_DOMAIN` to production server environment only.
3. Deploy and verify config is disabled on preview domains and enabled only on the exact production host.
4. Inspect browser network requests and confirm no message content or user data is sent.
5. Add the hostname to the Plausible site dashboard and validate pageview/event counts.
6. Document retention, access to analytics dashboard, and an owner for routine review.

Plausible describes its tracker as cookie-free and its Community Edition as AGPLv3-or-later; these product characteristics do not by themselves decide whether a particular deployment meets every legal or organizational notice requirement. Review the applicable policy before enabling.

## Official references

- Tracker installation: https://plausible.github.io/docs/plausible-script
- Custom events: https://plausible.github.io/docs/custom-event-goals
- Self-hosting: https://plausible.github.io/docs/self-hosting
- Community Edition license: https://github.com/plausible/analytics
