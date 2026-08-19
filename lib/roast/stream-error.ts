import { APICallError, RetryError } from "ai";

const QUOTA_MESSAGE =
  "Our AI roastmaster has hit its usage quota with the model provider. Please try again in a bit.";
const GENERIC_MESSAGE =
  "Something went wrong while generating your roast. Please try again.";

/**
 * Turn an error thrown mid-stream by the LLM call into a short,
 * user-facing message.
 *
 * Think of this like a waiter explaining to a table why their order
 * didn't arrive: "the kitchen's out of a specific ingredient today"
 * (quota exhausted) reads very differently from a vague "something
 * went wrong back there" — the diner deserves to know which one it is.
 *
 * @param error - The raw error caught from the stream. Typically an
 * `AI SDK` `RetryError` wrapping the last `APICallError` after retries
 * are exhausted, a bare `APICallError`, or any other thrown value.
 * @returns A short message safe to show the user: quota-specific for
 * a 429 rate-limit/quota response, otherwise a generic fallback.
 *
 * @example
 * ```ts
 * describeStreamError(new APICallError({ statusCode: 429, ... }));
 * // "Our AI roastmaster has hit its usage quota..."
 * ```
 */
export function describeStreamError(error: unknown): string {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  if (APICallError.isInstance(cause) && cause.statusCode === 429) {
    return QUOTA_MESSAGE;
  }
  return GENERIC_MESSAGE;
}
