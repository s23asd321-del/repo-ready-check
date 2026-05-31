import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { fixturePath } from "./helpers.js";

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(fixturePath("."), "..", "..");
const cliPath = path.join(projectRoot, "dist", "cli.js");

interface CliResult {
  code: number | string;
  stdout: string;
  stderr: string;
}

interface ExecFileError extends Error {
  code?: number | string;
  stdout?: string;
  stderr?: string;
}

async function runCli(args: string[]): Promise<CliResult> {
  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [cliPath, ...args],
      {
        cwd: projectRoot,
      },
    );

    return {
      code: 0,
      stdout,
      stderr,
    };
  } catch (error) {
    const execError = error as ExecFileError;

    return {
      code: execError.code ?? 1,
      stdout: execError.stdout ?? "",
      stderr: execError.stderr ?? "",
    };
  }
}

describe("cli", () => {
  it("prints help", async () => {
    const result = await runCli(["--help"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Usage:");
    expect(result.stdout).toContain("--format <text|markdown|json>");
    expect(result.stdout).toContain("existing report files are not overwritten");
  });

  it("prints the package version", async () => {
    const result = await runCli(["--version"]);

    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("lists active rules", async () => {
    const result = await runCli(["--list-rules"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Repo Ready Check Rules");
    expect(result.stdout).toContain("required-readme");
    expect(result.stdout).toContain("package-json-metadata");
  });

  it("lists rules after applying config disabledRules", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-rules-test-"));

    try {
      const configPath = path.join(root, "repo-ready-check.config.json");
      await writeFile(
        configPath,
        JSON.stringify({
          disabledRules: ["required-security"],
        }),
        "utf8",
      );

      const result = await runCli(["--config", configPath, "--list-rules"]);

      expect(result.code).toBe(0);
      expect(result.stdout).not.toContain("required-security");
      expect(result.stdout).toContain("required-readme");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("returns an error exit code for error-severity findings", async () => {
    const result = await runCli([fixturePath("incomplete-repo")]);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain("required-readme");
    expect(result.stdout).toContain("Errors: 2");
  });

  it("writes a requested Markdown report", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-cli-test-"));

    try {
      const reportPath = path.join(root, "report.md");
      const result = await runCli([
        fixturePath("complete-repo"),
        "--report",
        reportPath,
      ]);

      expect(result.code).toBe(0);
      expect(result.stderr).toContain("Report written");
      await expect(readFile(reportPath, "utf8")).resolves.toContain(
        "# Repo Ready Check Report",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("does not overwrite an existing Markdown report", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-cli-test-"));

    try {
      const reportPath = path.join(root, "report.md");
      await writeFile(reportPath, "existing content\n", "utf8");

      const result = await runCli([
        fixturePath("complete-repo"),
        "--report",
        reportPath,
      ]);

      expect(result.code).toBe(2);
      expect(result.stderr).toContain("Report file already exists");
      await expect(readFile(reportPath, "utf8")).resolves.toBe(
        "existing content\n",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("prints JSON output without absolute root paths", async () => {
    const result = await runCli([fixturePath("complete-repo"), "--format", "json"]);
    const parsed = JSON.parse(result.stdout) as {
      scannedPath?: string;
      rootPath?: string;
      summary?: { errors?: number };
    };

    expect(result.code).toBe(0);
    expect(parsed.summary?.errors).toBe(0);
    expect(parsed.scannedPath).toBe("tests/fixtures/complete-repo");
    expect(parsed.rootPath).toBeUndefined();
  });

  it("can fail on warnings through config", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repo-ready-config-test-"));

    try {
      const configPath = path.join(root, "repo-ready-check.config.json");
      await writeFile(
        configPath,
        JSON.stringify({
          recommendedDirectories: ["missing-docs"],
        }),
        "utf8",
      );

      const result = await runCli([
        fixturePath("complete-repo"),
        "--config",
        configPath,
        "--fail-on",
        "warning",
      ]);

      expect(result.code).toBe(1);
      expect(result.stdout).toContain("configured-recommended-directories");
      expect(result.stdout).toContain("Warnings: 1");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
