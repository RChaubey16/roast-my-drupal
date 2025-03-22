'use server'

import { generateText } from "ai";
import { google } from "@ai-sdk/google";

type ProfileResponse = {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * Server action to fetch scraped profile data from proxy service
 * @param profileLink The profile link to fetch data for
 * @returns Object containing success status and either data or error message
 */
export async function fetchScrappedDrupalProfile(profileLink: string): Promise<ProfileResponse> {
  try {
    const drupalProfileUrl = `https://r.jina.ai/${profileLink}`;
    const response = await fetch(drupalProfileUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.text();
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    } else {
      return { success: false, error: "An unknown error occurred" };
    }
  }
}

/**
 * Generates a roast/feedback for a Drupal site using Google's Gemini model
 * @param question The user's input or site details to analyze
 * @returns Generated text response with finish reason and usage metrics
 */
export async function fetchUserRoast(question: string) {
    const { text, finishReason, usage } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: question,
    });
  
    return { text, finishReason, usage };
  }
