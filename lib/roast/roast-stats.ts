import type { RoastInput } from "./build-roast-prompt";

export interface RoastStats {
  username: string;
  accountAgeText: string | null;
  membershipBadge: string | null;
  projectsMaintained: string[];
  totalCredits: number;
  securityAdvisoryCredits: number;
  mostRecentCreditDate: string | null;
}

function isRoastStats(value: unknown): value is RoastStats {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.username === "string" &&
    (typeof v.accountAgeText === "string" || v.accountAgeText === null) &&
    (typeof v.membershipBadge === "string" || v.membershipBadge === null) &&
    Array.isArray(v.projectsMaintained) &&
    v.projectsMaintained.every((p) => typeof p === "string") &&
    typeof v.totalCredits === "number" &&
    typeof v.securityAdvisoryCredits === "number" &&
    (typeof v.mostRecentCreditDate === "string" || v.mostRecentCreditDate === null)
  );
}

/**
 * Encode the card-display subset of a `RoastInput` as a base64 string
 * suitable for an HTTP response header.
 *
 * Think of this like packing a small gift box to send alongside a
 * letter: the letter (streamed roast text) travels in the response
 * body, while these few stats ride along in a header, wrapped in
 * base64 so they survive as plain ASCII.
 *
 * @param input - The roast input to pull display stats from.
 * @returns A base64-encoded JSON string of the `RoastStats` subset.
 *
 * @example
 * ```ts
 * encodeRoastStatsHeader(roastInput);
 * // "eyJ1c2VybmFtZSI6ImRyaWVzIiwuLi59"
 * ```
 */
export function encodeRoastStatsHeader(input: RoastInput): string {
  const stats: RoastStats = {
    username: input.username,
    accountAgeText: input.accountAgeText,
    membershipBadge: input.membershipBadge,
    projectsMaintained: input.projectsMaintained,
    totalCredits: input.totalCredits,
    securityAdvisoryCredits: input.securityAdvisoryCredits,
    mostRecentCreditDate: input.mostRecentCreditDate,
  };

  const bytes = new TextEncoder().encode(JSON.stringify(stats));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Decode a `RoastStats` header value produced by
 * `encodeRoastStatsHeader`, degrading to `null` on any problem.
 *
 * Think of this like a customs officer opening that gift box: if it's
 * missing, the wrapping is torn, or the contents don't match what's
 * declared, it's treated as "nothing arrived" rather than raising an
 * alarm — the roast text still gets delivered on its own.
 *
 * @param header - The raw header value, or `null` if absent.
 * @returns The decoded `RoastStats`, or `null` if the header is
 * missing, not valid base64, not valid JSON, or the wrong shape.
 *
 * @example
 * ```ts
 * decodeRoastStatsHeader(response.headers.get("X-Roast-Stats"));
 * // { username: "dries", totalCredits: 154, ... } or null
 * ```
 */
export function decodeRoastStatsHeader(header: string | null): RoastStats | null {
  if (!header) return null;

  try {
    const binary = atob(header);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return isRoastStats(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
