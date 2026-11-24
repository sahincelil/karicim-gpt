# LEGION multi-provider inference

LEGION's existing `POST /api/chat` endpoint supports server-side OpenAI Responses API, OpenRouter, and xAI. This change adds an Ollama adapter and includes it in explicit provider selection and the automatic fallback chain.

## Server environment

- `AI_PROVIDER=auto` (default), or `openai`, `openrouter`, `xai`, `ollama`
- `OPENAI_API_KEY` and optional `OPENAI_MODEL`
- `OPENROUTER_API_KEY` and optional `OPENROUTER_MODEL`
- `XAI_API_KEY`
- `OLLAMA_BASE_URL` (for example `http://127.0.0.1:11434`) and optional `OLLAMA_MODEL` (default `llama3.2`)

Provider credentials and URLs are server-side environment variables only. Never place API keys in browser code or commit them.

## Automatic routing

When `AI_PROVIDER=auto`, LEGION tries configured providers in order: OpenAI, OpenRouter, xAI, then Ollama. A failed provider is skipped; request cancellation is not swallowed. Ollama is considered only when `OLLAMA_BASE_URL` is configured.

## Hybrid deployment note

A cloud-hosted Vercel function cannot reach a laptop's `127.0.0.1`. For a hybrid deployment, set `OLLAMA_BASE_URL` to a private, authenticated HTTPS endpoint reachable from the server runtime, or run the LEGION API on the same host/network as Ollama. Do not expose Ollama's unauthenticated port directly to the public internet.

## Validation

Run `node test/ollama-provider.test.js` and `npm run check`. These tests mock the Ollama HTTP response; they do not claim a live model connection.
