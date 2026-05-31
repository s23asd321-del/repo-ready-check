import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { renderConsoleSummary, renderMarkdownReport } from "../src/reporter.js";
import { scanProject } from "../src/scanner.js";

const FICTIONAL_SECRET_VALUE = [
  "fake",
  "token",
  "for",
  "tests",
  "only",
  "123456789012345",
].join("_");
const FICTIONAL_GITHUB_TOKEN = ["ghp_", "a".repeat(36)].join("");

describe("secret redaction", () => {
  it("detects potential secret patterns without rendering matched values", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-secret-test-"));

    try {
      await mkdir(path.join(root, "src"));
      await mkdir(path.join(root, "docs"));
      await mkdir(path.join(root, "examples"));
      await mkdir(path.join(root, "tests"));
      await writeFile(
        path.join(root, "README.md"),
        [
          "# Secret Fixture",
          "",
          "## Installation",
          "No installation is required.",
          "",
          "## Usage",
          "Use this fixture only in local tests.",
          "",
          "## Security",
          "This fixture uses a fictional credential-like value.",
          "",
          "## Contributing",
          "Keep examples fictional.",
          "",
          "## License",
          "MIT.",
          "",
        ].join("\n"),
      );
      await writeFile(path.join(root, "LICENSE"), "MIT License\n");
      await writeFile(path.join(root, "CHANGELOG.md"), "# Changelog\n");
      await writeFile(path.join(root, "CONTRIBUTING.md"), "# Contributing\n");
      await writeFile(path.join(root, "SECURITY.md"), "# Security\n");
      await writeFile(
        path.join(root, ".gitignore"),
        ".env\n.env.*\nnode_modules/\ndist/\ncoverage/\n*.log\n",
      );
      await writeFile(path.join(root, "docs", "README.md"), "# Docs\n");
      await writeFile(path.join(root, "examples", "README.md"), "# Examples\n");
      await writeFile(path.join(root, "tests", "README.md"), "# Tests\n");
      await writeFile(
        path.join(root, "src", "config.ts"),
        [
          "export const ",
          "token",
          " = \"",
          FICTIONAL_SECRET_VALUE,
          "\";\n",
        ].join(""),
      );

      const result = await scanProject(root);
      const secretResult = result.results.find(
        (ruleResult) => ruleResult.id === "no-potential-secrets",
      );

      expect(secretResult?.passed).toBe(false);
      expect(secretResult?.locations).toEqual([
        {
          filePath: "src/config.ts",
          line: 1,
          ruleName: "generic-secret-assignment",
        },
      ]);

      const consoleOutput = renderConsoleSummary(result);
      const markdownOutput = renderMarkdownReport(result);
      const combinedOutput = `${consoleOutput}\n${markdownOutput}`;

      expect(combinedOutput).toContain("no-potential-secrets");
      expect(combinedOutput).toContain("src/config.ts:1 (generic-secret-assignment)");
      expect(combinedOutput).not.toContain(FICTIONAL_SECRET_VALUE);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("detects additional token families without rendering matched values", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-token-test-"));

    try {
      await mkdir(path.join(root, "src"));
      await writeFile(path.join(root, "README.md"), "# Token Fixture\n");
      await writeFile(path.join(root, "LICENSE"), "MIT License\n");
      await writeFile(path.join(root, "src", "note.txt"), FICTIONAL_GITHUB_TOKEN);

      const result = await scanProject(root, {
        config: {
          respectGitignore: false,
        },
      });
      const secretResult = result.results.find(
        (ruleResult) => ruleResult.id === "no-potential-secrets",
      );
      const markdownOutput = renderMarkdownReport(result);

      expect(secretResult?.passed).toBe(false);
      expect(secretResult?.locations).toEqual([
        {
          filePath: "src/note.txt",
          line: 1,
          ruleName: "github-token",
        },
      ]);
      expect(markdownOutput).toContain("src/note.txt:1 (github-token)");
      expect(markdownOutput).not.toContain(FICTIONAL_GITHUB_TOKEN);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("allows explicitly annotated fictional secret-like fixture lines", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-allow-test-"));

    try {
      await mkdir(path.join(root, "src"));
      await writeFile(path.join(root, "README.md"), "# Allowlist Fixture\n");
      await writeFile(path.join(root, "LICENSE"), "MIT License\n");
      await writeFile(
        path.join(root, "src", "fixture.txt"),
        `${FICTIONAL_GITHUB_TOKEN} # repo-ready-check: ignore secret\n`,
      );

      const result = await scanProject(root, {
        config: {
          respectGitignore: false,
        },
      });
      const secretResult = result.results.find(
        (ruleResult) => ruleResult.id === "no-potential-secrets",
      );
      const markdownOutput = renderMarkdownReport(result);

      expect(secretResult?.passed).toBe(true);
      expect(markdownOutput).not.toContain(FICTIONAL_GITHUB_TOKEN);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
