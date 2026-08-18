# Roast My Drupal — v1 Implementation Phases

Companion to [`v1.md`](./v1.md). Each phase produces something runnable
and testable before moving to the next — no phase depends on unbuilt
future work.

## Phase 0 — Project scaffolding — DONE

- Initialize Next.js app (TypeScript, App Router)
- Install dependencies: Vercel AI SDK, an LLM provider SDK, `cheerio`,
  a rate-limit library
- Env var setup for the LLM API key
- Bare-bones page with an input box (no logic wired up yet)

**Done when:** app boots locally, empty input UI renders.

## Phase 1 — Drupal data layer (scrape + parse) — DONE

- `lib/drupal-client.ts` — resolve username → uid (via JSON:API or
  api-d7), fetch profile + contribution-records (twice: unfiltered
  and `field_is_sa_value=1`, for total vs. security-advisory counts —
  3 fetches total). The activity/track page is dropped, see `v1.md`:
  disallowed by `robots.txt`
- `lib/parse-profile.ts` — parse raw HTML into the typed v1 field set
  (Tier 1/3 fields from `v1.md`)
- Save fixture HTML for 2 real usernames (one prolific, one
  near-empty) and write unit tests against those fixtures — no live
  network calls in tests
- Handle: username doesn't resolve, individual page fetch fails

**Done when:** given a username, a script/test can produce the
cleaned "roast input" object end-to-end, verified against both
fixture profiles.

## Phase 2 — Roast generation — DONE

- `lib/build-roast-prompt.ts` — turn the cleaned data object into the
  prompt payload
- Write the system prompt: Drupal-activity-only scope, tone, plain
  text output
- Wire up `streamText` from the AI SDK using that prompt
- `app/api/roast/route.ts` — orchestrates client → uid → scrape →
  parse → prompt → stream, no rate limiting yet

**Done when:** hitting the API route with a real username streams
back a roast in the terminal/Postman, sourced from real scraped data.

## Phase 3 — Frontend integration — DONE

- Input form: accepts username or full profile URL, normalizes to
  username client- or server-side
- Streams the roast into the UI as it generates
- Loading state while scraping/generating
- Error states matching the backend's error contract (profile not
  found, generation failed + retry)

**Done when:** a person can type a real drupal.org username into the
browser and watch a roast stream in, including the not-found path.

## Phase 4 — Rate limiting & hardening

- Per-IP rate limiter on `app/api/roast/route.ts`
- "Slow down" UI state when rate-limited
- Confirm no LLM call fires on: unresolved username, rate-limit hit
- Pass through partial data gracefully if one of the 3 fetches fails
  (roast with what succeeded rather than hard error)

**Done when:** rapid repeated requests from one client get throttled
before any scrape or LLM call happens; a partial-scrape case still
produces a roast.

## Phase 5 — Manual QA & ship

- End-to-end pass against a handful of real usernames spanning
  activity levels (very active, sparse, brand-new account)
- Deploy to Vercel, confirm env vars/secrets are set
- Smoke test the deployed URL

**Done when:** the app is live on a public Vercel URL and roasts a
real profile correctly.

## Explicitly deferred (post-v1)

- Caching layer (Vercel KV, TTL per username)
- Per-maintained-module health data (second scrape hop)
- Structured/visual "roast card" output
- Tune system prompt for a funnier/punchier tone (current roasts are
  accurate but play it fairly straight)
