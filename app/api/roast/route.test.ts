import { afterEach, describe, expect, it, vi } from "vitest";
import { APICallError } from "ai";

const { fetchDrupalProfileData, streamText, google } = vi.hoisted(() => ({
  fetchDrupalProfileData: vi.fn(),
  streamText: vi.fn(),
  google: vi.fn((modelId: string) => ({ modelId })),
}));

vi.mock("@/lib/drupal/drupal-client", () => ({ fetchDrupalProfileData }));
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, streamText };
});
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

function mockFullStream(parts: Array<Record<string, unknown>>) {
  streamText.mockReturnValue({
    fullStream: (async function* () {
      for (const part of parts) yield part;
    })(),
  });
}

function textDelta(text: string) {
  return { type: "text-delta", id: "1", text };
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
      moduleHealthPages: [],
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
      moduleHealthPages: [],
    });
    mockFullStream([textDelta("mock roast stream")]);
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
    expect(await response.text()).toBe("mock roast stream");
  });

  it("blends the requested roast mode's persona into the system prompt", async () => {
    fetchDrupalProfileData.mockResolvedValue({
      username: "dries",
      uid: 1,
      profileHtml: null,
      contributionRecordsHtml: null,
      contributionRecordsSaHtml: null,
      moduleHealthPages: [],
    });
    mockFullStream([textDelta("mock roast stream")]);
    const { POST } = await importRoute();

    await POST(jsonRequest({ username: "dries", mode: "gordon-ramsay" }));

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Gordon Ramsay"),
      }),
    );
  });

  it("ignores an unknown roast mode and falls back to the default tone", async () => {
    fetchDrupalProfileData.mockResolvedValue({
      username: "dries",
      uid: 1,
      profileHtml: null,
      contributionRecordsHtml: null,
      contributionRecordsSaHtml: null,
      moduleHealthPages: [],
    });
    mockFullStream([textDelta("mock roast stream")]);
    const { POST } = await importRoute();

    const response = await POST(
      jsonRequest({ username: "dries", mode: "not-a-real-mode" }),
    );

    expect(response.status).not.toBe(400);
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.not.stringContaining("style"),
      }),
    );
  });

  it("returns a friendly 503 error when the LLM call fails before producing any text", async () => {
    fetchDrupalProfileData.mockResolvedValue({
      username: "dries",
      uid: 1,
      profileHtml: null,
      contributionRecordsHtml: null,
      contributionRecordsSaHtml: null,
      moduleHealthPages: [],
    });
    const quotaError = new APICallError({
      message: "Resource has been exhausted",
      url: "https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash",
      requestBodyValues: {},
      statusCode: 429,
    });
    mockFullStream([{ type: "start" }, { type: "error", error: quotaError }]);
    const { POST } = await importRoute();

    const response = await POST(jsonRequest({ username: "dries" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/quota|limit/i);
  });

  it("still delivers already-generated text before appending a friendly note when the LLM errors mid-stream", async () => {
    fetchDrupalProfileData.mockResolvedValue({
      username: "dries",
      uid: 1,
      profileHtml: null,
      contributionRecordsHtml: null,
      contributionRecordsSaHtml: null,
      moduleHealthPages: [],
    });
    mockFullStream([
      { type: "start" },
      textDelta("Twenty-five years on Drupal.org and"),
      { type: "error", error: new Error("connection dropped") },
    ]);
    const { POST } = await importRoute();

    const response = await POST(jsonRequest({ username: "dries" }));
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("Twenty-five years on Drupal.org and");
    expect(text).toMatch(/went wrong|try again/i);
  });

  it("returns 429 with no scrape or LLM call once a client exceeds the rate limit", async () => {
    fetchDrupalProfileData.mockResolvedValue({
      username: "dries",
      uid: 1,
      profileHtml: null,
      contributionRecordsHtml: null,
      contributionRecordsSaHtml: null,
      moduleHealthPages: [],
    });
    mockFullStream([textDelta("mock roast stream")]);
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
