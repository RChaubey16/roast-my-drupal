import type { ProfileFields } from "../drupal/parse-profile";
import {
  parseProfilePage,
  parseContributionRecordsTotal,
  parseMostRecentCreditDate,
} from "../drupal/parse-profile";
import type { DrupalProfileData } from "../drupal/drupal-client";

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

/**
 * Combine parsed profile fields and contribution stats into the
 * Drupal-activity-only shape the roast prompt is built from.
 *
 * Think of this like assembling a case file from two separate
 * folders: only the fields relevant to the "case" (Drupal activity)
 * make it in — personal details like real name or country are left
 * out of the folder entirely.
 *
 * @param profile - Parsed profile page fields.
 * @param stats - Parsed contribution-record stats.
 * @returns A `RoastInput` containing only Drupal-activity-scoped data.
 *
 * @example
 * ```ts
 * toRoastInput(profileFields, stats);
 * // { username: "dries", totalCredits: 154, ... }
 * ```
 */
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

/**
 * Build an all-empty `ProfileFields` for a user whose profile page
 * couldn't be fetched.
 *
 * Think of this like handing back a blank intake form instead of no
 * form at all: downstream code can keep treating the shape the same
 * way, just with every field empty.
 *
 * @param username - The username to stamp onto the empty fields.
 * @returns A `ProfileFields` object with every field `null` or empty
 * except `username` and `displayName`.
 *
 * @example
 * ```ts
 * emptyProfileFields("dries");
 * // { username: "dries", displayName: "dries", bio: null, ... }
 * ```
 */
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

/**
 * Turn raw scraped HTML (or nulls, for failed fetches) into a
 * complete `RoastInput`, degrading gracefully per missing field.
 *
 * Think of this like a claims adjuster working from whatever
 * paperwork actually arrived: if a document is missing, that section
 * of the file is filled in with a sensible default instead of
 * blocking the whole case.
 *
 * @param raw - The raw scrape result from `fetchDrupalProfileData`,
 * where any HTML field may be `null` if that fetch failed.
 * @returns A complete `RoastInput`, with `0`/`null` defaults for any
 * data that couldn't be scraped.
 *
 * @example
 * ```ts
 * buildRoastInputFromRawData(raw);
 * // { username: "dries", totalCredits: 154, ... }
 * ```
 */
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

/**
 * Turn a `RoastInput` into the system + user prompt payload for the
 * LLM call.
 *
 * Think of this like filling out a comedy writer's briefing sheet:
 * the system prompt sets the ground rules (stay on-topic, stay
 * funny), and the user prompt lists just the facts to work with.
 *
 * @param input - The Drupal-activity-only roast input to describe.
 * @returns An object with `system` (the fixed system prompt) and
 * `prompt` (the per-user fact sheet built from `input`).
 *
 * @example
 * ```ts
 * buildRoastPrompt(input);
 * // { system: "You are \"Roast My Drupal\"...", prompt: "Roast this Drupal.org profile:\n\n..." }
 * ```
 */
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
