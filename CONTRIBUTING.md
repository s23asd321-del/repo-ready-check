# Contributing

Thanks for helping improve Repo Ready Check.

## Principles

- Keep changes small and reviewable.
- Preserve local-first behavior.
- Avoid unnecessary dependencies.
- Do not add network access by default.
- Do not print raw secret values.
- Do not automatically modify scanned projects.
- Update documentation when behavior changes.

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
npm run check
```

## Adding Rules

Every new rule should include:

- Stable rule id.
- Title and description.
- Severity: `info`, `warning`, or `error`.
- Result message.
- Test fixture.
- Rule test.
- Documentation update in `docs/checklist-rules.md`.
- README or CLI docs update when user-facing behavior changes.

If a rule touches sensitive-looking content, it must not render matched values in console output, Markdown reports, test snapshots, or errors.

Secret allowlist annotations should be used only for fictional fixtures or carefully reviewed false positives. Do not use them to hide real credentials in examples, tests, logs, or docs.

## Changing CLI or Config Behavior

When changing arguments, output formats, exit behavior, config fields, ignore behavior, or report structure, update:

- `README.md`
- `docs/cli-spec.md`
- `docs/design.md`
- Tests for CLI, scanner, reporter, or config behavior.
- `CHANGELOG.md` for released or release-candidate changes.

Keep config validation strict and avoid adding dependencies unless they clearly reduce risk or complexity.

## Fixtures

Fixtures must use fictional content only. Do not add real tokens, passwords, cookies, API keys, private keys, proxy subscription links, internal repository data, or private project names.
