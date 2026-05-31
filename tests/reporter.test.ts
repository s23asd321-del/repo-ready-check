import { describe, expect, it } from "vitest";

import {
  renderConsoleSummary,
  renderJsonReport,
  renderMarkdownReport,
  shouldFail,
} from "../src/reporter.js";
import { scanProject } from "../src/scanner.js";

import { fixturePath } from "./helpers.js";

describe("reporter", () => {
  it("renders a console summary with counts", async () => {
    const result = await scanProject(fixturePath("complete-repo"));
    const summary = renderConsoleSummary(result);

    expect(summary).toContain("Repo Ready Check");
    expect(summary).toContain("Total checks:");
    expect(summary).toContain("Passed:");
    expect(summary).toContain("Warnings:");
    expect(summary).toContain("Errors:");
  });

  it("renders a Markdown report with safety and disclaimer sections", async () => {
    const result = await scanProject(fixturePath("complete-repo"));
    const report = renderMarkdownReport(result);

    expect(report).toContain("# Repo Ready Check Report");
    expect(report).toContain("## Detailed Check Results");
    expect(report).toContain("## Skipped Paths");
    expect(report).toContain("## Security and Privacy Notes");
    expect(report).toContain("not legal advice");
    expect(report).toContain("not compliance certification");
    expect(report).toContain("not a complete security audit");
  });

  it("renders JSON without absolute root paths", async () => {
    const result = await scanProject(fixturePath("complete-repo"));
    const report = renderJsonReport(result);
    const parsed = JSON.parse(report) as { rootPath?: string; scannedPath?: string };

    expect(parsed.rootPath).toBeUndefined();
    expect(parsed.scannedPath).toBe(result.displayPath);
  });

  it("supports warning-level failure thresholds", async () => {
    const result = await scanProject(fixturePath("complete-repo"), {
      config: {
        recommendedDirectories: ["missing-directory"],
      },
    });

    expect(shouldFail(result, "error")).toBe(false);
    expect(shouldFail(result, "warning")).toBe(true);
  });
});
