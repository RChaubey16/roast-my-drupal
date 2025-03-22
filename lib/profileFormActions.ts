"use server";

import { ProfileState } from "@/components/ProfileForm";
import {
  DRUPAL_URL,
  removeExtraSpaces,
  validateDrupalUrl,
} from "@/utils/helpers";

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
}
