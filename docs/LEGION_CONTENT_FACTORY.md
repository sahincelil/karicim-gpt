# LEGION CONTENT FACTORY — SYSTEM ARCHIVE

## Scope of this first increment

The first increment adds a server-routed content brief generator to KaricimGPT. One topic produces a research brief and two editorial deliverables: a YouTube Short and a 6–8 minute long-form video package. It does not render video/audio, upload files to YouTube, schedule posts, or publish automatically.

## Data flow

1. The user enters a topic and optional brief in the factory panel.
2. `content-factory-ui.js` sends a bounded JSON request to `POST /api/content-factory`.
3. `api/content-factory.js` validates input and builds the SYSTEM ARCHIVE production prompt.
4. The route delegates to the existing `api/chat.js` provider router. Existing server-side AI credentials, rate limiting and provider timeout handling are reused.
5. The UI renders returned Markdown as text, with a copy action. It does not interpret model output as HTML.

## Editorial contract

- Channel: **🧩 SYSTEM ARCHIVE // HUMAN PROTOCOL**
- Core areas: human behavior, brain/perception, psychology, technology and hidden systems.
- Voice: Turkish, faceless, cinematic, evidence-oriented.
- Every content package includes source checks, three hook/title angles, Shorts and long-form scripts, visual direction, metadata, follow-on episode ideas and a measurement plan.
- Research sources must be real and directly linked. Unverified claims must be labelled; sources and quotations must not be invented.
- Shorts and long-form performance must be measured in separate cohorts.

## Observed channel evidence

Supermetrics YouTube source `YT2` was authenticated and the connected channel was identified as `UC2Iins0HcTm2EcSKmNHJHBA`.

The saved account context recorded a baseline on **2026-11-14** of 35 subscribers, 44 videos and 13,289 lifetime channel views. The 30-day target is 1,000 subscribers. From that baseline the required net increase is 965 subscribers, or approximately 32.2 per day; this is a stretch target, not a forecast.

The successful channel-total query returned dates through **2026-11-20**. Among its returned dates, 2026-11-17 recorded 630 views and 2026-11-18 recorded 409 views. The connected Supermetrics query is not current through 2026-11-23, so these numbers must not be described as today's live totals.

A recent video-level report (cache timestamp 2026-11-22 22:55 UTC) showed:
- `scuI44ej5co`, **“Beynin Görmediğin Dünyayı Tamamlıyor!”**: 15-second Short, 1,038 views, 378 engaged views, +1 subscriber, 24-second average view duration and 165.79% average view percentage.
- `pxLT3mm_mSY`, **“Kör Noktanı Neden Göremiyorsun? Beynin Görmediğini Tamamlıyor!”**: 7:42 long-form video, 32 views, 26 engaged views, no subscriber gains, 61-second average view duration and 13.26% average view percentage.

These are different formats and lengths, not a controlled A/B test. The factory therefore asks the operator to compare Shorts against Shorts and long-form against long-form, and to test hook/title variants deliberately.

## Connection status and deployment boundary

- **GitHub:** repository `sahincelil/karicim-gpt` is accessible with push permissions. This feature is developed on its own branch and must pass GitHub Actions before review/merge.
- **Supermetrics:** YouTube `YT2` is authenticated in the connected Supermetrics workspace. This proves the assistant-side reporting connection, not that the deployed KaricimGPT server has a Supermetrics API credential. No Supermetrics secret is embedded in this app.
- **AI provider:** the route reuses `api/chat.js`. A real generation request requires at least one supported provider credential configured as a server-side environment variable. No secret is committed or exposed to browser JavaScript.
- **Vercel:** the connected account currently lists zero projects. Repository deployment notes document previous 403 project-creation failures. No deploy or production URL is claimed.
- **CodeWords:** service inventory could not be read during this implementation because the connected CodeWords account reported that its free credits were exhausted.

## Deferred increments

1. **Media assembly:** add narration generation, licensed visual asset retrieval, captions, and rendering once a specific provider and its credentials are configured.
2. **Analytics automation:** connect the app server to an authorized Supermetrics API integration or an approved export path. Do not assume the assistant-side OAuth connection is available to the app runtime.
3. **Publishing:** add YouTube OAuth upload/scheduling only after explicit account authorization, upload scopes, privacy defaults and an approval gate. The first increment deliberately has no publish action.

## Verification checklist

- Input validation rejects missing/oversized topics and oversized notes.
- Prompt contract includes both output formats, sources, scene plans, metadata and separate measurement plans.
- `npm run check` verifies syntax and existing regression tests, including the new content-factory tests.
- GitHub Actions must pass on this feature branch/PR before merge.
- Live generation and production health remain unverified until an authorized Vercel project and server-side AI provider secret are configured.

No YouTube content has been uploaded or published by this change.
