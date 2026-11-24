# LEGION Business Pilot MVP 0.1

## Delivered slice
- Adds a Turkish-first business validation page at `/business.html`.
- Adds a deterministic time/value scenario calculator with validated numeric bounds.
- Adds a local-only pilot discovery note builder. It does not transmit or persist lead data.
- Adds navigation from the KaricimGPT home page and local Node server static routing.

## Product assumptions
- Initial customer wedge: small Turkish service businesses.
- Initial jobs: FAQ/reception replies, quote follow-ups, and social content drafts.
- Human review remains required before any external communication.
- The ROI calculator uses an explicitly disclosed 50% time-reduction assumption. It is illustrative, not measured performance or a product promise.

## Tests
- `node --check lib/business-roi.js`
- `node test/business-roi.test.js`
- The repository `npm run check` includes both checks.

## Deliberately not included
- No customer data collection, analytics event, email/WhatsApp send, payment, or account creation.
- No live model inference on this page.
- No Supabase persistence because the connected project is paused.
- No production deployment because no linked Vercel project was found.
- No customer outreach or revenue claim.

## Next gate
Validate the page with a small number of consenting business owners using synthetic or non-sensitive examples. Only then select one workflow for the next AI-enabled vertical slice.
