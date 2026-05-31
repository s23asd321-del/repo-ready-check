import { promises as fs } from "node:fs";
import path from "node:path";

import { resolveConfig } from "./config.js";
import { createRules } from "./rules.js";
import type {
  RepoReadyConfig,
  ResolvedRepoReadyConfig,
  Rule,
  RuleResult,
  ScanContext,
  ScanResult,
  ScanSummary,
  SkippedPath,
} from "./types.js";

const ALWAYS_INCLUDED_HIDDEN_NAMES = new Set([
  ".env",
  ".gitignore",
  ".npmrc",
  ".pypirc",
]);

const ALWAYS_INCLUDED_HIDDEN_DIRECTORIES = new Set([".github"]);

export interface ScanOptions {
  cwd?: string;
  rules?: Rule[];
  config?: RepoReadyConfig;
  configPath?: string;
}

interface IgnoreRule {
  negate: boolean;
  directoryOnly: boolean;
  match: (relativePath: string, isDirectory: boolean) => boolean;
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function formatDisplayPath(rootPath: string, cwd: string): string {
  const relativePath = path.relative(cwd, rootPath);
  return relativePath.length === 0 ? "." : toPosixPath(relativePath);
}

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function globToRegExp(pattern: string): RegExp {
  let source = "";

  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    const nextChar = pattern[index + 1];

    if (char === "*" && nextChar === "*") {
      source += ".*";
      index += 1;
      continue;
    }

    if (char === "*") {
      source += "[^/]*";
      continue;
    }

    if (char === "?") {
      source += "[^/]";
      continue;
    }

    source += escapeRegExp(char);
  }

  return new RegExp(`^${source}$`);
}

function createIgnoreRule(rawPattern: string): IgnoreRule | undefined {
  const trimmedPattern = rawPattern.trim();

  if (trimmedPattern.length === 0 || trimmedPattern.startsWith("#")) {
    return undefined;
  }

  const negate = trimmedPattern.startsWith("!");
  const unprefixedPattern = negate ? trimmedPattern.slice(1).trim() : trimmedPattern;

  if (unprefixedPattern.length === 0) {
    return undefined;
  }

  const directoryOnly = unprefixedPattern.endsWith("/");
  const normalizedPattern = unprefixedPattern
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (normalizedPattern.length === 0) {
    return undefined;
  }

  const hasSlash = normalizedPattern.includes("/");
  const regex = globToRegExp(normalizedPattern);

  return {
    negate,
    directoryOnly,
    match(relativePath, isDirectory) {
      if (directoryOnly && !isDirectory) {
        return false;
      }

      const normalizedPath = relativePath.replace(/\\/g, "/");
      const segments = normalizedPath.split("/");

      if (hasSlash) {
        return (
          regex.test(normalizedPath) ||
          normalizedPath.startsWith(`${normalizedPattern}/`)
        );
      }

      return segments.some(
        (segment, index) =>
          regex.test(segment) ||
          normalizedPath.startsWith(`${normalizedPattern}/`) ||
          (directoryOnly &&
            index < segments.length - 1 &&
            regex.test(segment)),
      );
    },
  };
}

async function readGitignorePatterns(rootPath: string): Promise<string[]> {
  try {
    const content = await fs.readFile(path.join(rootPath, ".gitignore"), "utf8");

    return content.split(/\r?\n/);
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }
}

async function createIgnoreRules(
  rootPath: string,
  config: ResolvedRepoReadyConfig,
): Promise<IgnoreRule[]> {
  const gitignorePatterns = config.respectGitignore
    ? await readGitignorePatterns(rootPath)
    : [];

  return [...config.ignorePaths, ...gitignorePatterns]
    .map(createIgnoreRule)
    .filter((rule): rule is IgnoreRule => rule !== undefined);
}

function isIgnored(
  relativePath: string,
  isDirectory: boolean,
  ignoreRules: IgnoreRule[],
): boolean {
  let ignored = false;

  for (const rule of ignoreRules) {
    if (rule.match(relativePath, isDirectory)) {
      ignored = !rule.negate;
    }
  }

  return ignored;
}

function isHiddenPath(relativePath: string): boolean {
  return relativePath.split("/").some((segment) => segment.startsWith("."));
}

function isAlwaysIncludedHiddenPath(relativePath: string): boolean {
  const [firstSegment] = relativePath.split("/");
  const baseName = path.posix.basename(relativePath);

  return (
    ALWAYS_INCLUDED_HIDDEN_DIRECTORIES.has(firstSegment) ||
    ALWAYS_INCLUDED_HIDDEN_NAMES.has(baseName) ||
    baseName.startsWith(".env.")
  );
}

async function collectProjectPaths(
  rootPath: string,
  config: ResolvedRepoReadyConfig,
): Promise<{
  filePaths: string[];
  dirPaths: string[];
  skippedPaths: SkippedPath[];
}> {
  const filePaths: string[] = [];
  const dirPaths: string[] = [];
  const skippedPaths: SkippedPath[] = [];
  const ignoreRules = await createIgnoreRules(rootPath, config);

  async function walk(currentPath: string, relativePath: string): Promise<void> {
    let entries: import("node:fs").Dirent[];

    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      skippedPaths.push({
        path: relativePath.length === 0 ? "." : relativePath,
        reason: "Directory could not be read.",
      });
      return;
    }

    for (const entry of entries) {
      const childRelativePath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;
      const childPath = path.join(currentPath, entry.name);

      if (entry.isSymbolicLink()) {
        skippedPaths.push({
          path: childRelativePath,
          reason: "Symbolic links are skipped.",
        });
        continue;
      }

      if (
        !config.includeHidden &&
        isHiddenPath(childRelativePath) &&
        !isAlwaysIncludedHiddenPath(childRelativePath)
      ) {
        continue;
      }

      if (isIgnored(childRelativePath, entry.isDirectory(), ignoreRules)) {
        continue;
      }

      if (entry.isDirectory()) {
        dirPaths.push(childRelativePath);
        await walk(childPath, childRelativePath);
        continue;
      }

      if (entry.isFile()) {
        filePaths.push(childRelativePath);
      }
    }
  }

  await walk(rootPath, "");

  filePaths.sort();
  dirPaths.sort();

  return { filePaths, dirPaths, skippedPaths };
}

async function readTextFile(
  rootPath: string,
  filePath: string,
  config: ResolvedRepoReadyConfig,
  recordSkipped: (path: string, reason: string) => void,
): Promise<string | undefined> {
  const absolutePath = path.join(rootPath, filePath);

  try {
    const stat = await fs.stat(absolutePath);

    if (!stat.isFile()) {
      recordSkipped(filePath, "Path is not a regular file.");
      return undefined;
    }

    if (stat.size > config.maxFileSizeBytes) {
      recordSkipped(filePath, "File is larger than the text scan limit.");
      return undefined;
    }

    const buffer = await fs.readFile(absolutePath);

    if (buffer.includes(0)) {
      recordSkipped(filePath, "File appears to be binary.");
      return undefined;
    }

    return buffer.toString("utf8");
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined;
    }

    recordSkipped(filePath, "File could not be read.");
    return undefined;
  }
}

function summarize(results: RuleResult[]): ScanSummary {
  return {
    total: results.length,
    passed: results.filter((result) => result.passed).length,
    warnings: results.filter((result) => result.status === "warning").length,
    errors: results.filter((result) => result.status === "error").length,
    infos: results.filter((result) => result.status === "info").length,
  };
}

export async function scanProject(
  targetPath = ".",
  options: ScanOptions = {},
): Promise<ScanResult> {
  const cwd = options.cwd ?? process.cwd();
  const rootPath = path.resolve(cwd, targetPath);
  const config = resolveConfig(options.config);
  const stat = await fs.stat(rootPath);

  if (!stat.isDirectory()) {
    throw new Error(`Scan target is not a directory: ${targetPath}`);
  }

  const { filePaths, dirPaths, skippedPaths } =
    await collectProjectPaths(rootPath, config);
  const skippedKeys = new Set(
    skippedPaths.map((skippedPath) => skippedPath.path),
  );
  const recordSkipped = (skippedPath: string, reason: string): void => {
    if (skippedKeys.has(skippedPath)) {
      return;
    }

    skippedKeys.add(skippedPath);
    skippedPaths.push({
      path: skippedPath,
      reason,
    });
  };
  const context: ScanContext = {
    rootPath,
    displayPath: formatDisplayPath(rootPath, cwd),
    projectName: path.basename(rootPath),
    config,
    filePaths,
    dirPaths,
    skippedPaths,
    files: new Set(filePaths),
    dirs: new Set(dirPaths),
    readTextFile: (relativePath) =>
      readTextFile(rootPath, relativePath, config, recordSkipped),
  };

  const activeRules = options.rules ?? createRules(config);
  const results: RuleResult[] = [];

  for (const rule of activeRules) {
    const checkResult = await rule.check(context);
    const status = checkResult.passed ? "passed" : rule.severity;

    results.push({
      id: rule.id,
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      status,
      passed: checkResult.passed,
      message: checkResult.message,
      locations: checkResult.locations ?? [],
    });
  }

  return {
    projectName: context.projectName,
    rootPath,
    displayPath: context.displayPath,
    scannedAt: new Date().toISOString(),
    configPath: options.configPath,
    results,
    skippedPaths,
    summary: summarize(results),
  };
}
