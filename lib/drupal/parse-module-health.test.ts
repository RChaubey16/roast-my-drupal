import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseModuleHealthPage } from "./parse-module-health";

function fixture(name: string) {
  return readFileSync(path.join(__dirname, "__fixtures__", name), "utf-8");
}

describe("parseModuleHealthPage", () => {
  it("reads the recommended release date and open issue count for an actively maintained project", () => {
    const html = fixture("token-project.html");

    const health = parseModuleHealthPage(html);

    expect(health.lastReleaseDate).toBe("9 January 2026");
    expect(health.openIssueCount).toBe(459);
  });

  it("returns a null release date when the project has no recommended release, keeping the issue count", () => {
    const html = fixture("views-project.html");

    const health = parseModuleHealthPage(html);

    expect(health.lastReleaseDate).toBeNull();
    expect(health.openIssueCount).toBe(1736);
  });

  it("returns 0 open issues when the issue queue section isn't present", () => {
    const html = "<html><body>no issue cockpit here</body></html>";

    const health = parseModuleHealthPage(html);

    expect(health.openIssueCount).toBe(0);
    expect(health.lastReleaseDate).toBeNull();
  });
});
