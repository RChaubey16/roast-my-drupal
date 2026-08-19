import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fetchDrupalProfileData } from "./drupal-client";
import {
  parseProfilePage,
  parseContributionRecordsTotal,
  parseMostRecentCreditDate,
} from "./parse-profile";

function fixture(name: string) {
  return readFileSync(path.join(__dirname, "__fixtures__", name), "utf-8");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetchForUser(uid: number, files: {
  profile: string;
  records: string;
  recordsSa: string;
}) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("jsonapi")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ data: [{ attributes: { drupal_internal__uid: uid } }] }),
        });
      }
      if (url.includes("field_is_sa_value=1")) {
        return Promise.resolve({
          ok: true,
          redirected: false,
          url: "",
          text: () => Promise.resolve(fixture(files.recordsSa)),
        });
      }
      if (url.includes("contribution-records")) {
        return Promise.resolve({
          ok: true,
          redirected: false,
          url: "",
          text: () => Promise.resolve(fixture(files.records)),
        });
      }
      return Promise.resolve({
        ok: true,
        redirected: false,
        url: "",
        text: () => Promise.resolve(fixture(files.profile)),
      });
    }),
  );
}

describe("username to roast input, end to end", () => {
  it("produces the full field set for a prolific user (dries)", async () => {
    stubFetchForUser(1, {
      profile: "dries-profile.html",
      records: "dries-contribution-records.html",
      recordsSa: "dries-contribution-records-sa.html",
    });

    const raw = await fetchDrupalProfileData("dries");
    const profile = parseProfilePage(raw.profileHtml!);
    const totalCredits = parseContributionRecordsTotal(raw.contributionRecordsHtml!);
    const securityAdvisoryCredits = parseContributionRecordsTotal(
      raw.contributionRecordsSaHtml!,
    );
    const mostRecentCreditDate = parseMostRecentCreditDate(raw.contributionRecordsHtml!);

    expect(profile.username).toBe("dries");
    expect(profile.projectsMaintained.length).toBeGreaterThan(0);
    expect(totalCredits).toBe(154);
    expect(securityAdvisoryCredits).toBe(1);
    expect(mostRecentCreditDate).toBe("2026-07-28T09:55:03+00:00");
  });

  it("produces a sparse-but-valid field set for a near-empty user (Kjartan)", async () => {
    stubFetchForUser(2, {
      profile: "kjartan-profile.html",
      records: "kjartan-contribution-records.html",
      recordsSa: "kjartan-contribution-records.html",
    });

    const raw = await fetchDrupalProfileData("Kjartan");
    const profile = parseProfilePage(raw.profileHtml!);
    const totalCredits = parseContributionRecordsTotal(raw.contributionRecordsHtml!);
    const mostRecentCreditDate = parseMostRecentCreditDate(raw.contributionRecordsHtml!);

    expect(profile.username).toBe("Kjartan");
    expect(profile.bio).toBeNull();
    expect(profile.projectsMaintained).toEqual([]);
    expect(totalCredits).toBe(0);
    expect(mostRecentCreditDate).toBeNull();
  });
});
