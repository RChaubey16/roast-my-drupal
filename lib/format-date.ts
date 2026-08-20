/**
 * Format an ISO datetime string as a short human-readable date.
 *
 * Think of this like reading a timestamped receipt out loud to
 * someone: instead of "2025-09-01T07:34:05+00:00", you'd just say
 * "Sep 1, 2025." Uses UTC so the displayed day never shifts with the
 * viewer's local time zone.
 *
 * @param isoDate - An ISO 8601 datetime string.
 * @returns The date formatted as e.g. "Sep 1, 2025", or the original
 * string unchanged if it isn't a parseable date.
 *
 * @example
 * ```ts
 * formatCreditDate("2025-09-01T07:34:05+00:00"); // "Sep 1, 2025"
 * ```
 */
export function formatCreditDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
