import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { fetchDrupalProfileData } from "@/lib/drupal-client";
import { buildRoastInputFromRawData, buildRoastPrompt } from "@/lib/build-roast-prompt";
import { normalizeUsername } from "@/lib/normalize-username";
import { checkRateLimit } from "@/lib/rate-limiter";

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
  const { system, prompt } = buildRoastPrompt(roastInput);

  const result = streamText({
    model: google("gemini-3.6-flash"),
    system,
    prompt,
  });

  return result.toTextStreamResponse();
}
