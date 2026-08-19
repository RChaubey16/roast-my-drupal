import { kv } from "@vercel/kv";
import type { DrupalProfileData } from "./drupal-client";

const CACHE_TTL_SECONDS = 600;

/**
 * Build the KV key a username's cached scrape result is stored under.
 *
 * Think of this like a filing cabinet label: however the username
 * was cased, it lands under one consistent tab so lookups and writes
 * always agree on where to look.
 *
 * @param username - The drupal.org username to key the cache entry by.
 * @returns The KV key for that username's cached scrape result.
 *
 * @example
 * ```ts
 * cacheKey("Dries"); // "roast-profile:dries"
 * ```
 */
function cacheKey(username: string): string {
  return `roast-profile:${username.toLowerCase()}`;
}

/**
 * Look up a cached scrape result for a username.
 *
 * Think of this like checking a filing cabinet before sending someone
 * out to redo research: if the folder's already there, hand it over
 * instead of repeating the legwork.
 *
 * @param username - The drupal.org username to look up.
 * @returns The cached `DrupalProfileData`, or `null` on a cache miss
 * or any KV error — a KV outage is treated the same as a miss so it
 * never blocks the request.
 *
 * @example
 * ```ts
 * await getCachedProfileData("dries"); // { username: "dries", ... } | null
 * ```
 */
export async function getCachedProfileData(
  username: string,
): Promise<DrupalProfileData | null> {
  try {
    const cached = await kv.get<DrupalProfileData>(cacheKey(username));
    return cached ?? null;
  } catch {
    return null;
  }
}

/**
 * Cache a scrape result for a username, with a short TTL.
 *
 * Think of this like filing away a fresh copy of a research folder
 * for a little while, so the next request for the same person
 * doesn't need a brand-new trip to go get it.
 *
 * @param username - The drupal.org username to cache the result under.
 * @param data - The raw scrape result to store.
 * @returns Nothing. A KV write failure is swallowed — caching is a
 * best-effort optimization that must never fail the request.
 *
 * @example
 * ```ts
 * await setCachedProfileData("dries", rawData);
 * ```
 */
export async function setCachedProfileData(
  username: string,
  data: DrupalProfileData,
): Promise<void> {
  try {
    await kv.set(cacheKey(username), data, { ex: CACHE_TTL_SECONDS });
  } catch {
    return;
  }
}
