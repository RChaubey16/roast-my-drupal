import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();

vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
      return Promise.resolve("OK");
    }),
  },
}));

import { kv } from "@vercel/kv";
import { fetchDrupalProfileData } from "./drupal-client";

function okResponse(body: string) {
  return {
    ok: true,
    redirected: false,
    url: "https://www.drupal.org/",
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(JSON.parse(body)),
  };
}

function stubScrapeFetch() {
  return vi.fn((url: string) => {
    if (url.includes("jsonapi")) {
      return Promise.resolve(
        okResponse(
          JSON.stringify({ data: [{ attributes: { drupal_internal__uid: 1 } }] }),
        ),
      );
    }
    if (url.includes("field_is_sa_value=1")) {
      return Promise.resolve(okResponse("<html>sa-only</html>"));
    }
    if (url.includes("contribution-records")) {
      return Promise.resolve(okResponse("<html>all-records</html>"));
    }
    return Promise.resolve(okResponse("<html>profile</html>"));
  });
}

beforeEach(() => {
  store.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("fetchDrupalProfileData + cache integration", () => {
  it("scrapes only once across two requests for the same username, serving the second from cache", async () => {
    const fetchMock = stubScrapeFetch();
    vi.stubGlobal("fetch", fetchMock);

    const first = await fetchDrupalProfileData("dries");
    const fetchCallsAfterFirstRequest = fetchMock.mock.calls.length;
    const second = await fetchDrupalProfileData("dries");

    expect(second).toEqual(first);
    expect(fetchMock.mock.calls.length).toBe(fetchCallsAfterFirstRequest);
  });

  it("still completes the request via a live scrape when the KV store is unreachable", async () => {
    vi.mocked(kv.get).mockRejectedValue(new Error("KV unreachable"));
    vi.mocked(kv.set).mockRejectedValue(new Error("KV unreachable"));
    const fetchMock = stubScrapeFetch();
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDrupalProfileData("dries");

    expect(result.profileHtml).toBe("<html>profile</html>");
    expect(result.contributionRecordsHtml).toBe("<html>all-records</html>");
    expect(result.contributionRecordsSaHtml).toBe("<html>sa-only</html>");
  });
});
