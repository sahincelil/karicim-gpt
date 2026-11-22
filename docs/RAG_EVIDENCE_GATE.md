# LEGION RAG Evidence Gate

Status: partial implementation. This component validates and ranks retrieval candidates before they enter the agent prompt. It is not a vector database, embedding generator, or independent retriever.

## Request contract

The existing `POST /api/agent` endpoint accepts an optional `evidence` array in addition to `messages`. Each candidate follows `schemas/evidence-candidate.schema.json`:

- `title`: human-readable source title.
- `content`: excerpt or retrieved chunk, up to 8,000 characters.
- `source_url`: public HTTPS URL used for citation.
- `source_name`: optional display name.
- `published_at`: optional ISO-8601 publication timestamp.

At most 12 candidates are inspected and at most 6 are passed to the model. Duplicated source URLs, non-HTTPS or local URLs, title-only matches, irrelevant excerpts, future publication dates, oversized content, and credential-like text are rejected.

## Ranking and trust

The gate tokenizes the user's latest message with Turkish-aware normalization, measures query-term coverage, boosts title and phrase matches, and adds modest freshness and source-domain signals. The score is a deterministic triage score, not a probabilistic confidence or factual truth score.

Set the server-side `EVIDENCE_TRUSTED_DOMAINS` environment variable to a comma-separated list of domains whose ownership and quality have been reviewed, for example:

`EVIDENCE_TRUSTED_DOMAINS=developers.openai.com,modelcontextprotocol.io,docs.github.com`

A domain is allowlisted only when it exactly matches a configured domain or is its subdomain. Without an allowlist, sources can be accepted as provisional but are never labeled grounded. Domain allowlisting verifies only a configured hostname match; it does not prove that an individual page is correct, current, or uncompromised.

## Prompt handling

Accepted excerpts are serialized as JSON and explicitly marked untrusted. The agent is instructed not to follow instructions embedded in retrieved source text. Source references are assigned as `[E1]`, `[E2]`, etc. The model may cite only those references and must not invent them.

The response includes an `evidence` summary with status, accepted/rejected counts, query coverage, source URLs, allowlist status, and ranking scores. Status values:

- `not_provided`: no retrieval candidates were supplied.
- `insufficient`: candidates were supplied but none passed the gate.
- `provisional`: relevant candidates passed, but domain allowlisting or query coverage is incomplete.
- `grounded`: relevant candidates passed, all selected domains match the configured allowlist, and aggregate query coverage is at least 35%.

## Current boundary and next stage

This is a pre-generation evidence gate, not a complete RAG stack. A retrieval adapter must still fetch authorized sources, chunk them, and submit candidates using the contract. Future semantic retrieval can connect through the same contract without changing the agent prompt format. The gate does not fetch URLs itself and does not claim to independently verify page contents.

Run `npm run check` to execute the evidence-gate regression tests.
