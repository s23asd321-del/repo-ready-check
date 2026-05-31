# Repo Ready Check Report

## Project

- Project name: minimal-repo
- Scanned at: 2026-01-01T00:00:00.000Z
- Scanned path: examples/minimal-repo
- Config path: repo-ready-check.config.example.json

## Summary

| Metric | Count |
| --- | ---: |
| Total checks | 15 |
| Passed | 15 |
| Warnings | 0 |
| Errors | 0 |
| Skipped paths | 0 |

## Detailed Check Results

| Status | Severity | Rule | Title | Message | Location |
| --- | --- | --- | --- | --- | --- |
| PASS | error | required-readme | README file | README.md is present. | - |
| PASS | error | required-license | License file | LICENSE or LICENSE.md or LICENSE.txt is present. | - |
| PASS | warning | required-changelog | Changelog file | CHANGELOG.md is present. | - |
| PASS | warning | required-contributing | Contributing guide | CONTRIBUTING.md is present. | - |
| PASS | warning | required-security | Security policy | SECURITY.md is present. | - |
| PASS | warning | required-docs-directory | Docs directory | docs/ is present. | - |
| PASS | warning | required-examples-directory | Examples directory | examples/ is present. | - |
| PASS | warning | required-tests-directory | Tests directory | tests/ is present. | - |
| PASS | warning | required-gitignore | .gitignore file | .gitignore is present. | - |
| PASS | warning | gitignore-common-entries | .gitignore common entries | .gitignore contains the common recommended entries. | - |
| PASS | warning | readme-basic-keywords | README basic sections | README.md contains the basic recommended keywords. | - |
| PASS | warning | package-json-metadata | package.json metadata | package.json is not present, so npm metadata checks were skipped. | - |
| PASS | error | no-potential-secrets | Potential secret exposure | No potential secret patterns were detected. | - |
| PASS | warning | configured-required-files | Configured required files | All configured required files are present. | - |
| PASS | warning | configured-recommended-directories | Configured recommended directories | All configured recommended directories are present. | - |

## Skipped Paths

Some files or directories may be skipped when they cannot be read safely as text, are larger than the scan limit, are symlinks, or appear to be binary.

| Path | Reason |
| --- | --- |
| - | - |

## Security and Privacy Notes

Repo Ready Check runs locally by default. It does not require network access, does not upload scan results, does not collect telemetry, and does not automatically fix or modify the scanned project. A report file is written only when requested with `--report`, and existing report files are not overwritten.

Potential secret findings intentionally omit matched values. Reports include only file paths, line numbers, rule names, and non-sensitive pattern names so maintainers can review the source locally.

## Disclaimer

This report is not legal advice, not compliance certification, and not a complete security audit. Results are informational engineering maintenance guidance only.
