# Digital Twin Core

KaricimGPT's digital twin is a versioned, user-owned profile plus explicit decision examples. The repository intentionally contains only the generic engine and schema: personal profile data must not be committed to this public repository.

## Data model

- `profile.schemaVersion`: schema version for migrations.
- `profile.profileVersion`: increments on each profile update.
- `confirmedFacts`: facts the user explicitly stated or verified.
- `hypotheses`: tentative interpretations, not treated as facts.
- `openQuestions`: unresolved areas that need examples.
- `examples`: user-provided decision cases with situation, decision, reasoning, outcome, tags, and confidence.
- `revisions`: bounded profile change log.

The engine stores up to 200 decision examples and 100 profile revisions. Text fields are length-limited. Profile updates accept only known fields. Both `/api/chat` and `/api/agent` include a bounded profile context when one exists; the context distinguishes confirmed facts from hypotheses and does not override system or safety rules.

## API

Set `BODY_ADMIN_TOKEN` on the server. All routes require `Authorization: Bearer <BODY_ADMIN_TOKEN>`; the API fails closed if the token is not configured.

- `GET /api/digital-twin` — read profile, examples, revision history, and health.
- `POST /api/digital-twin` with `{"action":"update_profile","profile":{...},"note":"..." }` — update allowed profile fields and increment profile version.
- `POST /api/digital-twin` with `{"action":"add_example","example":{"situation":"...","decision":"...","reasoning":"...","outcome":"...","tags":["..."],"confidence":"medium"}}` — add a decision example.

## Persistence

The file path defaults to `data/digital-twin.json`, can be overridden with `DIGITAL_TWIN_FILE`, or follows `DATA_DIR`. The `data/` directory is gitignored. For hosted deployments, configure a persistent volume or durable database; an ephemeral server filesystem is not guaranteed to survive redeploys or cold starts.

## Evolution rules

1. Keep explicit facts separate from hypotheses.
2. Do not infer traits from a single multiple-choice answer.
3. Change profile claims only when supported by repeated answers or concrete examples.
4. Track uncertainty and ask for discriminating examples when needed.
5. Evaluate profile changes with tests before deployment.
6. The engine records data; it does not silently infer or rewrite a person's profile by itself.

## Verification

Run `npm test` with Node.js 24 or newer. Tests use a temporary file and do not write personal data into the repository.
