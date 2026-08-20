import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

export interface CurrentRole {
  jobTitle: string;
  organizationName: string;
}

export interface ProfileFields {
  username: string;
  displayName: string;
  accountAgeText: string | null;
  country: string | null;
  bio: string | null;
  membershipBadge: string | null;
  currentRoles: CurrentRole[];
  projectsMaintained: string[];
  maintainedProjectSlugs: string[];
}

/**
 * Extract an element's trimmed text, collapsing internal whitespace.
 *
 * Think of this like tidying up a scanned document before filing it:
 * multiple spaces and line breaks get squashed into one, and a blank
 * page is filed as "nothing" rather than an empty string.
 *
 * @param $el - A Cheerio-wrapped element to read text from.
 * @returns The element's cleaned text, or `null` if it's empty.
 *
 * @example
 * ```ts
 * textOrNull($("  Hello   world  \n")); // "Hello world"
 * textOrNull($("")); // null
 * ```
 */
function textOrNull<T extends AnyNode>($el: cheerio.Cheerio<T>): string | null {
  const text = $el.text().replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : null;
}

/**
 * Parse a drupal.org profile page's HTML into its typed field set.
 *
 * Think of this like reading a paper form and typing the answers
 * into a spreadsheet: each field is pulled from a specific spot on
 * the page and normalized into a consistent shape, with missing
 * fields left as `null` or empty arrays rather than causing errors.
 *
 * @param html - The raw HTML of a `/u/{username}` profile page.
 * @returns The parsed profile fields: display name, username,
 * account age, country, bio, membership badge, current roles, and
 * maintained projects.
 *
 * @example
 * ```ts
 * parseProfilePage(html);
 * // { username: "dries", displayName: "Dries Buytaert", ... }
 * ```
 */
export function parseProfilePage(html: string): ProfileFields {
  const $ = cheerio.load(html);

  const titleMatch = $("#page-title").text().trim().match(/^(.*)\s\((.+)\)$/);
  const displayName = titleMatch?.[1] ?? $("#page-title").text().trim();
  const username = titleMatch?.[2] ?? "";

  const accountAgeParagraph = $("#user-user-full-group-profile-main > p")
    .filter((_, el) => $(el).text().includes("On Drupal.org for"))
    .first()
    .text();
  const accountAgeMatch = accountAgeParagraph.match(/On Drupal\.org for (.+)/);
  const accountAgeText = accountAgeMatch?.[1]?.trim() ?? null;

  const country = textOrNull($(".field-name-field-country .field-item"));

  const bio = textOrNull($(".field-name-field-bio .field-items"));

  const membershipBadge =
    $(".da-membership-badge img").first().attr("alt") ?? null;

  const currentRoles: CurrentRole[] = $(
    ".field-name-field-organizations > .field-items > .field-item",
  )
    .map((_, el) => {
      const $item = $(el);
      const jobTitle = textOrNull($item.find(".field-name-field-job-title"));
      const orgField = $item.find(".field-name-field-organization-name");
      const organizationName =
        orgField.find("img").attr("alt") ?? textOrNull(orgField);
      return jobTitle && organizationName ? { jobTitle, organizationName } : null;
    })
    .get()
    .filter((role): role is CurrentRole => role !== null);

  const maintainedProjects = $(
    ".view-users-maintained-projects .views-field-title",
  )
    .map((_, el) => {
      const name = textOrNull($(el));
      const slug = $(el).find("a").attr("href")?.replace(/^\/project\//, "");
      return name && slug ? { name, slug } : null;
    })
    .get()
    .filter((project): project is { name: string; slug: string } => project !== null);

  const projectsMaintained = maintainedProjects.map((project) => project.name);
  const maintainedProjectSlugs = maintainedProjects.map((project) => project.slug);

  return {
    username,
    displayName,
    accountAgeText,
    country,
    bio,
    membershipBadge,
    currentRoles,
    projectsMaintained,
    maintainedProjectSlugs,
  };
}

/**
 * Read the total item count from a contribution-records page's
 * "Displaying X of Y" header.
 *
 * Think of this like reading "Showing 1-10 of 154 results" at the
 * bottom of a search page: you only care about the 154.
 *
 * @param html - The raw HTML of a `/user/{uid}/contribution-records`
 * page (unfiltered or SA-filtered).
 * @returns The total count, or `0` if the header isn't found.
 *
 * @example
 * ```ts
 * parseContributionRecordsTotal(html); // 154
 * ```
 */
export function parseContributionRecordsTotal(html: string): number {
  const $ = cheerio.load(html);
  const headerText = $(".contribution-records-listing header").first().text();
  const match = headerText.match(/of (\d+)/);
  return match ? Number(match[1]) : 0;
}

/**
 * Find the most recent credit date on a contribution-records page.
 *
 * Think of this like scanning a stack of dated receipts for the
 * newest one: every `<time>` element on the page is a candidate, and
 * the latest ISO date string wins.
 *
 * @param html - The raw HTML of a `/user/{uid}/contribution-records`
 * page.
 * @returns The most recent `datetime` value found, or `null` if the
 * page has no dated records.
 *
 * @example
 * ```ts
 * parseMostRecentCreditDate(html); // "2026-07-14T00:00:00Z"
 * ```
 */
export function parseMostRecentCreditDate(html: string): string | null {
  const $ = cheerio.load(html);
  const dates = $("time[datetime]")
    .map((_, el) => $(el).attr("datetime"))
    .get()
    .filter((date): date is string => Boolean(date));

  if (dates.length === 0) return null;

  return dates.reduce((latest, date) => (date > latest ? date : latest));
}
