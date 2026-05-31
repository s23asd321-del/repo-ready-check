# Checklist Rules

The MVP ships with a small built-in rule set.

| Rule id | Severity | What it checks |
| --- | --- | --- |
| `required-readme` | error | `README.md` exists. |
| `required-license` | error | `LICENSE`, `LICENSE.md`, or `LICENSE.txt` exists. |
| `required-changelog` | warning | `CHANGELOG.md` exists. |
| `required-contributing` | warning | `CONTRIBUTING.md` exists. |
| `required-security` | warning | `SECURITY.md` exists. |
| `required-docs-directory` | warning | `docs/` exists. |
| `required-examples-directory` | warning | `examples/` exists. |
| `required-tests-directory` | warning | `tests/` exists. |
| `required-gitignore` | warning | `.gitignore` exists. |
| `gitignore-common-entries` | warning | `.gitignore` includes `.env`, `.env.*`, `node_modules/`, `dist/`, `coverage/`, and `*.log`. |
| `readme-basic-keywords` | warning | README mentions install, usage, license, security, and contributing. |
| `package-json-metadata` | warning | If `package.json` exists, it includes `name`, `version`, `description`, and `license`. |
| `no-potential-secrets` | error | Obvious credential-like patterns are not present. Matched values are never printed. |
| `configured-required-files` | error | Extra files listed in `requiredFiles` exist. Only active when configured. |
| `configured-recommended-directories` | warning | Extra directories listed in `recommendedDirectories` exist. Only active when configured. |

## Secret Pattern Coverage

The `no-potential-secrets` rule is best-effort. It currently checks for:

- Generic secret-like assignments.
- AWS access key ids.
- GitHub token-like values.
- npm token-like values.
- `.npmrc` auth token lines.
- JWT-like values.
- Google API key-like values.
- Slack token-like values.
- Private key block headers.

Findings include only file path, line number, and pattern name. Matched values are never printed.

Reviewed false positives can be annotated on the same line with `repo-ready-check: ignore secret` or `repo-ready-check: allow secret`. Use this only for known-safe fictional fixture values or carefully reviewed false positives.

## Configurable Severity

Config files can override rule severity:

```json
{
  "ruleSeverities": {
    "required-security": "error",
    "configured-required-files": "warning"
  }
}
```

Overrides should be used carefully because they affect CLI exit behavior.

## Adding Rules

Each new rule must include:

- Stable id.
- Title and description.
- Severity.
- Check implementation.
- Result message.
- Test fixture.
- Test coverage.
- Documentation update.

Rules that inspect sensitive-looking content must report only file path, line number, rule id, and a non-sensitive pattern name.
