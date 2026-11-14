# PostHog analytics

PostHog analytics is optional and disabled until a visitor opts in through the in-app consent notice.

## Configuration

Set server-side `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` environment variables. The configured EU project uses `https://eu.i.posthog.com`. Never commit real environment values. Missing configuration must not prevent the application from starting.

## Events

The server records only `karicimgpt_interaction_started`, `karicimgpt_interaction_completed`, and `karicimgpt_interaction_failed` on chat, agent, and council routes. Properties are limited to the app name, interaction mode, and HTTP status code. Chat messages, model responses, prompts, email addresses, account identifiers, and provider credentials are not sent.

The browser creates a random per-tab UUID only after explicit consent. The server accepts only UUID v4 values and disables GeoIP enrichment. Visitors can reject analytics; that decision is stored locally and no analytics identifier is sent.

Run `npm test` to execute privacy tests with the existing suite.
