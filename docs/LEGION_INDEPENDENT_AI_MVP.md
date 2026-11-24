# LEGION INDEPENDENT AI — MVP 0.1

## What shipped in this branch

- Standalone responsive command surface at `/legion/`.
- Serverless cloud health endpoint at `/api/legion-health`.
- Browser-side Ollama reachability test for a user-owned local machine.
- Local task queue with explicit queued/running/done transitions.
- Browser-local audit trail.
- Owner-control policy summary and explicit disclosure of unconnected services.

## Hybrid architecture

```text
iPhone / desktop browser
       |  HTTPS
       v
Vercel static frontend + serverless health endpoint
       |
       +---- local browser request ----> Ollama on same device
       |
       +---- future provider adapters --> server-side model APIs
       |
       +---- future durable memory -----> PostgreSQL / pgvector
```

The MVP does not proxy prompts to a local node, store cloud memory, authenticate users, connect provider keys, or run autonomous workers. The interface labels these capabilities as pending instead of implying they are live.

## Local Ollama

1. Install Ollama on the computer that will host local inference.
2. Start Ollama and pull a model, e.g. `ollama pull qwen2.5:7b`.
3. Open the deployed dashboard on that same computer.
4. If the browser blocks the request, set `OLLAMA_ORIGINS` to the exact deployed origin and restart Ollama.
5. In Intelligence Registry, test `http://localhost:11434`.

Do not expose Ollama directly to the public internet. Use a private authenticated network for remote devices.

## Deployment

The canonical repository remains `sahincelil/karicim-gpt`. This feature is proposed on a dedicated branch and should be previewed and reviewed before merge. Production deployment remains a separate approval step.

## Next integration gates

1. Add encrypted server-side model-provider secrets and per-provider budget limits.
2. Connect PostgreSQL/pgvector with user authentication and tenant isolation.
3. Add a private local-node bridge with pairing, authentication, replay protection and explicit tool scopes.
4. Connect bounded task workers to the existing GitHub LEGION queue; retain the existing three-worker ceiling and human review.
5. Add integration tests for real local-node handshake and authenticated model inference.
6. Verify Vercel preview and production deployments independently.

## Test

Run `node test/legion-independent.test.js` and `node --check api/legion-health.js`.
