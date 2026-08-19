import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolveUidFromUsername,
  fetchDrupalProfileData,
} from "./drupal-client";
import * as cache from "./cache";

vi.mock("./cache", () => ({
  getCachedProfileData: vi.fn(),
  setCachedProfileData: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(cache.getCachedProfileData).mockResolvedValue(null);
  vi.mocked(cache.setCachedProfileData).mockResolvedValue(undefined);
});

function jsonApiResponse(uid: number | null) {
  return {
    data: uid === null ? [] : [{ attributes: { drupal_internal__uid: uid } }],
  };
}

function okResponse(body: string, opts: { redirected?: boolean; url?: string } = {}) {
  return {
    ok: true,
    redirected: opts.redirected ?? false,
    url: opts.url ?? "https://www.drupal.org/",
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(JSON.parse(body)),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("resolveUidFromUsername", () => {
  it("returns the uid from the JSON:API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(jsonApiResponse(1)),
      }),
    );

    await expect(resolveUidFromUsername("dries")).resolves.toBe(1);
  });

  it("returns null when the username doesn't resolve to any user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(jsonApiResponse(null)),
      }),
    );

    await expect(resolveUidFromUsername("nonexistent-user")).resolves.toBeNull();
  });

  it("returns null when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(resolveUidFromUsername("dries")).resolves.toBeNull();
  });
});

describe("fetchDrupalProfileData", () => {
  it("fetches profile + contribution-records (unfiltered and SA-filtered) once uid resolves", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("jsonapi")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(jsonApiResponse(1)),
        });
      }
      if (url.includes("field_is_sa_value=1")) {
        return Promise.resolve(okResponse("<html>sa-only</html>"));
      }
      if (url.includes("contribution-records")) {
        return Promise.resolve(okResponse("<html>all-records</html>"));
      }
      return Promise.resolve(okResponse("<html>profile</html>"));
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDrupalProfileData("dries");

    expect(result).toEqual({
      username: "dries",
      uid: 1,
      profileHtml: "<html>profile</html>",
      contributionRecordsHtml: "<html>all-records</html>",
      contributionRecordsSaHtml: "<html>sa-only</html>",
    });
  });

  it("skips page fetches and returns all-null data when the username doesn't resolve", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(jsonApiResponse(null)),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDrupalProfileData("nonexistent-user");

    expect(result).toEqual({
      username: "nonexistent-user",
      uid: null,
      profileHtml: null,
      contributionRecordsHtml: null,
      contributionRecordsSaHtml: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("degrades gracefully when the profile page redirects to the login page (access-restricted)", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("jsonapi")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(jsonApiResponse(3871230)),
        });
      }
      if (url.includes("field_is_sa_value=1")) {
        return Promise.resolve(okResponse("<html>sa-only</html>"));
      }
      if (url.includes("contribution-records")) {
        return Promise.resolve(okResponse("<html>all-records</html>"));
      }
      return Promise.resolve(
        okResponse("<html>login page</html>", {
          redirected: true,
          url: "https://www.drupal.org/user/login?destination=user/3871230",
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDrupalProfileData("pooja_vyas");

    expect(result.uid).toBe(3871230);
    expect(result.profileHtml).toBeNull();
    expect(result.contributionRecordsHtml).toBe("<html>all-records</html>");
    expect(result.contributionRecordsSaHtml).toBe("<html>sa-only</html>");
  });

  it("degrades gracefully when one fetch throws, keeping the others", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("jsonapi")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(jsonApiResponse(1)),
        });
      }
      if (url.includes("field_is_sa_value=1")) {
        return Promise.reject(new Error("network down"));
      }
      if (url.includes("contribution-records")) {
        return Promise.resolve(okResponse("<html>all-records</html>"));
      }
      return Promise.resolve(okResponse("<html>profile</html>"));
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDrupalProfileData("dries");

    expect(result.profileHtml).toBe("<html>profile</html>");
    expect(result.contributionRecordsHtml).toBe("<html>all-records</html>");
    expect(result.contributionRecordsSaHtml).toBeNull();
  });

  it("returns the cached result and skips scraping entirely on a cache hit", async () => {
    const cachedResult = {
      username: "dries",
      uid: 1,
      profileHtml: "<html>cached-profile</html>",
      contributionRecordsHtml: "<html>cached-records</html>",
      contributionRecordsSaHtml: "<html>cached-sa</html>",
    };
    vi.mocked(cache.getCachedProfileData).mockResolvedValue(cachedResult);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDrupalProfileData("dries");

    expect(result).toEqual(cachedResult);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cache.setCachedProfileData).not.toHaveBeenCalled();
  });

  it("caches the freshly scraped result on a cache miss", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("jsonapi")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(jsonApiResponse(1)),
        });
      }
      if (url.includes("field_is_sa_value=1")) {
        return Promise.resolve(okResponse("<html>sa-only</html>"));
      }
      if (url.includes("contribution-records")) {
        return Promise.resolve(okResponse("<html>all-records</html>"));
      }
      return Promise.resolve(okResponse("<html>profile</html>"));
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDrupalProfileData("dries");

    expect(cache.setCachedProfileData).toHaveBeenCalledWith("dries", result);
  });

  it("caches an unresolved-username result too, so a repeat lookup for the same bad username also skips the network", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(jsonApiResponse(null)),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDrupalProfileData("nonexistent-user");

    expect(cache.setCachedProfileData).toHaveBeenCalledWith(
      "nonexistent-user",
      result,
    );
  });
});
