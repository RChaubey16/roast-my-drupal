import type { ProfileFields } from "./parse-profile";
import {
  parseProfilePage,
  parseContributionRecordsTotal,
  parseMostRecentCreditDate,
} from "./parse-profile";
import type { DrupalProfileData } from "./drupal-client";

export interface ContributionStats {
  totalCredits: number;
  securityAdvisoryCredits: number;
  mostRecentCreditDate: string | null;
}

export interface RoastInput {
  username: string;
  accountAgeText: string | null;
  bio: string | null;
  membershipBadge: string | null;
  projectsMaintained: string[];
  totalCredits: number;
  securityAdvisoryCredits: number;
  mostRecentCreditDate: string | null;
}

export function toRoastInput(
  profile: ProfileFields,
  stats: ContributionStats,
): RoastInput {
  return {
    username: profile.username,
    accountAgeText: profile.accountAgeText,
    bio: profile.bio,
    membershipBadge: profile.membershipBadge,
    projectsMaintained: profile.projectsMaintained,
    totalCredits: stats.totalCredits,
    securityAdvisoryCredits: stats.securityAdvisoryCredits,
    mostRecentCreditDate: stats.mostRecentCreditDate,
  };
}

function emptyProfileFields(username: string): ProfileFields {
  return {
    username,
    displayName: username,
    accountAgeText: null,
    country: null,
    bio: null,
    membershipBadge: null,
    currentRoles: [],
    projectsMaintained: [],
  };
}

export function buildRoastInputFromRawData(raw: DrupalProfileData): RoastInput {
  const profile = raw.profileHtml
    ? parseProfilePage(raw.profileHtml)
    : emptyProfileFields(raw.username);

  const totalCredits = raw.contributionRecordsHtml
    ? parseContributionRecordsTotal(raw.contributionRecordsHtml)
    : 0;
  const securityAdvisoryCredits = raw.contributionRecordsSaHtml
    ? parseContributionRecordsTotal(raw.contributionRecordsSaHtml)
    : 0;
  const mostRecentCreditDate = raw.contributionRecordsHtml
    ? parseMostRecentCreditDate(raw.contributionRecordsHtml)
    : null;

  return toRoastInput(profile, {
    totalCredits,
    securityAdvisoryCredits,
    mostRecentCreditDate,
  });
}

const SYSTEM_PROMPT = `You are "Roast My Drupal," a comedy roast generator scoped
strictly to a person's public Drupal.org activity and contribution footprint.

Roast material must come ONLY from the Drupal activity data provided in the
user message: bio phrasing, account age, membership badge status, projects
maintained (or lack thereof), and contribution credit history (total count,
security advisory credits, staleness of most recent credit).

You are not given the person's real name, country, or employer — none of
that exists in your input, so there is nothing to reference. Do not
speculate about or invent personal details. Stay funny, stay scoped to
Drupal, and keep the output as plain text.`;

export function buildRoastPrompt(input: RoastInput): {
  system: string;
  prompt: string;
} {
  const lines = [
    `Username: ${input.username}`,
    `Account age: ${input.accountAgeText ?? "unknown"}`,
    `Bio: ${input.bio ?? "(no bio provided)"}`,
    `Membership badge: ${input.membershipBadge ?? "none"}`,
    `Projects maintained: ${
      input.projectsMaintained.length > 0
        ? input.projectsMaintained.join(", ")
        : "none"
    }`,
    `Total contribution credits: ${input.totalCredits}`,
    `Security advisory credits: ${input.securityAdvisoryCredits}`,
    `Most recent credit date: ${input.mostRecentCreditDate ?? "never"}`,
  ];

  return {
    system: SYSTEM_PROMPT,
    prompt: `Roast this Drupal.org profile:\n\n${lines.join("\n")}`,
  };
}
