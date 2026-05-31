# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by Keep a Changelog, and this project aims to follow semantic versioning once releases begin.

## [Unreleased]

### Added

- Pending future changes.

## [0.2.0] - 2026-06-06

### Added

- `repo-ready-check.config.json` support for extra required files, recommended directories, ignore paths, rule severity overrides, max file size, hidden path behavior, and `.gitignore` handling.
- CLI options: `--format`, `--fail-on`, `--config`, `--max-file-size`, `--include-hidden`, `--no-values`, and `--version`.
- `--list-rules` for printing active rule ids, severities, and titles.
- JSON report output that omits absolute root paths.
- Config-derived rules for required files and recommended directories.
- `disabledRules` config support for omitting rules from the active rule list.
- Conditional `package-json-metadata` rule for Node/npm repositories.
- Additional potential secret patterns for GitHub tokens, npm tokens, `.npmrc` auth tokens, JWT-like values, Google API keys, Slack tokens, and private key blocks.
- Same-line secret allowlist markers for reviewed fictional fixture values and false positives.
- Basic `.gitignore` and user ignore pattern handling.
- Symlink skip reporting.
- npm pack dry-run checks, Node 20/22 CI matrix, release package validation workflow, and changelog version check script.

### Changed

- Potential secret findings now include a non-sensitive pattern name while still omitting matched values.
- Report output can be selected independently from the default text console summary.

### Security

- Raw secret-like values remain redacted in text, Markdown, and JSON output.
- Symlinks are not followed during scans.

## [0.1.0] - 2026-06-01

### Added

- Public-ready MVP CLI.
- Local read-only scanner.
- Built-in repository readiness rules.
- Console summary output.
- Markdown report output with safety and disclaimer sections.
- Potential secret detection that reports locations without matched values.
- Skipped path reporting for binary, oversized, or unreadable paths.
- Rule, scanner, reporter, fixture regression, and redaction tests.
- CLI integration tests.
- Safe fictional examples and fixtures.
- GitHub Actions CI workflow.
- Code of conduct.

### Security

- Documented local-first, no-upload, no-telemetry, no-raw-secret-output boundaries.
- Report files are created only when explicitly requested and are not overwritten.
