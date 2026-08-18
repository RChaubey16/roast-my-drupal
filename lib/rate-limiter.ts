import { LRUCache } from "lru-cache";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_TRACKED_IPS = 5_000;

interface Bucket {
  count: number;
  windowStart: number;
}

// Bounded by size (not by lru-cache's own ttl, which runs on real
// wall-clock time and would fight the injected `now` used in tests) so a
// long-lived instance can't accumulate one entry per IP forever.
const buckets = new LRUCache<string, Bucket>({ max: MAX_TRACKED_IPS });

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Check (and record) whether a client is within its request quota for
 * the current fixed time window.
 *
 * Think of this like a bouncer with a clipboard: each IP gets a fresh
 * tally sheet every 60 seconds, and once they've used up their 5
 * marks for that sheet, they're turned away until the next sheet
 * starts.
 *
 * @param ip - The client identifier (typically an IP address) to
 * track requests for.
 * @param now - The current time in epoch milliseconds. Defaults to
 * `Date.now()`; pass an explicit value in tests for determinism.
 * @returns `{ allowed: true, retryAfterSeconds: 0 }` if the request
 * is within quota (and records it), or `{ allowed: false,
 * retryAfterSeconds }` if the client has exceeded the quota for the
 * current window, where `retryAfterSeconds` is how long until the
 * window resets.
 *
 * @example
 * ```ts
 * checkRateLimit("1.2.3.4"); // { allowed: true, retryAfterSeconds: 0 }
 * ```
 */
export function checkRateLimit(ip: string, now: number = Date.now()): RateLimitResult {
  const bucket = buckets.get(ip);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
