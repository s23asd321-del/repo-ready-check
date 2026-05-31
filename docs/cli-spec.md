# CLI Spec

## Usage

```bash
repo-ready-check [project-directory] [options]
```

## Runtime Requirements

- Node.js 20.19.0 or newer.
- No network access is required at runtime.

## Commands

Scan the current directory:

```bash
repo-ready-check
```

Scan a specific local directory:

```bash
repo-ready-check ./my-project
```

Write a Markdown report:

```bash
repo-ready-check . --report repo-ready-report.md
```

The report path is created only when `--report` is supplied. Existing files are not overwritten. Report format defaults to Markdown unless `--format json` or `--format markdown` is selected.

Choose output format:

```bash
repo-ready-check . --format text
repo-ready-check . --format markdown
repo-ready-check . --format json
```

Fail on warnings:

```bash
repo-ready-check . --fail-on warning
```

Use a config file:

```bash
repo-ready-check . --config repo-ready-check.config.json
```

Override the text scan limit:

```bash
repo-ready-check . --max-file-size 2097152
```

Include hidden files beyond the default metadata set:

```bash
repo-ready-check . --include-hidden
```

List active rules:

```bash
repo-ready-check --list-rules
repo-ready-check . --config repo-ready-check.config.json --list-rules
```

Show help:

```bash
repo-ready-check --help
```

Show version:

```bash
repo-ready-check --version
```

## Options

| Option | Values | Default | Notes |
| --- | --- | --- | --- |
| `--report <path>` | file path | none | Creates a report file and refuses to overwrite existing files. |
| `--format <text\|markdown\|json>` | `text`, `markdown`, `json` | `text` | Controls console output and report format when not using the default text console. |
| `--fail-on <error\|warning>` | `error`, `warning` | `error` | Controls whether warnings produce exit code `1`. |
| `--config <path>` | file path | `repo-ready-check.config.json` in target | Explicit config path. |
| `--max-file-size <bytes>` | positive integer | `1048576` | Maximum text file size read by content rules. |
| `--include-hidden` | boolean flag | false | Includes hidden files/directories beyond default safe metadata and sensitive-file names. |
| `--no-values` | boolean flag | true | Accepted for explicit redaction; raw secret-like values are never printed. |
| `--list-rules` | boolean flag | false | Prints active rule ids, severities, and titles, then exits. |
| `--version` | boolean flag | false | Prints package version. |
| `--help` | boolean flag | false | Prints usage. |

## Defaults

- Target path defaults to `.`.
- Scan is read-only.
- Report writing is explicit through `--report`.
- Existing report files are not overwritten.
- Root `.gitignore` patterns are respected by default.
- No network access is needed.
- No telemetry is collected.
- No automatic fixes are applied.
- Secret-like matches are not printed.

## Console Output

The console summary includes:

- Project name.
- Scanned path.
- Total checks.
- Passed count.
- Warning count.
- Error count.
- Skipped path count.
- Short finding list for failed checks.

## JSON Output

JSON output intentionally omits absolute `rootPath` data. It includes:

- Project name.
- Scan time.
- Relative scanned path.
- Optional config path.
- Summary.
- Detailed results.
- Skipped paths.
- Safety and disclaimer notes.

## Markdown Report

The Markdown report includes:

- Project name.
- Scan time.
- Scanned path.
- Summary table.
- Detailed rule results.
- Skipped paths.
- Security and privacy notes.
- Disclaimer.

## Exit Codes

- `0`: Scan completed without findings at or above the configured `--fail-on` threshold.
- `1`: Scan completed with findings at or above the configured `--fail-on` threshold.
- `2`: Invalid arguments, unreadable target, or report write failure.

## Config File

The config file is JSON:

```json
{
  "requiredFiles": ["CODE_OF_CONDUCT.md"],
  "recommendedDirectories": ["scripts"],
  "ignorePaths": ["vendor/", "tmp/**"],
  "disabledRules": [],
  "ruleSeverities": {
    "required-security": "error"
  },
  "maxFileSizeBytes": 1048576,
  "includeHidden": false,
  "respectGitignore": true
}
```
