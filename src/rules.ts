import type {
  FindingLocation,
  RepoReadyConfig,
  Rule,
  ScanContext,
  Severity,
} from "./types.js";

const REQUIRED_GITIGNORE_ENTRIES = [
  ".env",
  ".env.*",
  "node_modules/",
  "dist/",
  "coverage/",
  "*.log",
];

const README_KEYWORDS = [
  "install",
  "usage",
  "license",
  "security",
  "contributing",
];

const SECRET_PATTERNS = [
  {
    name: "generic-secret-assignment",
    pattern:
      /\b(?:api[_-]?key|secret|token|password|passwd|private[_-]?key)\b\s*[:=]\s*["']?[^"'\s]{12,}/i,
  },
  {
    name: "aws-access-key-id",
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    name: "github-token",
    pattern: /\bgh[pousr]_[A-Za-z0-9_]{36,255}\b/,
  },
  {
    name: "npm-token",
    pattern: /\bnpm_[A-Za-z0-9]{36,}\b/,
  },
  {
    name: "npmrc-auth-token",
    pattern: /\/\/[^\s:]+\/?:_authToken\s*=\s*[A-Za-z0-9_-]{20,}/,
  },
  {
    name: "jwt",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
  {
    name: "google-api-key",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/,
  },
  {
    name: "slack-token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  },
  {
    name: "private-key-block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  },
];

const SECRET_ALLOWLIST_MARKERS = [
  "repo-ready-check: ignore secret",
  "repo-ready-check: allow secret",
];

const REQUIRED_PACKAGE_JSON_FIELDS = [
  "name",
  "version",
  "description",
  "license",
];

function hasFile(context: ScanContext, names: string[]): boolean {
  return names.some((name) => context.files.has(name));
}

function hasDir(context: ScanContext, names: string[]): boolean {
  return names.some((name) => context.dirs.has(name));
}

function requiredFileRule(
  id: string,
  title: string,
  description: string,
  names: string[],
  severity: Rule["severity"],
): Rule {
  return {
    id,
    title,
    description,
    severity,
    check(context) {
      const label = names.join(" or ");
      const passed = hasFile(context, names);

      return {
        passed,
        message: passed ? `${label} is present.` : `${label} is missing.`,
      };
    },
  };
}

function requiredDirectoryRule(
  id: string,
  title: string,
  description: string,
  names: string[],
  severity: Rule["severity"],
): Rule {
  return {
    id,
    title,
    description,
    severity,
    check(context) {
      const label = names.join(" or ");
      const passed = hasDir(context, names);

      return {
        passed,
        message: passed ? `${label}/ is present.` : `${label}/ is missing.`,
      };
    },
  };
}

function normalizeGitignoreLine(line: string): string {
  return line.trim();
}

function hasSecretAllowlistMarker(line: string): boolean {
  const lowerLine = line.toLowerCase();

  return SECRET_ALLOWLIST_MARKERS.some((marker) => lowerLine.includes(marker));
}

async function findPotentialSecrets(
  context: ScanContext,
): Promise<FindingLocation[]> {
  const findings: FindingLocation[] = [];

  for (const filePath of context.filePaths) {
    const content = await context.readTextFile(filePath);
    if (content === undefined) {
      continue;
    }

    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (hasSecretAllowlistMarker(line)) {
        return;
      }

      for (const { name, pattern } of SECRET_PATTERNS) {
        if (pattern.test(line)) {
          findings.push({
            filePath,
            line: index + 1,
            ruleName: name,
          });
          break;
        }
      }
    });
  }

  return findings;
}

function normalizePathList(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim().replace(/\\/g, "/").replace(/^\/+/, ""))
        .filter((value) => value.length > 0),
    ),
  );
}

function configuredRequiredFilesRule(files: string[]): Rule | undefined {
  const normalizedFiles = normalizePathList(files);

  if (normalizedFiles.length === 0) {
    return undefined;
  }

  return {
    id: "configured-required-files",
    title: "Configured required files",
    description:
      "Configured required files should exist before publishing the repository.",
    severity: "error",
    check(context) {
      const missing = normalizedFiles.filter((filePath) => !context.files.has(filePath));

      return {
        passed: missing.length === 0,
        message:
          missing.length === 0
            ? "All configured required files are present."
            : `Configured required files are missing: ${missing.join(", ")}.`,
      };
    },
  };
}

function configuredRecommendedDirectoriesRule(directories: string[]): Rule | undefined {
  const normalizedDirectories = normalizePathList(directories).map((directory) =>
    directory.endsWith("/") ? directory.slice(0, -1) : directory,
  );

  if (normalizedDirectories.length === 0) {
    return undefined;
  }

  return {
    id: "configured-recommended-directories",
    title: "Configured recommended directories",
    description:
      "Configured recommended directories help users find supporting material.",
    severity: "warning",
    check(context) {
      const missing = normalizedDirectories.filter(
        (directoryPath) => !context.dirs.has(directoryPath),
      );

      return {
        passed: missing.length === 0,
        message:
          missing.length === 0
            ? "All configured recommended directories are present."
            : `Configured recommended directories are missing: ${missing.join(", ")}.`,
      };
    },
  };
}

function applySeverityOverride(
  rule: Rule,
  ruleSeverities: Record<string, Severity> | undefined,
): Rule {
  const severity = ruleSeverities?.[rule.id] ?? rule.severity;

  if (severity === rule.severity) {
    return rule;
  }

  return {
    ...rule,
    severity,
  };
}

const baseRules: Rule[] = [
  requiredFileRule(
    "required-readme",
    "README file",
    "A public repository should explain what the project is and how to use it.",
    ["README.md"],
    "error",
  ),
  requiredFileRule(
    "required-license",
    "License file",
    "A public repository should clearly state its license.",
    ["LICENSE", "LICENSE.md", "LICENSE.txt"],
    "error",
  ),
  requiredFileRule(
    "required-changelog",
    "Changelog file",
    "A changelog helps users understand notable project changes.",
    ["CHANGELOG.md"],
    "warning",
  ),
  requiredFileRule(
    "required-contributing",
    "Contributing guide",
    "A contributing guide helps collaborators understand expectations.",
    ["CONTRIBUTING.md"],
    "warning",
  ),
  requiredFileRule(
    "required-security",
    "Security policy",
    "A security policy tells users how to report vulnerabilities safely.",
    ["SECURITY.md"],
    "warning",
  ),
  requiredDirectoryRule(
    "required-docs-directory",
    "Docs directory",
    "A docs directory gives maintainers room for design and usage details.",
    ["docs"],
    "warning",
  ),
  requiredDirectoryRule(
    "required-examples-directory",
    "Examples directory",
    "An examples directory helps users try the project safely.",
    ["examples"],
    "warning",
  ),
  requiredDirectoryRule(
    "required-tests-directory",
    "Tests directory",
    "A tests directory makes project quality easier to verify.",
    ["tests"],
    "warning",
  ),
  requiredFileRule(
    "required-gitignore",
    ".gitignore file",
    "A .gitignore file helps avoid committing generated files and local secrets.",
    [".gitignore"],
    "warning",
  ),
  {
    id: "gitignore-common-entries",
    title: ".gitignore common entries",
    description:
      ".gitignore should include common local secret, dependency, build, coverage, and log outputs.",
    severity: "warning",
    async check(context) {
      const content = await context.readTextFile(".gitignore");

      if (content === undefined) {
        return {
          passed: false,
          message: "Cannot check common .gitignore entries because .gitignore is missing.",
        };
      }

      const entries = new Set(
        content
          .split(/\r?\n/)
          .map(normalizeGitignoreLine)
          .filter((line) => line.length > 0 && !line.startsWith("#")),
      );
      const missing = REQUIRED_GITIGNORE_ENTRIES.filter(
        (entry) => !entries.has(entry),
      );

      return {
        passed: missing.length === 0,
        message:
          missing.length === 0
            ? ".gitignore contains the common recommended entries."
            : `.gitignore is missing common entries: ${missing.join(", ")}.`,
      };
    },
  },
  {
    id: "readme-basic-keywords",
    title: "README basic sections",
    description:
      "README.md should mention installation, usage, license, security, and contribution information.",
    severity: "warning",
    async check(context) {
      const content = await context.readTextFile("README.md");

      if (content === undefined) {
        return {
          passed: false,
          message: "Cannot check README sections because README.md is missing.",
        };
      }

      const lowerContent = content.toLowerCase();
      const missing = README_KEYWORDS.filter(
        (keyword) => !lowerContent.includes(keyword),
      );

      return {
        passed: missing.length === 0,
        message:
          missing.length === 0
            ? "README.md contains the basic recommended keywords."
            : `README.md is missing recommended keywords: ${missing.join(", ")}.`,
      };
    },
  },
  {
    id: "package-json-metadata",
    title: "package.json metadata",
    description:
      "Node/npm repositories should include basic package metadata when package.json is present.",
    severity: "warning",
    async check(context) {
      if (!context.files.has("package.json")) {
        return {
          passed: true,
          message: "package.json is not present, so npm metadata checks were skipped.",
        };
      }

      const content = await context.readTextFile("package.json");

      if (content === undefined) {
        return {
          passed: false,
          message: "package.json is present but could not be read.",
        };
      }

      let packageJson: Record<string, unknown>;

      try {
        const parsed = JSON.parse(content) as unknown;

        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          return {
            passed: false,
            message: "package.json must contain a JSON object.",
          };
        }

        packageJson = parsed as Record<string, unknown>;
      } catch {
        return {
          passed: false,
          message: "package.json is not valid JSON.",
        };
      }

      const missing = REQUIRED_PACKAGE_JSON_FIELDS.filter((field) => {
        const value = packageJson[field];

        return typeof value !== "string" || value.trim().length === 0;
      });

      return {
        passed: missing.length === 0,
        message:
          missing.length === 0
            ? "package.json contains basic npm metadata."
            : `package.json is missing basic metadata: ${missing.join(", ")}.`,
      };
    },
  },
  {
    id: "no-potential-secrets",
    title: "Potential secret exposure",
    description:
      "Repository files should not contain obvious credential-like values. Findings are reported without revealing matched values.",
    severity: "error",
    async check(context) {
      const locations = await findPotentialSecrets(context);

      return {
        passed: locations.length === 0,
        message:
          locations.length === 0
            ? "No potential secret patterns were detected."
            : `Potential sensitive values were detected in ${locations.length} location(s). Matched values are intentionally not shown.`,
        locations,
      };
    },
  },
];

export function createRules(config: RepoReadyConfig = {}): Rule[] {
  const configuredRules = [
    configuredRequiredFilesRule(config.requiredFiles ?? []),
    configuredRecommendedDirectoriesRule(config.recommendedDirectories ?? []),
  ].filter((rule): rule is Rule => rule !== undefined);
  const disabledRules = new Set(config.disabledRules ?? []);

  return [...baseRules, ...configuredRules]
    .filter((rule) => !disabledRules.has(rule.id))
    .map((rule) => applySeverityOverride(rule, config.ruleSeverities));
}

export const rules: Rule[] = createRules();
