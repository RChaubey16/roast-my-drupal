export const DRUPAL_URL = "https://www.drupal.org";

export const getRoastPrompt = (profileLink: string) => {
  return `Create a hilarious roast of the Drupal profile at ${profileLink}. Be brutally funny but good-natured, using sarcasm, pop culture references, and movie analogies that would make even the most seasoned developer laugh.

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
   - End with a hilariously fitting movie quote that's been twisted to reflect their specific Drupal journey

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
- Maintain a conversational, stand-up comedy style throughout the roast`;
};

export const removeExtraSpaces = (str: string) =>
  str.trim().replace(/\s+/g, " ");

export const validateDrupalUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.origin === DRUPAL_URL;
  } catch {
    return false;
  }
};
