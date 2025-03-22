"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { ProfileState } from "@/components/DrupalProfileForm";
import { DRUPAL_URL, removeExtraSpaces, validateDrupalUrl } from "@/utils/helpers";

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

/**
 * Extracts username from either a full Drupal.org URL or username input
 * @param profile The profile state containing type and value
 * @returns The extracted username from the profile
 */
export async function extractProfileName(profile: ProfileState) {
  return profile.type === "username"
    ? profile.value
    : profile.value.split("/").pop() ?? "";
}

/**
 * Validates the form input for Drupal profile URL or username
 * @param value The input value to validate
 * @returns Object containing validation status and optional error message
 */
export async function validateForm(value: string) {
  const ERROR_MESSAGE = "Please enter a valid Drupal profile URL or username";
  const trimmedValue = removeExtraSpaces(value);
  
  if (!trimmedValue) {
    return { isValid: false, message: ERROR_MESSAGE };
  }

  if (trimmedValue.includes("https") && !trimmedValue.startsWith(DRUPAL_URL)) {
    return { isValid: false, message: "Please enter a valid Drupal.org URL" };
  }

  if (trimmedValue.startsWith(DRUPAL_URL) && !validateDrupalUrl(trimmedValue)) {
    return { isValid: false, message: "Please enter a valid Drupal.org URL" };
  }

  return { isValid: true };
};
