#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

import { loadConfig } from "./config.js";
import { writeNewReportFile } from "./report-file.js";
import { renderReport, shouldFail } from "./reporter.js";
import { createRules } from "./rules.js";
import { scanProject } from "./scanner.js";
import type { FailOn, OutputFormat, RepoReadyConfig } from "./types.js";

interface ParsedArgs {
  help: boolean;
  version: boolean;
  listRules: boolean;
  targetPath: string;
  reportPath?: string;
  configPath?: string;
  format: OutputFormat;
  failOn: FailOn;
  maxFileSizeBytes?: number;
  includeHidden?: boolean;
  noValues: boolean;
}

function printHelp(): void {
  console.log(`Repo Ready Check

Local-first readiness checks for GitHub repositories.

Usage:
  repo-ready-check [project-directory] [options]

Examples:
  repo-ready-check
  repo-ready-check ./some-project
  repo-ready-check . --report repo-ready-report.md
  repo-ready-check . --format json
  repo-ready-check . --fail-on warning
  repo-ready-check --list-rules

Options:
  --report <path>              Write a report file. Defaults to Markdown unless --format is json or markdown.
  --format <text|markdown|json>
                               Choose console output format. Default: text.
  --fail-on <error|warning>    Exit non-zero on errors only, or on warnings and errors. Default: error.
  --config <path>              Use a config file. Default: repo-ready-check.config.json in the scanned project.
  --max-file-size <bytes>      Override the maximum text file size scanned.
  --include-hidden             Include hidden files and directories beyond the default safe metadata set.
  --no-values                  Keep matched secret-like values redacted. This is always enforced.
  --list-rules                 Print active rule ids, severities, and titles, then exit.
  --version                    Print the CLI version.
  --help                       Show this help.

Safety defaults:
  - local-only
  - read-only scan
  - report file written only when --report is provided
  - existing report files are not overwritten
  - no network access
  - no telemetry
  - no automatic fixes
  - no secret values in output`);
}

function readValue(args: string[], index: number, optionName: string): string {
  const value = args[index + 1];

  if (value === undefined || value.startsWith("-")) {
    throw new Error(`${optionName} requires a value.`);
  }

  return value;
}

function parseOutputFormat(value: string): OutputFormat {
  if (value === "text" || value === "markdown" || value === "json") {
    return value;
  }

  throw new Error("--format must be one of: text, markdown, json.");
}

function parseFailOn(value: string): FailOn {
  if (value === "error" || value === "warning") {
    return value;
  }

  throw new Error("--fail-on must be one of: error, warning.");
}

function parsePositiveInteger(value: string, optionName: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer.`);
  }

  return parsed;
}

function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    help: false,
    version: false,
    listRules: false,
    targetPath: ".",
    format: "text",
    failOn: "error",
    noValues: true,
  };

  const positional: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--version" || arg === "-v") {
      parsed.version = true;
      continue;
    }

    if (arg === "--list-rules") {
      parsed.listRules = true;
      continue;
    }

    if (arg === "--report") {
      const reportPath = readValue(args, index, "--report");
      parsed.reportPath = reportPath;
      index += 1;
      continue;
    }

    if (arg.startsWith("--report=")) {
      const reportPath = arg.slice("--report=".length);
      if (reportPath.length === 0) {
        throw new Error("--report requires a file path.");
      }

      parsed.reportPath = reportPath;
      continue;
    }

    if (arg === "--config") {
      parsed.configPath = readValue(args, index, "--config");
      index += 1;
      continue;
    }

    if (arg.startsWith("--config=")) {
      const configPath = arg.slice("--config=".length);
      if (configPath.length === 0) {
        throw new Error("--config requires a file path.");
      }

      parsed.configPath = configPath;
      continue;
    }

    if (arg === "--format") {
      parsed.format = parseOutputFormat(readValue(args, index, "--format"));
      index += 1;
      continue;
    }

    if (arg.startsWith("--format=")) {
      parsed.format = parseOutputFormat(arg.slice("--format=".length));
      continue;
    }

    if (arg === "--fail-on") {
      parsed.failOn = parseFailOn(readValue(args, index, "--fail-on"));
      index += 1;
      continue;
    }

    if (arg.startsWith("--fail-on=")) {
      parsed.failOn = parseFailOn(arg.slice("--fail-on=".length));
      continue;
    }

    if (arg === "--max-file-size") {
      parsed.maxFileSizeBytes = parsePositiveInteger(
        readValue(args, index, "--max-file-size"),
        "--max-file-size",
      );
      index += 1;
      continue;
    }

    if (arg.startsWith("--max-file-size=")) {
      parsed.maxFileSizeBytes = parsePositiveInteger(
        arg.slice("--max-file-size=".length),
        "--max-file-size",
      );
      continue;
    }

    if (arg === "--include-hidden") {
      parsed.includeHidden = true;
      continue;
    }

    if (arg === "--no-values") {
      parsed.noValues = true;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positional.push(arg);
  }

  if (positional.length > 1) {
    throw new Error("Only one project directory can be scanned at a time.");
  }

  if (positional[0] !== undefined) {
    parsed.targetPath = positional[0];
  }

  return parsed;
}

async function readPackageVersion(): Promise<string> {
  const packageJsonPath = new URL("../package.json", import.meta.url);
  const content = await fs.readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(content) as { version?: unknown };

  return typeof packageJson.version === "string" ? packageJson.version : "0.0.0";
}

function renderRuleList(config: RepoReadyConfig): string {
  const activeRules = createRules(config);
  const lines = [
    "Repo Ready Check Rules",
    "",
    "| Rule id | Severity | Title |",
    "| --- | --- | --- |",
  ];

  for (const rule of activeRules) {
    lines.push(`| ${rule.id} | ${rule.severity} | ${rule.title} |`);
  }

  return lines.join("\n");
}

async function main(): Promise<void> {
  let args: ParsedArgs;

  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("Run repo-ready-check --help for usage.");
    process.exitCode = 2;
    return;
  }

  if (args.help) {
    printHelp();
    return;
  }

  if (args.version) {
    console.log(await readPackageVersion());
    return;
  }

  try {
    const cwd = process.cwd();
    const rootPath = path.resolve(cwd, args.targetPath);
    const loadedConfig = await loadConfig(rootPath, cwd, args.configPath);
    const mergedConfig: RepoReadyConfig = { ...loadedConfig.config };

    if (args.maxFileSizeBytes !== undefined) {
      mergedConfig.maxFileSizeBytes = args.maxFileSizeBytes;
    }

    if (args.includeHidden !== undefined) {
      mergedConfig.includeHidden = args.includeHidden;
    }

    if (args.listRules) {
      console.log(renderRuleList(mergedConfig));
      return;
    }

    const scanResult = await scanProject(args.targetPath, {
      cwd,
      config: mergedConfig,
      configPath: loadedConfig.configPath,
    });
    const consoleOutput = renderReport(scanResult, args.format);
    console.log(consoleOutput);

    if (args.reportPath !== undefined) {
      const reportPath = path.resolve(process.cwd(), args.reportPath);
      const reportFormat = args.format === "text" ? "markdown" : args.format;
      await writeNewReportFile(reportPath, renderReport(scanResult, reportFormat));
      console.error(`Report written to ${args.reportPath}`);
    }

    process.exitCode = shouldFail(scanResult, args.failOn) ? 1 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}

await main();
