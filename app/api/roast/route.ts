import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { fetchDrupalProfileData } from "@/lib/drupal-client";
import { buildRoastInputFromRawData, buildRoastPrompt } from "@/lib/build-roast-prompt";
import { normalizeUsername } from "@/lib/normalize-username";

export async function POST(request: Request) {
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
