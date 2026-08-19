import { describe, expect, it } from "vitest";
import { ROAST_MODES, resolveRoastMode } from "./roast-modes";

describe("ROAST_MODES", () => {
  it("includes default plus the four celebrity personas", () => {
    expect(Object.keys(ROAST_MODES).sort()).toEqual(
      ["chandler-bing", "default", "elon-musk", "gordon-ramsay", "kevin-hart"].sort(),
    );
  });

  it("gives the default mode an empty persona prompt, leaving today's tone unchanged", () => {
    expect(ROAST_MODES.default.personaPrompt).toBe("");
  });

  it("gives every celebrity mode a non-empty persona prompt naming that persona", () => {
    expect(ROAST_MODES["chandler-bing"].personaPrompt).toContain("Chandler Bing");
    expect(ROAST_MODES["kevin-hart"].personaPrompt).toContain("Kevin Hart");
    expect(ROAST_MODES["elon-musk"].personaPrompt).toContain("Elon Musk");
    expect(ROAST_MODES["gordon-ramsay"].personaPrompt).toContain("Gordon Ramsay");
  });

  it("frames every celebrity persona as a style impression, never as their real words", () => {
    for (const id of ["chandler-bing", "kevin-hart", "elon-musk", "gordon-ramsay"] as const) {
      expect(ROAST_MODES[id].personaPrompt.toLowerCase()).toContain("style");
    }
  });
});

describe("resolveRoastMode", () => {
  it("resolves a known mode id to its RoastMode", () => {
    expect(resolveRoastMode("kevin-hart")).toBe(ROAST_MODES["kevin-hart"]);
  });

  it("falls back to default for an unknown mode id", () => {
    expect(resolveRoastMode("not-a-real-mode")).toBe(ROAST_MODES.default);
  });

  it("falls back to default for undefined", () => {
    expect(resolveRoastMode(undefined)).toBe(ROAST_MODES.default);
  });

  it("falls back to default for null", () => {
    expect(resolveRoastMode(null)).toBe(ROAST_MODES.default);
  });
});
