'use server';

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function fetchUserRoast(question: string) {
  const { text, finishReason, usage } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt: question,
  });

  return { text, finishReason, usage };
}
