import { promises as fs } from "node:fs";
import path from "node:path";

import type { RepoReadyConfig, ResolvedRepoReadyConfig, Severity } from "./types.js";

export const CONFIG_FILE_NAME = "repo-ready-check.config.json";

const DEFAULT_IGNORE_PATHS = [
  ".git/",
  "node_modules/",
  "dist/",
  "coverage/",
  ".cache/",
  ".tmp/",
];

export const DEFAULT_CONFIG: ResolvedRepoReadyConfig = {
  requiredFiles: [],
  recommendedDirectories: [],
  ignorePaths: DEFAULT_IGNORE_PATHS,
  disabledRules: [],
  ruleSeverities: {},
  maxFileSizeBytes: 1024 * 1024,
  includeHidden: false,
  respectGitignore: true,
};

export interface LoadedConfig {
  config: RepoReadyConfig;
  configPath?: string;
}

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

function ensureStringArray(value: unknown, fieldName: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    throw new Error(`${fieldName} must be an array of strings.`);
  }

  return value;
}

function ensureBoolean(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be a boolean.`);
  }

  return value;
}

function ensurePositiveInteger(value: unknown, fieldName: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return value;
}

function ensureRuleSeverities(value: unknown): Record<string, Severity> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("ruleSeverities must be an object.");
  }

  const severities: Record<string, Severity> = {};

  for (const [ruleId, severity] of Object.entries(value)) {
    if (severity !== "info" && severity !== "warning" && severity !== "error") {
      throw new Error(
        `ruleSeverities.${ruleId} must be one of: info, warning, error.`,
      );
    }

    severities[ruleId] = severity;
  }

  return severities;
}

function parseConfig(rawConfig: unknown): RepoReadyConfig {
  if (typeof rawConfig !== "object" || rawConfig === null || Array.isArray(rawConfig)) {
    throw new Error("Config file must contain a JSON object.");
  }

  const config = rawConfig as Record<string, unknown>;

  return {
    requiredFiles: ensureStringArray(config.requiredFiles, "requiredFiles"),
    recommendedDirectories: ensureStringArray(
      config.recommendedDirectories,
      "recommendedDirectories",
    ),
    ignorePaths: ensureStringArray(config.ignorePaths, "ignorePaths"),
    disabledRules: ensureStringArray(config.disabledRules, "disabledRules"),
    ruleSeverities: ensureRuleSeverities(config.ruleSeverities),
    maxFileSizeBytes: ensurePositiveInteger(
      config.maxFileSizeBytes,
      "maxFileSizeBytes",
    ),
    includeHidden: ensureBoolean(config.includeHidden, "includeHidden"),
    respectGitignore: ensureBoolean(config.respectGitignore, "respectGitignore"),
  };
}

export async function loadConfig(
  rootPath: string,
  cwd: string,
  configPath?: string,
): Promise<LoadedConfig> {
  const resolvedConfigPath =
    configPath === undefined
      ? path.join(rootPath, CONFIG_FILE_NAME)
      : path.resolve(cwd, configPath);

  try {
    const content = await fs.readFile(resolvedConfigPath, "utf8");
    const parsed = JSON.parse(content) as unknown;

    return {
      config: parseConfig(parsed),
      configPath: path.relative(cwd, resolvedConfigPath) || CONFIG_FILE_NAME,
    };
  } catch (error) {
    if (configPath === undefined && isNotFoundError(error)) {
      return { config: {} };
    }

    if (error instanceof SyntaxError) {
      throw new Error(`Config file is not valid JSON: ${resolvedConfigPath}`);
    }

    throw error;
  }
}

export function resolveConfig(
  fileConfig: RepoReadyConfig = {},
  cliConfig: RepoReadyConfig = {},
): ResolvedRepoReadyConfig {
  return {
    requiredFiles:
      cliConfig.requiredFiles ?? fileConfig.requiredFiles ?? DEFAULT_CONFIG.requiredFiles,
    recommendedDirectories:
      cliConfig.recommendedDirectories ??
      fileConfig.recommendedDirectories ??
      DEFAULT_CONFIG.recommendedDirectories,
    ignorePaths: [
      ...DEFAULT_CONFIG.ignorePaths,
      ...(fileConfig.ignorePaths ?? []),
      ...(cliConfig.ignorePaths ?? []),
    ],
    disabledRules:
      cliConfig.disabledRules ??
      fileConfig.disabledRules ??
      DEFAULT_CONFIG.disabledRules,
    ruleSeverities: {
      ...DEFAULT_CONFIG.ruleSeverities,
      ...(fileConfig.ruleSeverities ?? {}),
      ...(cliConfig.ruleSeverities ?? {}),
    },
    maxFileSizeBytes:
      cliConfig.maxFileSizeBytes ??
      fileConfig.maxFileSizeBytes ??
      DEFAULT_CONFIG.maxFileSizeBytes,
    includeHidden:
      cliConfig.includeHidden ?? fileConfig.includeHidden ?? DEFAULT_CONFIG.includeHidden,
    respectGitignore:
      cliConfig.respectGitignore ??
      fileConfig.respectGitignore ??
      DEFAULT_CONFIG.respectGitignore,
  };
}
