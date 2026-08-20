import { afterEach, describe, expect, it, vi } from "vitest";
import type { DrupalProfileData } from "./drupal-client";

vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

import { kv } from "@vercel/kv";
import { getCachedProfileData, setCachedProfileData } from "./cache";

const sampleData: DrupalProfileData = {
  username: "dries",
  uid: 1,
  profileHtml: "<html>profile</html>",
  contributionRecordsHtml: "<html>all-records</html>",
  contributionRecordsSaHtml: "<html>sa-only</html>",
  moduleHealthPages: [],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("getCachedProfileData", () => {
  it("returns the cached data on a hit", async () => {
    vi.mocked(kv.get).mockResolvedValue(sampleData);

    await expect(getCachedProfileData("dries")).resolves.toEqual(sampleData);
    expect(kv.get).toHaveBeenCalledWith("roast-profile:dries");
  });

  it("normalizes the username's casing into the cache key", async () => {
    vi.mocked(kv.get).mockResolvedValue(sampleData);

    await getCachedProfileData("Dries");

    expect(kv.get).toHaveBeenCalledWith("roast-profile:dries");
  });

  it("returns null on a cache miss", async () => {
    vi.mocked(kv.get).mockResolvedValue(null);

    await expect(getCachedProfileData("dries")).resolves.toBeNull();
  });

  it("returns null (treats it as a miss) when the KV read fails", async () => {
    vi.mocked(kv.get).mockRejectedValue(new Error("KV unreachable"));

    await expect(getCachedProfileData("dries")).resolves.toBeNull();
  });
});

describe("setCachedProfileData", () => {
  it("writes the data under the cache key with a TTL", async () => {
    vi.mocked(kv.set).mockResolvedValue("OK");

    await setCachedProfileData("dries", sampleData);

    expect(kv.set).toHaveBeenCalledWith("roast-profile:dries", sampleData, {
      ex: 600,
    });
  });

  it("swallows the error (never throws) when the KV write fails", async () => {
    vi.mocked(kv.set).mockRejectedValue(new Error("KV unreachable"));

    await expect(setCachedProfileData("dries", sampleData)).resolves.toBeUndefined();
  });
});
