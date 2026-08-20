import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { fetchDrupalProfileData } from "@/lib/drupal/drupal-client";
import { buildRoastInputFromRawData, buildRoastPrompt } from "@/lib/roast/build-roast-prompt";
import { normalizeUsername } from "@/lib/drupal/normalize-username";
import { checkRateLimit } from "@/lib/rate-limiter";
import { encodeRoastStatsHeader } from "@/lib/roast/roast-stats";
import { describeStreamError } from "@/lib/roast/stream-error";

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: `You're roasting too fast. Try again in ${rateLimit.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const rawInput = typeof body?.username === "string" ? body.username : "";
  const username = normalizeUsername(rawInput);
  const mode = typeof body?.mode === "string" ? body.mode : undefined;

  if (!username) {
    return Response.json(
      { error: "Please enter a drupal.org username or profile URL." },
      { status: 400 },
    );
  }

  const raw = await fetchDrupalProfileData(username);

  if (raw.uid === null) {
    return Response.json(
      { error: `Couldn't find a drupal.org profile for "${username}".` },
      { status: 404 },
    );
  }

  const roastInput = buildRoastInputFromRawData(raw);
  const { system, prompt } = buildRoastPrompt(roastInput, mode);

  const result = streamText({
    model: google("gemini-3.6-flash"),
    system,
    prompt,
  });

  // Peek ahead to the first "meaningful" stream part ourselves: if the LLM
  // call fails outright (e.g. a quota error), the AI SDK still emits
  // bookkeeping parts first (`start`, `start-step`) before the `error`
  // part, and `toTextStreamResponse()` silently drops non-text parts —
  // the client would see a "successful" empty stream. Skipping past the
  // bookkeeping parts here lets a same-request failure return a normal
  // JSON error instead, reusing the existing error-banner UI on the
  // frontend.
  const iterator = result.fullStream[Symbol.asyncIterator]();
  let first: Awaited<ReturnType<typeof iterator.next>>;
  try {
    do {
      first = await iterator.next();
    } while (!first.done && first.value.type !== "text-delta" && first.value.type !== "error");
  } catch (error) {
    return Response.json({ error: describeStreamError(error) }, { status: 503 });
  }

  if (!first.done && first.value.type === "error") {
    return Response.json(
      { error: describeStreamError(first.value.error) },
      { status: 503 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let current = first;
      try {
        while (!current.done) {
          if (current.value.type === "text-delta") {
            controller.enqueue(encoder.encode(current.value.text));
          } else if (current.value.type === "error") {
            controller.enqueue(
              encoder.encode(`\n\n${describeStreamError(current.value.error)}`),
            );
          }
          current = await iterator.next();
        }
      } catch (error) {
        controller.enqueue(encoder.encode(`\n\n${describeStreamError(error)}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Roast-Stats": encodeRoastStatsHeader(roastInput),
    },
  });
}
