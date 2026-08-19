import { describe, expect, it } from "vitest";
import { formatCreditDate } from "./format-date";

describe("formatCreditDate", () => {
  it("formats an ISO datetime as a short human-readable date", () => {
    expect(formatCreditDate("2025-09-01T07:34:05+00:00")).toBe("Sep 1, 2025");
  });

  it("formats a date near midnight UTC without shifting to the previous day", () => {
    expect(formatCreditDate("2026-01-01T00:15:00+00:00")).toBe("Jan 1, 2026");
  });

  it("falls back to the raw string when it isn't a parseable date", () => {
    expect(formatCreditDate("not-a-date")).toBe("not-a-date");
  });
});
