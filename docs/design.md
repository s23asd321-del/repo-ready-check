# Design

Repo Ready Check uses a small TypeScript structure designed to stay easy to extend.

## CLI Entry

`src/cli.ts` parses arguments and coordinates the scan.

Current commands:

- `repo-ready-check`
- `repo-ready-check ./some-project`
- `repo-ready-check . --report repo-ready-report.md`
- `repo-ready-check . --format json`
- `repo-ready-check . --fail-on warning`
- `repo-ready-check . --config repo-ready-check.config.json`
- `repo-ready-check --list-rules`
- `repo-ready-check --help`
- `repo-ready-check --version`

The CLI does not access the network and does not automatically fix or modify the scanned project. It writes only the explicit report path passed by the user, and it refuses to overwrite an existing report file.

## Config

`src/config.ts` loads and validates `repo-ready-check.config.json` from the scanned project, or an explicit path from `--config`.

Supported config fields:

- `requiredFiles`
- `recommendedDirectories`
- `ignorePaths`
- `disabledRules`
- `ruleSeverities`
- `maxFileSizeBytes`
- `includeHidden`
- `respectGitignore`

CLI flags can override selected config values, such as `--max-file-size` and `--include-hidden`.

## Scanner

`src/scanner.ts` walks the local target directory and builds a scan context. It skips common generated or noisy directories:

- `.git`
- `node_modules`
- `dist`
- `coverage`
- `.cache`
- `.tmp`

The scanner also supports root `.gitignore` patterns and user-configured ignore patterns. It intentionally uses a small built-in gitignore-style matcher instead of adding a dependency-heavy ignore engine.

Soft links are not followed. They are recorded as skipped paths to avoid unexpected traversal outside the intended project tree.

Hidden paths are skipped unless `includeHidden` or `--include-hidden` is set, except for a small safe metadata and sensitive-file set such as `.gitignore`, `.env*`, `.npmrc`, `.pypirc`, and `.github`.

The scanner reads text files up to a conservative size limit and records skipped paths for unreadable directories, symlinks, oversized files, and binary-looking files.

## Rules

`src/rules.ts` contains the built-in rule list and config-derived rules. Each rule has:

- `id`
- `title`
- `description`
- `severity`
- `check`
- result message

Rules return structured results so future reporters can reuse the same scan output.

Config-derived rules currently support:

- Extra required files.
- Extra recommended directories.
- Per-rule severity overrides.
- Disabled rule filtering.

Node/npm-specific rule coverage is conditional. `package-json-metadata` only performs package metadata checks when `package.json` is present.

## Reporter

`src/reporter.ts` renders:

- Console summary.
- Markdown report.
- JSON report.
- Skipped path notes.

Potential secret findings are rendered as file paths, line numbers, and pattern names only. Matched values are intentionally omitted. JSON reports omit absolute `rootPath` data and use the relative display path.

Secret-like fixture false positives can be annotated with `repo-ready-check: ignore secret` or `repo-ready-check: allow secret` on the same line. These markers are intended for fictional fixtures or carefully reviewed false positives, not for hiding real credentials.

## Safety Guardrails

- No network access by default.
- No uploads.
- No telemetry.
- No automatic fixes.
- Report output only to an explicit `--report` path.
- No overwriting existing report files.
- No raw secret values in output.
- No legal or compliance conclusions.
- No complete security-audit claims.
