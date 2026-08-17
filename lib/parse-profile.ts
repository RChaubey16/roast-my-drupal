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
}

function textOrNull<T extends AnyNode>($el: cheerio.Cheerio<T>): string | null {
  const text = $el.text().replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : null;
}

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

  const projectsMaintained = $(
    ".view-users-maintained-projects .views-field-title",
  )
    .map((_, el) => textOrNull($(el)))
    .get()
    .filter((name): name is string => name !== null);

  return {
    username,
    displayName,
    accountAgeText,
    country,
    bio,
    membershipBadge,
    currentRoles,
    projectsMaintained,
  };
}

export function parseContributionRecordsTotal(html: string): number {
  const $ = cheerio.load(html);
  const headerText = $(".contribution-records-listing header").first().text();
  const match = headerText.match(/of (\d+)/);
  return match ? Number(match[1]) : 0;
}

export function parseMostRecentCreditDate(html: string): string | null {
  const $ = cheerio.load(html);
  const dates = $("time[datetime]")
    .map((_, el) => $(el).attr("datetime"))
    .get()
    .filter((date): date is string => Boolean(date));

  if (dates.length === 0) return null;

  return dates.reduce((latest, date) => (date > latest ? date : latest));
}
