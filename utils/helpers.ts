const DRUPAL_URL = "https://www.drupal.org";

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
