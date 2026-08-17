# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

"Roast My Drupal" — user submits a drupal.org username or profile URL, the
app scrapes their public drupal.org footprint, and an LLM roasts them based
strictly on their Drupal activity. Single Next.js app (App Router), deployed
on Vercel, one API route does the whole scrape → parse → prompt → stream
pipeline server-side.

**Current state:** only Phase 0 (scaffolding) is done — `app/layout.tsx` and
`app/page.tsx` are a bare title + input form with no logic wired up. The
architecture below is the v1 design target, not yet-built code. Full design
rationale (data source comparisons, cut fields, error handling, guardrails)
lives in `docs/plans/v1.md`; the build order is in `docs/plans/v1-phases.md`
— read both before implementing the next phase, and update the phase doc's
checklist as work lands.

## Commands

Package manager is pnpm (`packageManager: pnpm@10.33.0`).

- `pnpm dev` — start dev server (localhost:3000)
- `pnpm build` — production build
- `pnpm start` — run production build
- `pnpm lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)

No test runner is configured yet. `v1.md` calls for unit tests against saved
fixture HTML for the parsing layer (no live network calls in tests) — set up
the test runner when Phase 1 (`lib/parse-profile.ts`) is implemented.

## Architecture (v1 design target)

```
[Browser: username/URL input]
        │
        ▼
[app/api/roast/route.ts]
   1. Normalize input → username
   2. Resolve username → uid (JSON:API or legacy api-d7)
   3. Scrape 3 HTML pages: /u/{username}, /user/{uid}/track,
      /user/{uid}/contribution-records
   4. Parse/normalize into a typed "roast input" object
   5. streamText (Vercel AI SDK, @ai-sdk/google) with a system prompt
      scoped to Drupal-activity-only roasting
        │
        ▼
[Streamed response back to browser]
```

Planned module layout (not yet created):
- `lib/drupal-client.ts` — uid resolution + the 3 fetches, returns raw HTML fragments
- `lib/parse-profile.ts` — cheerio parsing → typed fields
- `lib/build-roast-prompt.ts` — typed data → prompt payload
- `app/api/roast/route.ts` — orchestrates client → uid → scrape → parse → prompt → stream, plus rate limiting

Key constraints from the design doc:
- No caching in v1 — every request re-scrapes and re-roasts (respecting
  `robots.txt`'s `Crawl-delay: 10`). A future cache layer is deliberately deferred.
- Roast content must stay scoped to Drupal activity/contribution data (bio
  phrasing, staleness, contribution claims vs. reality) — personal details
  incidentally present in scraped data (real name, country, employer) must
  not be used as roast material. This is enforced via the system prompt in
  `lib/build-roast-prompt.ts`.
- Degrade gracefully: if one of the 3 scrapes fails, roast with whatever
  data succeeded rather than hard-failing. If the username doesn't resolve
  to a uid, return a friendly not-found message with no LLM call (saves cost).
- LLM provider: Google Gemini via `@ai-sdk/google`, key in
  `GOOGLE_GENERATIVE_AI_API_KEY` (`.env.local`, gitignored; see `.env.example`).
