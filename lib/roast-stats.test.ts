import { describe, expect, it } from "vitest";
import type { RoastInput } from "./build-roast-prompt";
import { encodeRoastStatsHeader, decodeRoastStatsHeader } from "./roast-stats";

const fullInput: RoastInput = {
  username: "dries",
  accountAgeText: "25 years 4 months",
  bio: "Founder and Project Lead of Drupal",
  membershipBadge: "Top Tier Drupal Certified Partner",
  projectsMaintained: ["Acquia Connector", "Cloud"],
  totalCredits: 154,
  securityAdvisoryCredits: 3,
  mostRecentCreditDate: "2026-06-01",
};

describe("encodeRoastStatsHeader / decodeRoastStatsHeader", () => {
  it("round-trips a full RoastInput through encode then decode", () => {
    const header = encodeRoastStatsHeader(fullInput);
    const decoded = decodeRoastStatsHeader(header);

    expect(decoded).toEqual({
      username: "dries",
      accountAgeText: "25 years 4 months",
      membershipBadge: "Top Tier Drupal Certified Partner",
      projectsMaintained: ["Acquia Connector", "Cloud"],
      totalCredits: 154,
      securityAdvisoryCredits: 3,
      mostRecentCreditDate: "2026-06-01",
    });
  });

  it("round-trips non-ASCII project names", () => {
    const header = encodeRoastStatsHeader({
      ...fullInput,
      projectsMaintained: ["Décor Module", "日本語プロジェクト"],
    });

    expect(decodeRoastStatsHeader(header)?.projectsMaintained).toEqual([
      "Décor Module",
      "日本語プロジェクト",
    ]);
  });

  it("returns null for a null header", () => {
    expect(decodeRoastStatsHeader(null)).toBeNull();
  });

  it("returns null for a header that isn't valid base64", () => {
    expect(decodeRoastStatsHeader("not-valid-base64!!!")).toBeNull();
  });

  it("returns null for a header that decodes to invalid JSON", () => {
    const header = btoa("not json");
    expect(decodeRoastStatsHeader(header)).toBeNull();
  });

  it("returns null for a header that decodes to the wrong shape", () => {
    const header = btoa(JSON.stringify({ foo: "bar" }));
    expect(decodeRoastStatsHeader(header)).toBeNull();
  });
});
