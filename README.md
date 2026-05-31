# Repo Ready Check

Local-first readiness checks for GitHub repositories.

`repo-ready-check` is a small Node.js CLI that scans a local project directory and reports whether the repository has the basic files and safety signals expected before sharing it on GitHub.

It is designed for maintainers who want a quick, conservative pre-publish review. It runs locally, does not need a token, does not read from the network, does not upload results, and does not automatically fix or modify the scanned project. If `--report` is provided, it writes only the report file path the user explicitly requested.

## Why This Tool Exists

Repositories are often published before they have the files that help users and contributors understand the project:

- A clear `README.md`
- A license
- A changelog
- Contribution guidance
- Security reporting instructions
- Basic docs, examples, and tests
- `.gitignore` entries that reduce accidental commits of local secrets or build output

Repo Ready Check turns those expectations into a repeatable local audit with text, Markdown, or JSON output.

## Positioning

This project is intentionally focused on the Node/npm ecosystem: it ships as a TypeScript CLI, uses npm scripts, and is designed to be easy to run from JavaScript projects and future GitHub Action workflows.

If this repository is used alongside `repo-readiness-kit`, keep the split clear:

- `repo-ready-check`: Node/npm-first CLI for GitHub repository readiness checks.
- `repo-readiness-kit`: Python-first tooling and examples.

Both projects can share the same safety principles, but their runtime, packaging, and ecosystem assumptions should stay distinct.

## Installation

Requirements:

- Node.js 20.19.0 or newer.
- npm.

From a cloned copy of this repository:

```bash
npm install
npm run build
```

During local development, run the built CLI with:

```bash
node dist/cli.js --help
```

To make the command available locally while developing:

```bash
npm link
repo-ready-check --help
```

This package is not published to npm yet.

## Usage

Scan the current directory:

```bash
repo-ready-check
```

Scan another local project:

```bash
repo-ready-check ./some-project
```

Write a Markdown report:

```bash
repo-ready-check . --report repo-ready-report.md
```

Choose console output format:

```bash
repo-ready-check . --format json
repo-ready-check . --format markdown
```

Fail CI on warnings as well as errors:

```bash
repo-ready-check . --fail-on warning
```

Use a config file:

```bash
repo-ready-check . --config repo-ready-check.config.json
```

List active rule ids:

```bash
repo-ready-check --list-rules
```

Report files are created only when `--report` is provided. Existing report files are not overwritten; choose a new path or remove the old report before rerunning.

Show help:

```bash
repo-ready-check --help
```

## Example Output

```text
Repo Ready Check
Project: my-project
Scanned path: .
Total checks: 13
Passed: 11
Warnings: 2
Errors: 0
Skipped paths: 0

Findings:
- [WARNING] required-security: SECURITY.md is missing.
- [WARNING] readme-basic-keywords: README.md is missing recommended keywords: security.
```

When potential sensitive values are detected, the output intentionally shows only the file path, line number, rule id, and pattern name. It does not print the matched value.

## Configuration

By default the CLI looks for `repo-ready-check.config.json` in the scanned project. You can also pass an explicit path with `--config`.

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

Supported config fields:

- `requiredFiles`: extra project-relative files that must exist.
- `recommendedDirectories`: extra project-relative directories that should exist.
- `ignorePaths`: additional gitignore-style patterns to skip during scanning.
- `disabledRules`: rule ids to omit from the active rule list.
- `ruleSeverities`: per-rule severity overrides: `info`, `warning`, or `error`.
- `maxFileSizeBytes`: maximum text file size scanned.
- `includeHidden`: include hidden files and directories beyond the default safe metadata set.
- `respectGitignore`: use root `.gitignore` patterns while walking files.

See [repo-ready-check.config.example.json](repo-ready-check.config.example.json) and [docs/configuration.md](docs/configuration.md).

## MVP Scope

The current MVP checks:

- `README.md`
- `LICENSE`, `LICENSE.md`, or `LICENSE.txt`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `docs/`
- `examples/`
- `tests/`
- `.gitignore`
- Common `.gitignore` entries: `.env`, `.env.*`, `node_modules/`, `dist/`, `coverage/`, `*.log`
- README keywords: install, usage, license, security, contributing
- Basic `package.json` metadata when `package.json` is present
- Obvious potential secret patterns, including generic assignments, AWS key ids, GitHub tokens, npm tokens, `.npmrc` auth tokens, JWT-like values, Google API keys, Slack tokens, and private key blocks
- Configured required files and recommended directories
- Configurable rule severities, ignore paths, hidden-file behavior, and max file size
- Skipped paths for symlinks, files or directories that cannot be read safely as text, files larger than the scan limit, or binary-looking files

For reviewed false positives in fictional fixtures or examples, a line can be annotated with `repo-ready-check: ignore secret`. This should be used sparingly and only when the value is known to be safe or fictional.

## Non-Goals

Repo Ready Check is not:

- A complete security scanner
- A legal compliance tool
- A compliance certification system
- A software composition analysis platform
- A credential validation or recovery tool
- A network crawler
- An auto-fixer for user projects
- A bypass, cracking, piracy, attack, or abuse tool

## Safety and Privacy Boundaries

By default, Repo Ready Check:

- Runs locally
- Performs a read-only scan
- Does not access the network
- Does not upload data
- Does not collect telemetry
- Does not require tokens
- Does not automatically fix or modify scanned projects
- Writes a report file only when `--report` is explicitly provided
- Does not overwrite existing report files
- Does not print raw secret values

Secret-like detection is best-effort and does not guarantee 100% detection.

Some files may be skipped when they are symlinks, unreadable, binary-looking, or larger than the text scan limit. Skipped paths are listed in the console and reports.

## CLI Options

```text
--report <path>
--format <text|markdown|json>
--fail-on <error|warning>
--config <path>
--max-file-size <bytes>
--include-hidden
--no-values
--list-rules
--version
--help
```

`--no-values` is accepted for explicit safety in scripts; raw matched secret-like values are never printed.

## Roadmap

- `v0.1`: Public-ready local MVP with CLI, rules, Markdown report, docs, and tests
- `v0.2`: Config file, output formats, fail thresholds, ignore improvements, Node/npm metadata checks, stronger secret patterns, and release checks
- `v0.3`: Better README heuristics, package quality checks, and clearer scoring
- `v0.4`: Optional GitHub Action wrapper
- `v1.0`: Stable rule set and report format

See [ROADMAP.md](ROADMAP.md).

## Contributing

Contributions should be small, testable, and documented. Each new rule should include rule metadata, tests, fixtures, and documentation updates.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).

## Contributors

- s23asd321-del: project owner and maintainer
- OpenAI Codex: AI-assisted development support.

## License

MIT License. See [LICENSE](LICENSE).
