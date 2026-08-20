import { describe, expect, it } from "vitest";
import type { ProfileFields } from "../drupal/parse-profile";
import type { DrupalProfileData } from "../drupal/drupal-client";
import {
  toRoastInput,
  buildRoastPrompt,
  buildRoastInputFromRawData,
} from "./build-roast-prompt";
import { readFileSync } from "node:fs";
import path from "node:path";

function fixture(name: string) {
  return readFileSync(path.join(__dirname, "../drupal/__fixtures__", name), "utf-8");
}

const fullProfile: ProfileFields = {
  username: "dries",
  displayName: "Dries Buytaert",
  accountAgeText: "25 years 4 months",
  country: "Belgium",
  bio: "Founder and Project Lead of Drupal",
  membershipBadge: "Top Tier Drupal Certified Partner",
  currentRoles: [{ jobTitle: "Co-founder, CTO and CSO", organizationName: "Acquia" }],
  projectsMaintained: ["Acquia Connector", "Cloud"],
  maintainedProjectSlugs: ["acquia_connector", "cloud"],
};

describe("toRoastInput", () => {
  it("keeps only Drupal-activity fields, dropping personal details", () => {
    const input = toRoastInput(fullProfile, {
      totalCredits: 154,
      securityAdvisoryCredits: 1,
      mostRecentCreditDate: "2026-07-28T09:55:03+00:00",
    });

    expect(input).toEqual({
      username: "dries",
      accountAgeText: "25 years 4 months",
      bio: "Founder and Project Lead of Drupal",
      membershipBadge: "Top Tier Drupal Certified Partner",
      projectsMaintained: ["Acquia Connector", "Cloud"],
      totalCredits: 154,
      securityAdvisoryCredits: 1,
      mostRecentCreditDate: "2026-07-28T09:55:03+00:00",
      moduleHealth: [],
    });
    expect(input).not.toHaveProperty("displayName");
    expect(input).not.toHaveProperty("country");
    expect(input).not.toHaveProperty("currentRoles");
  });

  it("carries through module health data when given", () => {
    const input = toRoastInput(
      fullProfile,
      {
        totalCredits: 154,
        securityAdvisoryCredits: 1,
        mostRecentCreditDate: "2026-07-28T09:55:03+00:00",
      },
      [{ name: "Acquia Connector", lastReleaseDate: "9 January 2026", openIssueCount: 5 }],
    );

    expect(input.moduleHealth).toEqual([
      { name: "Acquia Connector", lastReleaseDate: "9 January 2026", openIssueCount: 5 },
    ]);
  });
});

describe("buildRoastPrompt", () => {
  const input = toRoastInput(fullProfile, {
    totalCredits: 154,
    securityAdvisoryCredits: 1,
    mostRecentCreditDate: "2026-07-28T09:55:03+00:00",
  });

  it("scopes the system prompt to Drupal activity only, with no personal data in scope", () => {
    const { system } = buildRoastPrompt(input);

    expect(system).toMatch(/drupal/i);
    expect(system).not.toContain("Dries Buytaert");
    expect(system).not.toContain("Belgium");
  });

  it("embeds the roast input's Drupal activity data into the user prompt", () => {
    const { prompt } = buildRoastPrompt(input);

    expect(prompt).toContain("dries");
    expect(prompt).toContain("Founder and Project Lead of Drupal");
    expect(prompt).toContain("Acquia Connector");
    expect(prompt).toContain("154");
  });

  it("never leaks the real name or country, because RoastInput structurally excludes them", () => {
    const { system, prompt } = buildRoastPrompt(input);

    expect(system + prompt).not.toContain("Dries Buytaert");
    expect(system + prompt).not.toContain("Belgium");
  });

  it("produces the same system prompt with no mode, 'default', and an unknown mode id", () => {
    const noMode = buildRoastPrompt(input);
    const explicitDefault = buildRoastPrompt(input, "default");
    const unknownMode = buildRoastPrompt(input, "not-a-real-mode");

    expect(explicitDefault.system).toBe(noMode.system);
    expect(unknownMode.system).toBe(noMode.system);
  });

  it("blends the persona prompt into the system prompt for a celebrity mode", () => {
    const { system } = buildRoastPrompt(input, "kevin-hart");

    expect(system).toContain("Kevin Hart");
    expect(system).toMatch(/drupal/i);
  });

  it("embeds module health data into the user prompt when present", () => {
    const inputWithHealth = toRoastInput(
      fullProfile,
      {
        totalCredits: 154,
        securityAdvisoryCredits: 1,
        mostRecentCreditDate: "2026-07-28T09:55:03+00:00",
      },
      [{ name: "Acquia Connector", lastReleaseDate: "9 January 2026", openIssueCount: 5 }],
    );

    const { prompt } = buildRoastPrompt(inputWithHealth);

    expect(prompt).toContain("Acquia Connector");
    expect(prompt).toContain("9 January 2026");
    expect(prompt).toContain("5");
  });

  it("shows 'none' for module health in the user prompt when there is none", () => {
    const { prompt } = buildRoastPrompt(input);

    expect(prompt).toMatch(/module health.*none/i);
  });
});

describe("buildRoastInputFromRawData", () => {
  it("builds a full RoastInput when all three fetches succeeded", () => {
    const raw: DrupalProfileData = {
      username: "dries",
      uid: 1,
      profileHtml: fixture("dries-profile.html"),
      contributionRecordsHtml: fixture("dries-contribution-records.html"),
      contributionRecordsSaHtml: fixture("dries-contribution-records-sa.html"),
      moduleHealthPages: [],
    };

    const input = buildRoastInputFromRawData(raw);

    expect(input.username).toBe("dries");
    expect(input.projectsMaintained.length).toBeGreaterThan(0);
    expect(input.totalCredits).toBe(154);
    expect(input.securityAdvisoryCredits).toBe(1);
    expect(input.mostRecentCreditDate).toBe("2026-07-28T09:55:03+00:00");
  });

  it("falls back to the submitted username with empty Drupal fields when the profile page is inaccessible", () => {
    const raw: DrupalProfileData = {
      username: "pooja_vyas",
      uid: 3871230,
      profileHtml: null,
      contributionRecordsHtml: fixture("kjartan-contribution-records.html"),
      contributionRecordsSaHtml: fixture("kjartan-contribution-records.html"),
      moduleHealthPages: [],
    };

    const input = buildRoastInputFromRawData(raw);

    expect(input.username).toBe("pooja_vyas");
    expect(input.bio).toBeNull();
    expect(input.accountAgeText).toBeNull();
    expect(input.membershipBadge).toBeNull();
    expect(input.projectsMaintained).toEqual([]);
    expect(input.totalCredits).toBe(0);
    expect(input.moduleHealth).toEqual([]);
  });

  it("defaults contribution stats to zero/null when both contribution-records fetches failed", () => {
    const raw: DrupalProfileData = {
      username: "dries",
      uid: 1,
      profileHtml: fixture("dries-profile.html"),
      contributionRecordsHtml: null,
      contributionRecordsSaHtml: null,
      moduleHealthPages: [],
    };

    const input = buildRoastInputFromRawData(raw);

    expect(input.username).toBe("dries");
    expect(input.projectsMaintained.length).toBeGreaterThan(0);
    expect(input.totalCredits).toBe(0);
    expect(input.securityAdvisoryCredits).toBe(0);
    expect(input.mostRecentCreditDate).toBeNull();
  });

  it("includes module health for up to 5 maintained projects, unit-tested against fixtures", () => {
    const raw: DrupalProfileData = {
      username: "dries",
      uid: 1,
      profileHtml: fixture("dries-profile.html"),
      contributionRecordsHtml: fixture("dries-contribution-records.html"),
      contributionRecordsSaHtml: fixture("dries-contribution-records-sa.html"),
      moduleHealthPages: [
        { name: "Token", slug: "token", html: fixture("token-project.html") },
        { name: "Views", slug: "views", html: fixture("views-project.html") },
      ],
    };

    const input = buildRoastInputFromRawData(raw);

    expect(input.moduleHealth).toEqual([
      { name: "Token", lastReleaseDate: "9 January 2026", openIssueCount: 459 },
      { name: "Views", lastReleaseDate: null, openIssueCount: 1736 },
    ]);
  });

  it("omits a project's health data, not a hard error, when that project's page fetch failed", () => {
    const raw: DrupalProfileData = {
      username: "dries",
      uid: 1,
      profileHtml: fixture("dries-profile.html"),
      contributionRecordsHtml: fixture("dries-contribution-records.html"),
      contributionRecordsSaHtml: fixture("dries-contribution-records-sa.html"),
      moduleHealthPages: [
        { name: "Token", slug: "token", html: fixture("token-project.html") },
        { name: "Broken Module", slug: "broken", html: null },
      ],
    };

    const input = buildRoastInputFromRawData(raw);

    expect(input.moduleHealth).toEqual([
      { name: "Token", lastReleaseDate: "9 January 2026", openIssueCount: 459 },
    ]);
  });

  it("produces an empty moduleHealth array for a user with zero maintained projects", () => {
    const raw: DrupalProfileData = {
      username: "Kjartan",
      uid: 2,
      profileHtml: fixture("kjartan-profile.html"),
      contributionRecordsHtml: fixture("kjartan-contribution-records.html"),
      contributionRecordsSaHtml: fixture("kjartan-contribution-records.html"),
      moduleHealthPages: [],
    };

    const input = buildRoastInputFromRawData(raw);

    expect(input.moduleHealth).toEqual([]);
  });
});
