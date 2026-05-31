import path from "node:path";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";

import { describe, expect, it } from "vitest";

import { scanProject } from "../src/scanner.js";

import { fixturePath } from "./helpers.js";

describe("scanner", () => {
  it("uses relative display paths where possible", async () => {
    const fixturesRoot = fixturePath(".");
    const result = await scanProject("complete-repo", { cwd: fixturesRoot });

    expect(result.projectName).toBe("complete-repo");
    expect(result.displayPath).toBe("complete-repo");
  });

  it("rejects non-directory targets", async () => {
    const readmePath = path.join(fixturePath("complete-repo"), "README.md");

    await expect(scanProject(readmePath)).rejects.toThrow(
      "Scan target is not a directory",
    );
  });

  it("produces one result per active rule", async () => {
    const result = await scanProject(fixturePath("complete-repo"));

    expect(result.summary.total).toBe(result.results.length);
    expect(result.results.every((ruleResult) => ruleResult.id)).toBe(true);
  });

  it("reports skipped binary and oversized files", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-skip-test-"));

    try {
      await mkdir(path.join(root, "docs"));
      await mkdir(path.join(root, "examples"));
      await mkdir(path.join(root, "tests"));
      await writeFile(
        path.join(root, "README.md"),
        [
          "# Skip Fixture",
          "",
          "## Installation",
          "No installation is required.",
          "",
          "## Usage",
          "Used for scanner tests.",
          "",
          "## Security",
          "Uses fake content only.",
          "",
          "## Contributing",
          "Keep changes small.",
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
      await writeFile(path.join(root, "binary.bin"), new Uint8Array([1, 0, 2]));
      await writeFile(path.join(root, "large.txt"), "x".repeat(1024 * 1024 + 1));

      const result = await scanProject(root);

      expect(result.skippedPaths).toEqual(
        expect.arrayContaining([
          {
            path: "binary.bin",
            reason: "File appears to be binary.",
          },
          {
            path: "large.txt",
            reason: "File is larger than the text scan limit.",
          },
        ]),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("uses configured required files and rule severity overrides", async () => {
    const result = await scanProject(fixturePath("complete-repo"), {
      config: {
        requiredFiles: ["docs/architecture.md"],
        ruleSeverities: {
          "configured-required-files": "warning",
        },
      },
    });
    const configuredRule = result.results.find(
      (ruleResult) => ruleResult.id === "configured-required-files",
    );

    expect(configuredRule?.passed).toBe(false);
    expect(configuredRule?.status).toBe("warning");
    expect(result.summary.errors).toBe(0);
    expect(result.summary.warnings).toBe(1);
  });

  it("respects .gitignore and configured ignore paths", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-ignore-test-"));

    try {
      await writeFile(path.join(root, ".gitignore"), "ignored-by-gitignore.txt\n");
      await writeFile(path.join(root, "ignored-by-gitignore.txt"), "ignored\n");
      await writeFile(path.join(root, "ignored-by-config.txt"), "ignored\n");
      await writeFile(path.join(root, "included.txt"), "included\n");

      const result = await scanProject(root, {
        config: {
          ignorePaths: ["ignored-by-config.txt"],
        },
        rules: [
          {
            id: "inspect-collected-paths",
            title: "Inspect collected paths",
            description: "Test-only rule for inspecting scanner path collection.",
            severity: "info",
            check(context) {
              expect(context.filePaths).toContain("included.txt");
              expect(context.filePaths).not.toContain("ignored-by-gitignore.txt");
              expect(context.filePaths).not.toContain("ignored-by-config.txt");

              return {
                passed: true,
                message: "Collected paths were inspected.",
              };
            },
          },
        ],
      });

      expect(result.results).toHaveLength(1);
      expect(result.rootPath).toBe(root);
      expect(result.skippedPaths).toEqual([]);
      expect(result.results.some((ruleResult) => ruleResult.id)).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("skips symbolic links", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-link-test-"));

    try {
      await writeFile(path.join(root, "target.txt"), "target\n");
      await symlink(path.join(root, "target.txt"), path.join(root, "linked.txt"));

      const result = await scanProject(root);

      expect(result.skippedPaths).toEqual(
        expect.arrayContaining([
          {
            path: "linked.txt",
            reason: "Symbolic links are skipped.",
          },
        ]),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
