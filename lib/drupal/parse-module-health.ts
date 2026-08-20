import * as cheerio from "cheerio";

export interface ModuleHealth {
  lastReleaseDate: string | null;
  openIssueCount: number;
}

/**
 * Parse a drupal.org `/project/{name}` page's HTML into its module
 * health fields: the recommended release's date and the open issue
 * count.
 *
 * Think of this like skimming a product listing page for two
 * numbers: when it last shipped, and how big its support backlog is.
 * A project with no recommended release (e.g. one folded into Drupal
 * core, or abandoned) simply has no date to report.
 *
 * @param html - The raw HTML of a `/project/{name}` page.
 * @returns The recommended release date as its on-page display text
 * (`null` if the project has no recommended release), and the open
 * issue count (`0` if the page has no issue queue section).
 *
 * @example
 * ```ts
 * parseModuleHealthPage(html); // { lastReleaseDate: "9 January 2026", openIssueCount: 459 }
 * ```
 */
export function parseModuleHealthPage(html: string): ModuleHealth {
  const $ = cheerio.load(html);

  const releaseText = $(
    ".view-display-id-recommended .views-field-created .field-content",
  )
    .first()
    .text()
    .trim();
  const releaseMatch = releaseText.match(/released (.+)/);
  const lastReleaseDate = releaseMatch?.[1]?.trim() ?? null;

  const openIssuesText = $(".issue-cockpit-All .issue-cockpit-totals a")
    .first()
    .text();
  const openIssuesMatch = openIssuesText.match(/^([\d,]+) open/);
  const openIssueCount = openIssuesMatch
    ? Number(openIssuesMatch[1].replace(/,/g, ""))
    : 0;

  return { lastReleaseDate, openIssueCount };
}
