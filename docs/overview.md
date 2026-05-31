# Overview

Repo Ready Check is a local-first CLI for auditing whether a project is ready to share on GitHub.

The MVP scans a local directory, runs a small built-in and config-derived rule set, prints a console summary, and can write text, Markdown, or JSON output.

## What It Checks

- Recommended repository files.
- Recommended repository directories.
- Common `.gitignore` entries.
- Basic README keywords.
- Basic `package.json` metadata when `package.json` is present.
- Obvious potential secret patterns.
- Extra required files and recommended directories from config.
- Root `.gitignore` and user-configured ignore patterns.
- Skipped paths for symlinks, unreadable paths, oversized files, or binary-looking files.

## What It Does Not Do

- It does not scan the network.
- It does not upload files or reports.
- It does not collect telemetry.
- It does not automatically fix or modify the scanned project.
- It writes a report file only when `--report` is explicitly provided.
- It does not display matched secret-like values.
- It does not follow symlinks.
- It does not provide legal advice, compliance certification, or a complete security audit.

## Outputs

The CLI prints a text summary by default. `--format markdown` and `--format json` can change console output. If `--report <file>` is provided, the CLI also creates a report at that path. Existing report files are not overwritten.

Reports include rule ids, status, severity, messages, locations where relevant, and skipped path notes.

JSON reports omit absolute root paths and use the display path instead.

## Configuration

The default config path is `repo-ready-check.config.json` in the scanned project. Use `--config <path>` to choose another file.

Config can define extra required files, recommended directories, ignore patterns, rule severity overrides, max scanned file size, hidden path behavior, and `.gitignore` handling.
