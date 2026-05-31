import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { writeNewReportFile } from "../src/report-file.js";

describe("report file writing", () => {
  it("writes a new report file", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-report-test-"));

    try {
      const reportPath = path.join(root, "report.md");

      await writeNewReportFile(reportPath, "# Report\n");

      await expect(readFile(reportPath, "utf8")).resolves.toBe("# Report\n");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("does not overwrite an existing report file", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-report-test-"));

    try {
      const reportPath = path.join(root, "report.md");
      await writeFile(reportPath, "existing content\n", "utf8");

      await expect(writeNewReportFile(reportPath, "new content\n")).rejects.toThrow(
        "Report file already exists",
      );
      await expect(readFile(reportPath, "utf8")).resolves.toBe(
        "existing content\n",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
