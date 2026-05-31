import { describe, expect, it } from "vitest";

import { scanProject } from "../src/scanner.js";

import { fixturePath } from "./helpers.js";

describe("fixture regression", () => {
  it("keeps the complete fixture clean", async () => {
    const result = await scanProject(fixturePath("complete-repo"));

    expect(result.summary).toMatchObject({
      errors: 0,
      warnings: 0,
    });
  });

  it("keeps the incomplete fixture intentionally noisy", async () => {
    const result = await scanProject(fixturePath("incomplete-repo"));
    const messages = result.results
      .filter((ruleResult) => !ruleResult.passed)
      .map((ruleResult) => ruleResult.message);

    expect(messages.length).toBeGreaterThan(0);
    expect(messages.join("\n")).toContain("missing");
  });
});
