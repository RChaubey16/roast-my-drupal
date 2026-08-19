import { afterEach, describe, expect, it, vi } from "vitest";

const fetchDrupalProfileData = vi.fn();
const streamText = vi.fn();
const google = vi.fn((modelId: string) => ({ modelId }));

vi.mock("@/lib/drupal/drupal-client", () => ({ fetchDrupalProfileData }));
vi.mock("ai", () => ({ streamText }));
vi.mock("@ai-sdk/google", () => ({ google }));

async function importRoute() {
  // Each test gets a fresh rate-limiter bucket, matching a cold-started
  // serverless instance rather than leaking request counts across tests.
  vi.resetModules();
  return import("./route");
}

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/roast", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("POST /api/roast", () => {
  it("returns 400 when no username is provided", async () => {
    const { POST } = await importRoute();

    const response = await POST(jsonRequest({ username: "" }));

    expect(response.status).toBe(400);
    expect(fetchDrupalProfileData).not.toHaveBeenCalled();
  });

  it("returns 404 with no LLM call when the username doesn't resolve", async () => {
    fetchDrupalProfileData.mockResolvedValue({
      username: "nonexistent-user",
      uid: null,
      profileHtml: null,
      contributionRecordsHtml: null,
      contributionRecordsSaHtml: null,
    });
    const { POST } = await importRoute();

    const response = await POST(jsonRequest({ username: "nonexistent-user" }));

    expect(response.status).toBe(404);
    expect(streamText).not.toHaveBeenCalled();
  });

  it("streams a roast when the username resolves, normalizing a full profile URL first", async () => {
    fetchDrupalProfileData.mockResolvedValue({
      username: "dries",
      uid: 1,
      profileHtml: null,
      contributionRecordsHtml: null,
      contributionRecordsSaHtml: null,
    });
    const mockResponse = new Response("mock roast stream");
    streamText.mockReturnValue({
      toTextStreamResponse: () => mockResponse,
    });
    const { POST } = await importRoute();

    const response = await POST(
      jsonRequest({ username: "https://www.drupal.org/u/dries" }),
    );

    expect(fetchDrupalProfileData).toHaveBeenCalledWith("dries");
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringMatching(/drupal/i),
        prompt: expect.stringContaining("dries"),
      }),
    );
    expect(response).toBe(mockResponse);
  });

  it("returns 429 with no scrape or LLM call once a client exceeds the rate limit", async () => {
    fetchDrupalProfileData.mockResolvedValue({
      username: "dries",
      uid: 1,
      profileHtml: null,
      contributionRecordsHtml: null,
      contributionRecordsSaHtml: null,
    });
    streamText.mockReturnValue({
      toTextStreamResponse: () => new Response("mock roast stream"),
    });
    const { POST } = await importRoute();
    const request = () =>
      jsonRequest({ username: "dries" }, { "x-forwarded-for": "9.9.9.9" });

    for (let i = 0; i < 5; i++) {
      await POST(request());
    }
    fetchDrupalProfileData.mockClear();
    streamText.mockClear();

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(fetchDrupalProfileData).not.toHaveBeenCalled();
    expect(streamText).not.toHaveBeenCalled();
  });
});
