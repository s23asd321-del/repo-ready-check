# Configuration

Repo Ready Check looks for `repo-ready-check.config.json` in the scanned project by default. Use `--config <path>` to select another file.

Example:

```json
{
  "requiredFiles": ["CODE_OF_CONDUCT.md"],
  "recommendedDirectories": ["scripts"],
  "ignorePaths": ["vendor/", "tmp/**"],
  "disabledRules": [],
  "ruleSeverities": {
    "required-security": "error",
    "configured-required-files": "warning"
  },
  "maxFileSizeBytes": 1048576,
  "includeHidden": false,
  "respectGitignore": true
}
```

## Fields

| Field | Type | Purpose |
| --- | --- | --- |
| `requiredFiles` | string array | Extra project-relative files that must exist. |
| `recommendedDirectories` | string array | Extra project-relative directories that should exist. |
| `ignorePaths` | string array | Additional gitignore-style patterns to skip. |
| `disabledRules` | string array | Rule ids to omit from the active rule list. |
| `ruleSeverities` | object | Per-rule severity overrides: `info`, `warning`, or `error`. |
| `maxFileSizeBytes` | positive integer | Maximum text file size scanned by content rules. |
| `includeHidden` | boolean | Include hidden files and directories beyond the default metadata and sensitive-file set. |
| `respectGitignore` | boolean | Respect root `.gitignore` patterns while walking files. |

## Ignore Behavior

The scanner always avoids noisy generated paths such as `.git/`, `node_modules/`, `dist/`, `coverage/`, `.cache/`, and `.tmp/`.

When `respectGitignore` is true, root `.gitignore` patterns are applied with a small built-in matcher. The matcher supports common exact, directory, `*`, `?`, `**`, and negated `!` patterns, but it is not a full replacement for Git's own ignore engine.

Symlinks are never followed. They are reported as skipped paths.

## Safety

Config files do not enable network access, uploads, telemetry, or automatic fixes. They only affect local scanning and reporting behavior.

Use `repo-ready-check --list-rules` to see rule ids before setting `disabledRules` or `ruleSeverities`.
