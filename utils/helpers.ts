export const DRUPAL_URL = "https://www.drupal.org";

/**
 * Generates a structured roast prompt for a Drupal.org profile
 * @param profileData The scraped profile data from Drupal.org
 * @returns A formatted prompt string for generating roasts
 */
export const getRoastPrompt = (profileData: string) => {
  return `Create a hilarious roast of the Drupal profile data that I will provide you below. Be brutally funny but good-natured, using sarcasm, pop culture references, and movie analogies that would make even the most seasoned developer laugh.

Profile Analysis:
1. FIRST IMPRESSION (Opening Punchline)
   - Reference their username or profile headline in your opening joke
   - If the profile appears outdated: Compare it to "a digital fossil from the Internet Explorer era" or "the Drupal equivalent of a MySpace page"
   - If profile seems active: Joke about their dedication ("spends more time with Drupal than with actual humans")

2. PROFILE PICTURE & BIO ROAST
   - Reference specific elements from their photo (clothing, expression, background)
   - If no picture: "Your avatar is as empty as your git commit history"
   - Pull quotes from their bio to playfully mock their self-description
   - If they list skills/interests, create jokes comparing their claimed expertise to reality

3. DRUPAL INVOLVEMENT MOCKERY
   - Mention specific Drupal events they've attended (or haven't) without referencing dates
   - Reference any groups they belong to with exaggerated stereotypes
   - If they have badges/achievements, create jokes about their "impressive" digital trophy case
   - Make fun of their Drupal.org seniority with a corporate hierarchy joke, but don't mention specific time periods

4. MODULE & CONTRIBUTION CRITIQUE
   - Name specific modules they've worked on and compare them to outdated technologies
   - Reference actual commit messages or issue comments they've made
   - If no contributions: "Has contributed as much to Drupal as a potato in a server rack"
   - If they maintain any modules, joke about the module's popularity (or lack thereof)

5. FINAL VERDICT
   - Summarize their profile with references to their most distinctive characteristics
   - Create a custom mock "Drupal Developer Rating" based on their specific profile elements
   - End with a unique, hilariously fitting movie quote that's been twisted to reflect their specific Drupal journey

IMPORTANT: 
- DO NOT mention any specific years, dates, or time periods
- Instead of "joined in 2015" say "has been lurking around since the dinosaurs roamed the internet"
- Instead of "hasn't contributed in 3 years" say "contributes about as often as solar eclipses"
- Avoid mentioning how long ago anything happened

Remember:
- Pull real details from their profile to make the roast personally tailored without mentioning dates
- Use their actual contribution history, username, photo, and bio information for maximum impact
- Keep it lighthearted but ruthless—like a roast between good friends
- Use tech humor that Drupal developers would appreciate
- Never mention or include the profile URL in the roast
- Maintain a conversational, stand-up comedy style throughout the roast

Here is Drupal profile information for your roast: ${profileData}`;
};

/**
 * Removes multiple spaces and trims whitespace from a string
 * @param str The input string to clean
 * @returns A string with normalized spacing
 */
export const removeExtraSpaces = (str: string) =>
  str.trim().replace(/\s+/g, " ");

/**
 * Validates if a given URL belongs to Drupal.org
 * @param url The URL to validate
 * @returns Boolean indicating if URL is a valid Drupal.org URL
 */
export const validateDrupalUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.origin === DRUPAL_URL;
  } catch {
    return false;
  }
};

/**
 * Extracts text between two phrases in a string
 * @param text The source text to search in
 * @param startPhrase The starting phrase to search from
 * @param endPhrase The ending phrase to search until
 * @returns The extracted text between phrases or null if not found
 */
export function extractBetween(text: string, startPhrase: string, endPhrase: string) {
  const startIndex = text.indexOf(startPhrase);
  const endIndex = text.indexOf(endPhrase, startIndex);

  if (startIndex === -1 || endIndex === -1) {
    return null; // Return null if either phrase is not found
  }

  return text.substring(startIndex + startPhrase.length, endIndex).trim() ?? "";
}
