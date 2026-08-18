import { afterEach, describe, expect, it, vi } from "vitest";

const fetchDrupalProfileData = vi.fn();
const streamText = vi.fn();
const google = vi.fn((modelId: string) => ({ modelId }));

vi.mock("@/lib/drupal-client", () => ({ fetchDrupalProfileData }));
vi.mock("ai", () => ({ streamText }));
vi.mock("@ai-sdk/google", () => ({ google }));

async function importRoute() {
  return import("./route");
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/roast", {
    method: "POST",
    body: JSON.stringify(body),
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
});
