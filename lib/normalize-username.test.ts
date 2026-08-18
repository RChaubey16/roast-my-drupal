import { describe, expect, it } from "vitest";
import { normalizeUsername } from "./normalize-username";

describe("normalizeUsername", () => {
  it("returns a bare username unchanged", () => {
    expect(normalizeUsername("dries")).toBe("dries");
  });

  it("trims surrounding whitespace from a bare username", () => {
    expect(normalizeUsername("  dries  ")).toBe("dries");
  });

  it("extracts the username from a full profile URL", () => {
    expect(normalizeUsername("https://www.drupal.org/u/dries")).toBe("dries");
  });

  it("extracts the username from a profile URL without protocol", () => {
    expect(normalizeUsername("drupal.org/u/dries")).toBe("dries");
  });

  it("extracts the username from a profile URL with trailing slash or query", () => {
    expect(normalizeUsername("https://www.drupal.org/u/dries/")).toBe("dries");
    expect(normalizeUsername("https://www.drupal.org/u/dries?foo=bar")).toBe("dries");
  });

  it("returns an empty string for blank input", () => {
    expect(normalizeUsername("   ")).toBe("");
  });
});
