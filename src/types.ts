export type Severity = "info" | "warning" | "error";

export type ResultStatus = "passed" | Severity;

export type OutputFormat = "json" | "markdown" | "text";

export type FailOn = "warning" | "error";

export interface FindingLocation {
  filePath: string;
  line?: number;
  ruleName?: string;
}

export interface SkippedPath {
  path: string;
  reason: string;
}

export interface RuleCheckResult {
  passed: boolean;
  message: string;
  locations?: FindingLocation[];
}

export interface ScanContext {
  rootPath: string;
  displayPath: string;
  projectName: string;
  config: ResolvedRepoReadyConfig;
  filePaths: string[];
  dirPaths: string[];
  skippedPaths: SkippedPath[];
  files: Set<string>;
  dirs: Set<string>;
  readTextFile: (relativePath: string) => Promise<string | undefined>;
}

export interface Rule {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  check: (context: ScanContext) => Promise<RuleCheckResult> | RuleCheckResult;
}

export interface RuleResult {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: ResultStatus;
  passed: boolean;
  message: string;
  locations: FindingLocation[];
}

export interface ScanSummary {
  total: number;
  passed: number;
  warnings: number;
  errors: number;
  infos: number;
}

export interface ScanResult {
  projectName: string;
  rootPath: string;
  displayPath: string;
  scannedAt: string;
  configPath?: string;
  results: RuleResult[];
  skippedPaths: SkippedPath[];
  summary: ScanSummary;
}

export interface RepoReadyConfig {
  requiredFiles?: string[];
  recommendedDirectories?: string[];
  ignorePaths?: string[];
  disabledRules?: string[];
  ruleSeverities?: Record<string, Severity>;
  maxFileSizeBytes?: number;
  includeHidden?: boolean;
  respectGitignore?: boolean;
}

export interface ResolvedRepoReadyConfig {
  requiredFiles: string[];
  recommendedDirectories: string[];
  ignorePaths: string[];
  disabledRules: string[];
  ruleSeverities: Record<string, Severity>;
  maxFileSizeBytes: number;
  includeHidden: boolean;
  respectGitignore: boolean;
}
