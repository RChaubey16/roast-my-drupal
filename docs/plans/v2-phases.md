# Roast My Drupal — v2 Implementation Phases

Companion to [`v2.md`](./v2.md). Each phase produces something runnable
and testable before moving to the next — no phase depends on unbuilt
future work. Builds on the shipped v1 app (`v1-phases.md`, all phases
done).

## Phase 1 — Caching (Vercel KV) — DONE

- Provision a Vercel KV store and its env vars (`KV_REST_API_URL`,
  `KV_REST_API_TOKEN`) via the Vercel dashboard; add to `.env.local`
  and `.env.example` for local dev
- Install `@vercel/kv`
- `lib/cache.ts` — `getCachedProfileData` / `setCachedProfileData`,
  keyed by normalized username, TTL ~10 minutes; any KV error (timeout,
  unreachable, etc.) is treated as a cache miss, never blocks the
  request
- Wire into `lib/drupal-client.ts`: `fetchDrupalProfileData` checks the
  cache first; on a miss, scrape as before and cache the raw result.
  The roast text itself is never cached — only the scrape
- Unit tests for `lib/cache.ts` against a mocked KV client (hit, miss,
  error-falls-through-to-miss)

**Done when:** requesting the same username twice in quick succession
triggers only one live scrape (verified via a fetch spy/mock), with the
second call served from cache; simulating a KV outage still completes
the request via a live scrape.

## Phase 2 — Per-maintained-module health data — DONE

- Research step: confirm `/project/{name}` page structure and its
  robots.txt allowance; save fixture HTML for a maintainer with
  several projects and one with none — same research-before-parser
  approach v1 used for the profile and contribution-records pages
- `lib/parse-module-health.ts` — parser for last release date + open
  issue count, fixture-tested
- Fetch up to the first 5 entries in `projectsMaintained`, alongside
  the existing 3 fetches via `Promise.all`, only on a cache miss
- `lib/build-roast-prompt.ts` — add `moduleHealth:
  { name, lastReleaseDate, openIssueCount }[]` to `RoastInput`, include
  it in the prompt payload

**Done when:** given a username with several maintained projects, the
built roast input includes health data for up to 5 of them (unit-tested
against fixtures); a user with zero maintained projects, or one whose
project-page fetch fails, still produces a roast with that project's
health data simply omitted — not a hard error.

## Phase 3 — Roast card (frontend) — DONE

- `app/api/roast/route.ts` — attach the roast input's stats as a
  response header (`X-Roast-Stats`, base64-encoded JSON) alongside the
  existing streamed text body
- `app/page.tsx` — parse the header and render a card layout: account
  age, contribution credits, membership badge, and module health
  displayed alongside the streamed roast text. A missing or malformed
  header falls back to rendering the roast text alone, no hard error

**Note:** built ahead of Phase 2 (module health). Phase 2 has since
landed in `RoastInput`/the roast prompt, but the card itself
(`RoastStats`/`X-Roast-Stats` in `lib/roast/roast-stats.ts`,
`app/page.tsx`) still only surfaces account age, membership badge, and
contribution credit stats — wiring module health into the card display
is still open, tracked here rather than as its own phase.

**Done when:** a real username in the browser shows a styled card with
the stats fields alongside the streaming roast text; forcing a
missing/malformed header still renders the roast text without an
error.

## Phase 4 — Roast modes (celebrity personas) — DONE

- `lib/roast/roast-modes.ts` — a `ROAST_MODES` map keyed by mode id
  (`default`, `chandler-bing`, `kevin-hart`, `elon-musk`,
  `gordon-ramsay`), each holding a persona-flavor system-prompt
  fragment written as parody/style ("roasted in the comedic *style*
  of X"), never as a real quote or claim attributed to that person.
  The Drupal-activity-only scope instruction is shared across all
  modes, not per-persona, so no mode can be used to smuggle in
  off-topic or unscoped content
- `buildRoastPrompt(input, mode)` — accepts a mode id, selects the
  matching persona fragment; an unknown or missing mode id falls back
  to `default` silently, not a hard error
- `app/api/roast/route.ts` — accepts an optional `mode` field on the
  request body, validated against the known `ROAST_MODES` keys
- `app/page.tsx` — a mode selector (pills or dropdown) next to the
  username input, sent along in the POST body; defaults to `default`
- Verify by manual before/after comparison against a couple of real
  profiles (a prolific one, a sparse one), once per mode; LLM output
  isn't something to unit-test, but `ROAST_MODES` lookup/fallback
  behavior is

**Done when:** each mode reads distinctly in that persona's voice
against the same 2 test profiles, still scoped strictly to Drupal
activity; omitting `mode` or sending an unknown mode id produces
output indistinguishable from today's default tone.

## Phase 5 — Manual QA & ship

- End-to-end pass against a handful of real usernames spanning
  activity levels and maintained-project counts (very active, sparse,
  brand-new, multiple maintained projects)
- Confirm cache hit and miss both work against the deployed KV store
- Confirm each roast mode still holds scope on a real profile, not
  just the fixture-backed test profiles
- Redeploy to Vercel, confirm env vars/secrets (including the new KV
  ones) are set, smoke test the deployed URL

**Done when:** the live v2 app is deployed, roasts a real profile with
module health data, card layout, and selectable roast modes, and a
repeat request for the same username within the cache TTL doesn't
re-scrape.

## Explicitly deferred (post-v2)

- Tier 2 activity feed — still excluded; no compliant data source
  found
- Caching the generated roast text itself
- Downloadable/shareable roast card image (e.g. via `@vercel/og`)
