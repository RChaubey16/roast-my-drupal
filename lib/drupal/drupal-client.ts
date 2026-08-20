import { getCachedProfileData, setCachedProfileData } from "./cache";
import { parseProfilePage } from "./parse-profile";

const BASE_URL = "https://www.drupal.org";
const USER_AGENT = "RoastMyDrupal/1.0 (+https://github.com/roast-my-drupal)";
const MAX_MODULE_HEALTH_FETCHES = 5;

export interface ModuleHealthPage {
  name: string;
  slug: string;
  html: string | null;
}

export interface DrupalProfileData {
  username: string;
  uid: number | null;
  profileHtml: string | null;
  contributionRecordsHtml: string | null;
  contributionRecordsSaHtml: string | null;
  moduleHealthPages: ModuleHealthPage[];
}

/**
 * Resolve a drupal.org username to its numeric user id (uid).
 *
 * Think of this like looking up someone's employee number from their
 * name in a company directory: the rest of the system needs the
 * number, not the name, to fetch further records.
 *
 * @param username - The drupal.org username to look up.
 * @returns The numeric uid, or `null` if the username doesn't resolve
 * to any user or the lookup request fails.
 *
 * @example
 * ```ts
 * await resolveUidFromUsername("dries"); // 1
 * await resolveUidFromUsername("no-such-user"); // null
 * ```
 */
export async function resolveUidFromUsername(
  username: string,
): Promise<number | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/jsonapi/user/user?filter[name]=${encodeURIComponent(username)}`,
      { headers: { "User-Agent": USER_AGENT } },
    );
    if (!response.ok) return null;

    const body = await response.json();
    return body.data[0]?.attributes?.drupal_internal__uid ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch a drupal.org page's raw HTML, treating any failure as absence.
 *
 * Think of this like knocking on a door: if nobody answers, or the
 * door redirects you to a "please log in" sign, you walk away
 * empty-handed instead of forcing your way in.
 *
 * @param url - The absolute URL of the page to fetch.
 * @returns The page's HTML text, or `null` if the request fails, the
 * response isn't ok, or the response redirected to the login page
 * (an access-restricted profile).
 *
 * @example
 * ```ts
 * await fetchHtmlPage("https://www.drupal.org/u/dries"); // "<html>...</html>"
 * ```
 */
async function fetchHtmlPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok) return null;
    if (response.redirected && new URL(response.url).pathname.startsWith("/user/login")) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Scrape a drupal.org user's public footprint: the profile page, both
 * contribution-records views (unfiltered and security-advisory-only),
 * and up to 5 of the user's maintained-project pages (for module
 * health). Checks the cache first, so a repeat request for the same
 * username within the cache TTL skips drupal.org entirely.
 *
 * Think of this like sending three records requests at once, but
 * only after you know which file cabinet (uid) to pull from — if the
 * person isn't in the directory at all, you skip the trip entirely.
 * Which project files to also request only becomes known once the
 * profile file itself comes back, so those requests go out in a
 * second wave. And before any of that, you check whether someone
 * already pulled this exact file recently.
 *
 * @param username - The drupal.org username to scrape.
 * @returns The raw HTML for each page (`null` per field if that
 * fetch failed or was access-restricted), plus the resolved `uid`
 * (`null` if the username didn't resolve to any user, in which case
 * every HTML field is also `null` and `moduleHealthPages` is empty).
 *
 * @example
 * ```ts
 * await fetchDrupalProfileData("dries");
 * // { username: "dries", uid: 1, profileHtml: "...", contributionRecordsHtml: "...", contributionRecordsSaHtml: "...", moduleHealthPages: [...] }
 * ```
 */
export async function fetchDrupalProfileData(
  username: string,
): Promise<DrupalProfileData> {
  const cached = await getCachedProfileData(username);
  if (cached) return cached;

  const uid = await resolveUidFromUsername(username);
  if (uid === null) {
    const result: DrupalProfileData = {
      username,
      uid: null,
      profileHtml: null,
      contributionRecordsHtml: null,
      contributionRecordsSaHtml: null,
      moduleHealthPages: [],
    };
    await setCachedProfileData(username, result);
    return result;
  }

  const [profileHtml, contributionRecordsHtml, contributionRecordsSaHtml] =
    await Promise.all([
      fetchHtmlPage(`${BASE_URL}/u/${encodeURIComponent(username)}`),
      fetchHtmlPage(`${BASE_URL}/user/${uid}/contribution-records`),
      fetchHtmlPage(
        `${BASE_URL}/user/${uid}/contribution-records?field_is_sa_value=1`,
      ),
    ]);

  // Which project slugs to fetch depends on parsing the profile page we
  // just fetched, so this second wave can't join the Promise.all above.
  const profile = profileHtml ? parseProfilePage(profileHtml) : null;
  const maintainedProjects = profile
    ? profile.projectsMaintained.map((name, i) => ({
        name,
        slug: profile.maintainedProjectSlugs[i],
      }))
    : [];
  const projectsToFetch = maintainedProjects.slice(0, MAX_MODULE_HEALTH_FETCHES);

  const moduleHealthHtml = await Promise.all(
    projectsToFetch.map((project) =>
      fetchHtmlPage(`${BASE_URL}/project/${project.slug}`),
    ),
  );
  const moduleHealthPages: ModuleHealthPage[] = projectsToFetch.map(
    (project, i) => ({
      name: project.name,
      slug: project.slug,
      html: moduleHealthHtml[i],
    }),
  );

  const result: DrupalProfileData = {
    username,
    uid,
    profileHtml,
    contributionRecordsHtml,
    contributionRecordsSaHtml,
    moduleHealthPages,
  };
  await setCachedProfileData(username, result);
  return result;
}
