import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rate-limiter";

describe("checkRateLimit", () => {
  it("allows requests under the threshold", () => {
    const ip = "1.1.1.1";
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(ip, 0).allowed).toBe(true);
    }
  });

  it("blocks the request once the threshold is exceeded within the window", () => {
    const ip = "2.2.2.2";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip, 0);
    }

    const result = checkRateLimit(ip, 0);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the window once it has elapsed", () => {
    const ip = "3.3.3.3";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip, 0);
    }
    expect(checkRateLimit(ip, 0).allowed).toBe(false);

    expect(checkRateLimit(ip, 60_001).allowed).toBe(true);
  });

  it("tracks separate buckets per IP", () => {
    const busyIp = "4.4.4.4";
    const freshIp = "5.5.5.5";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(busyIp, 0);
    }
    expect(checkRateLimit(busyIp, 0).allowed).toBe(false);

    expect(checkRateLimit(freshIp, 0).allowed).toBe(true);
  });

  it("reports a retryAfterSeconds counting down to the window's end", () => {
    const ip = "6.6.6.6";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip, 0);
    }

    const result = checkRateLimit(ip, 45_000);

    expect(result.retryAfterSeconds).toBe(15);
  });
});
