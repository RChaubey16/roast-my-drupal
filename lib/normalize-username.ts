/**
 * Normalize user input into a bare drupal.org username.
 *
 * Think of this like accepting either a person's name or their full
 * mailing address at checkout: however they typed it in, you want
 * just the name that identifies them.
 *
 * @param input - Raw text from the input field: a bare username or a
 * full `https://www.drupal.org/u/{username}` profile URL.
 * @returns The bare username, with surrounding whitespace trimmed.
 *
 * @example
 * ```ts
 * normalizeUsername("dries"); // "dries"
 * normalizeUsername("https://www.drupal.org/u/dries"); // "dries"
 * ```
 */
export function normalizeUsername(input: string): string {
  const trimmed = input.trim();

  const urlMatch = trimmed.match(/drupal\.org\/u\/([^/?#]+)/i);
  if (urlMatch) return urlMatch[1];

  return trimmed;
}
