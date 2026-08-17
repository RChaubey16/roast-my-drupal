# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

"Roast My Drupal" — user submits a drupal.org username or profile URL, the
app scrapes their public drupal.org footprint, and an LLM roasts them based
strictly on their Drupal activity. Single Next.js app (App Router), deployed
on Vercel, one API route does the whole scrape → parse → prompt → stream
pipeline server-side.

**Current state:** Phase 0 (scaffolding) and Phase 1 (Drupal data layer) are
done — `lib/drupal-client.ts` and `lib/parse-profile.ts` exist and are
tested. `app/layout.tsx`/`app/page.tsx` are still a bare title + input form
with no logic wired up; the prompt-building and API route layers below are
still the v1 design target, not yet-built code. Full design rationale (data
source comparisons, cut fields, error handling, guardrails) lives in
`docs/plans/v1.md`; the build order is in `docs/plans/v1-phases.md` — read
both before implementing the next phase, and update the phase doc's
checklist as work lands.

## Commands

Package manager is pnpm (`packageManager: pnpm@10.33.0`).

- `pnpm dev` — start dev server (localhost:3000)
- `pnpm build` — production build
- `pnpm start` — run production build
- `pnpm lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)
- `pnpm test` — Vitest (`vitest run`); single file: `pnpm test lib/parse-profile.test.ts`

Parser tests run against saved fixture HTML in `lib/__fixtures__/` — no
live network calls in tests. Fixtures cover a prolific profile (dries) and
a sparse one (Kjartan), for both the profile page and contribution-records
(including the security-advisory-filtered variant).

## Architecture (v1 design target)

```
[Browser: username/URL input]
        │
        ▼
[app/api/roast/route.ts]
   1. Normalize input → username
   2. Resolve username → uid (JSON:API or legacy api-d7)
   3. Scrape: /u/{username} once, /user/{uid}/contribution-records
      twice (unfiltered for the total, `?field_is_sa_value=1` for the
      security-advisory-only count — same "Displaying X of Y" header
      each time). 3 fetches total. The activity/track page is
      excluded — disallowed by robots.txt
   4. Parse/normalize into a typed "roast input" object
   5. streamText (Vercel AI SDK, @ai-sdk/google) with a system prompt
      scoped to Drupal-activity-only roasting
        │
        ▼
[Streamed response back to browser]
```

Module layout:
- `lib/drupal-client.ts` — done. Uid resolution + the 3 fetches, returns
  raw HTML fragments (or `null` per field on failure/access-restriction)
- `lib/parse-profile.ts` — done. Cheerio parsing → typed fields, covers
  both the profile page (Tier 1) and contribution-records (Tier 3)
- `lib/build-roast-prompt.ts` — not yet created. Typed data → prompt payload
- `app/api/roast/route.ts` — not yet created. Orchestrates client → uid →
  scrape → parse → prompt → stream, plus rate limiting

Key constraints from the design doc:
- No caching in v1 — every request re-scrapes and re-roasts (respecting
  `robots.txt`'s `Crawl-delay: 10`). A future cache layer is deliberately deferred.
- Roast content must stay scoped to Drupal activity/contribution data (bio
  phrasing, staleness, contribution claims vs. reality) — personal details
  incidentally present in scraped data (real name, country, employer) must
  not be used as roast material. This is enforced via the system prompt in
  `lib/build-roast-prompt.ts`.
- Degrade gracefully: if one of the 3 fetches fails, roast with whatever
  data succeeded rather than hard-failing. If the username doesn't resolve
  to a uid, return a friendly not-found message with no LLM call (saves cost).
- LLM provider: Google Gemini via `@ai-sdk/google`, key in
  `GOOGLE_GENERATIVE_AI_API_KEY` (`.env.local`, gitignored; see `.env.example`).
