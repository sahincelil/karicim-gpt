# KaricimGPT Agent Architecture

## Runtime

- `server.js` is the portable external body runtime.
- `/health` provides liveness information.
- `/api/chat` provides the conversational model gateway.
- `/api/agent` provides the guarded agent path.

## Model routing

`AI_PROVIDER=auto` is the recommended deployment mode:

1. Prefer OpenAI GPT-6 Astra when `OPENAI_API_KEY` is configured.
2. Fall back to OpenRouter when Astra is unavailable or not configured.
3. xAI remains available explicitly with `AI_PROVIDER=xai`.

No provider secret belongs in the repository.

## Agent loop

The runtime is deliberately bounded:

- request size and message count are capped;
- provider calls have a timeout;
- web tools are provider-hosted and tool choice is automatic;
- no arbitrary shell execution is exposed;
- no unauthenticated external write capability is exposed.

Persistent memory, scheduled jobs, and authenticated task execution should be added as separate components rather than granting the model unrestricted machine access.
