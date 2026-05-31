import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadConfig, resolveConfig } from "../src/config.js";

describe("config", () => {
  it("loads repo-ready-check.config.json from the scanned project", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-config-test-"));

    try {
      await writeFile(
        path.join(root, "repo-ready-check.config.json"),
        JSON.stringify({
          requiredFiles: ["docs/architecture.md"],
          recommendedDirectories: ["playground"],
          ignorePaths: ["vendor/"],
          disabledRules: ["required-tests-directory"],
          ruleSeverities: {
            "required-security": "error",
          },
          maxFileSizeBytes: 2048,
          includeHidden: true,
          respectGitignore: false,
        }),
        "utf8",
      );

      const loaded = await loadConfig(root, root);
      const resolved = resolveConfig(loaded.config);

      expect(loaded.configPath).toBe("repo-ready-check.config.json");
      expect(resolved.requiredFiles).toEqual(["docs/architecture.md"]);
      expect(resolved.recommendedDirectories).toEqual(["playground"]);
      expect(resolved.ignorePaths).toContain("vendor/");
      expect(resolved.disabledRules).toEqual(["required-tests-directory"]);
      expect(resolved.ruleSeverities["required-security"]).toBe("error");
      expect(resolved.maxFileSizeBytes).toBe(2048);
      expect(resolved.includeHidden).toBe(true);
      expect(resolved.respectGitignore).toBe(false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects invalid config values", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-config-test-"));

    try {
      await writeFile(
        path.join(root, "repo-ready-check.config.json"),
        JSON.stringify({
          maxFileSizeBytes: -1,
        }),
        "utf8",
      );

      await expect(loadConfig(root, root)).rejects.toThrow(
        "maxFileSizeBytes must be a positive integer",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects invalid disabledRules values", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-config-test-"));

    try {
      await writeFile(
        path.join(root, "repo-ready-check.config.json"),
        JSON.stringify({
          disabledRules: ["required-readme", 123],
        }),
        "utf8",
      );

      await expect(loadConfig(root, root)).rejects.toThrow(
        "disabledRules must be an array of strings",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
