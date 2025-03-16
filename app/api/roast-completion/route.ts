import { streamText } from 'ai';
import { google } from "@ai-sdk/google";

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: 'You are a super sarcastic and funny Drupal profile roaster.',
    prompt,
  });

  return result.toDataStreamResponse();
}
