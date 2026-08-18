export function normalizeUsername(input: string): string {
  const trimmed = input.trim();

  const urlMatch = trimmed.match(/drupal\.org\/u\/([^/?#]+)/i);
  if (urlMatch) return urlMatch[1];

  return trimmed;
}
