import { describe, expect, it } from "vitest";
import { APICallError, RetryError } from "ai";
import { describeStreamError } from "./stream-error";

describe("describeStreamError", () => {
  it("gives a quota-specific message for a 429 APICallError", () => {
    const error = new APICallError({
      message: "Resource has been exhausted",
      url: "https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash",
      requestBodyValues: {},
      statusCode: 429,
    });

    expect(describeStreamError(error)).toMatch(/quota|limit/i);
  });

  it("gives a generic message for a non-429 APICallError", () => {
    const error = new APICallError({
      message: "Internal error",
      url: "https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash",
      requestBodyValues: {},
      statusCode: 500,
    });

    expect(describeStreamError(error)).not.toMatch(/quota|limit/i);
    expect(describeStreamError(error).length).toBeGreaterThan(0);
  });

  it("gives a quota-specific message for a RetryError wrapping a 429 APICallError, as the AI SDK produces after exhausting its retries", () => {
    const quotaError = new APICallError({
      message: "You exceeded your current quota",
      url: "https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash",
      requestBodyValues: {},
      statusCode: 429,
    });
    const retryError = new RetryError({
      message: "Failed after 3 attempts",
      reason: "maxRetriesExceeded",
      errors: [quotaError, quotaError, quotaError],
    });

    expect(describeStreamError(retryError)).toMatch(/quota|limit/i);
  });

  it("gives a generic message for a plain, non-API error", () => {
    expect(describeStreamError(new Error("boom"))).not.toMatch(/quota|limit/i);
  });

  it("gives a generic message for a completely unknown thrown value", () => {
    expect(describeStreamError("a string, not even an Error")).not.toMatch(/quota|limit/i);
  });
});
