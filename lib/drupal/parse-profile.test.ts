import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  parseProfilePage,
  parseContributionRecordsTotal,
  parseMostRecentCreditDate,
} from "./parse-profile";

function fixture(name: string) {
  return readFileSync(
    path.join(__dirname, "__fixtures__", name),
    "utf-8",
  );
}

describe("parseProfilePage", () => {
  it("parses a fully-populated profile", () => {
    const html = fixture("dries-profile.html");

    const profile = parseProfilePage(html);

    expect(profile.username).toBe("dries");
    expect(profile.displayName).toBe("Dries Buytaert");
    expect(profile.accountAgeText).toBe("25 years 4 months");
    expect(profile.country).toBe("Belgium");
    expect(profile.bio).toContain("Founder and Project Lead of Drupal");
    expect(profile.membershipBadge).toBe("Top Tier Drupal Certified Partner");
    expect(profile.currentRoles).toContainEqual({
      jobTitle: "Co-founder, CTO and CSO",
      organizationName: "Acquia",
    });
    expect(profile.projectsMaintained).toContain("Acquia Connector");
    expect(profile.projectsMaintained.length).toBeGreaterThan(0);
    expect(profile.maintainedProjectSlugs).toContain("acquia_connector");
    expect(profile.maintainedProjectSlugs.length).toBe(
      profile.projectsMaintained.length,
    );
  });

  it("parses a sparse profile with no bio or maintained projects", () => {
    const html = fixture("kjartan-profile.html");

    const profile = parseProfilePage(html);

    expect(profile.username).toBe("Kjartan");
    expect(profile.displayName).toBe("Kjartan Mannes");
    expect(profile.bio).toBeNull();
    expect(profile.projectsMaintained).toEqual([]);
    expect(profile.maintainedProjectSlugs).toEqual([]);
  });
});

describe("parseContributionRecordsTotal", () => {
  it("reads the total off the 'Displaying X - Y of N' header", () => {
    const html = fixture("dries-contribution-records.html");

    expect(parseContributionRecordsTotal(html)).toBe(154);
  });

  it("returns 0 when the page shows 'No results were found.'", () => {
    const html = fixture("kjartan-contribution-records.html");

    expect(parseContributionRecordsTotal(html)).toBe(0);
  });

  it("reads the security-advisory-only total from the field_is_sa_value=1 variant", () => {
    const html = fixture("dries-contribution-records-sa.html");

    expect(parseContributionRecordsTotal(html)).toBe(1);
  });
});

describe("parseMostRecentCreditDate", () => {
  it("returns the max datetime among record entries", () => {
    const html = fixture("dries-contribution-records.html");

    expect(parseMostRecentCreditDate(html)).toBe("2026-07-28T09:55:03+00:00");
  });

  it("returns null when there are no records", () => {
    const html = fixture("kjartan-contribution-records.html");

    expect(parseMostRecentCreditDate(html)).toBeNull();
  });
});
