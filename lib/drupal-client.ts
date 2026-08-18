const BASE_URL = "https://www.drupal.org";
const USER_AGENT = "RoastMyDrupal/1.0 (+https://github.com/roast-my-drupal)";

export interface DrupalProfileData {
  username: string;
  uid: number | null;
  profileHtml: string | null;
  contributionRecordsHtml: string | null;
  contributionRecordsSaHtml: string | null;
}

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

export async function fetchDrupalProfileData(
  username: string,
): Promise<DrupalProfileData> {
  const uid = await resolveUidFromUsername(username);
  if (uid === null) {
    return {
      username,
      uid: null,
      profileHtml: null,
      contributionRecordsHtml: null,
      contributionRecordsSaHtml: null,
    };
  }

  const [profileHtml, contributionRecordsHtml, contributionRecordsSaHtml] =
    await Promise.all([
      fetchHtmlPage(`${BASE_URL}/u/${encodeURIComponent(username)}`),
      fetchHtmlPage(`${BASE_URL}/user/${uid}/contribution-records`),
      fetchHtmlPage(
        `${BASE_URL}/user/${uid}/contribution-records?field_is_sa_value=1`,
      ),
    ]);

  return {
    username,
    uid,
    profileHtml,
    contributionRecordsHtml,
    contributionRecordsSaHtml,
  };
}
