# Roadmap

## v0.1: Public-Ready Local MVP

- TypeScript CLI.
- Local read-only scanner.
- Built-in checklist rules.
- Console summary.
- Markdown report output.
- Secret-like pattern detection without matched-value output.
- Tests and safe fictional fixtures.
- Public-facing documentation and safety notes.

## v0.2: Configurable CLI and Release Checks

- Add `repo-ready-check.config.json`.
- Add output formats for text, Markdown, and JSON.
- Add configurable fail thresholds.
- Add `.gitignore` and custom ignore handling.
- Add active rule listing and disabled rule config.
- Add Node/npm package metadata checks.
- Add stronger potential secret patterns.
- Add reviewed false-positive annotations for secret-like fixture values.
- Add npm pack and release validation checks.

## v0.3: Rule Coverage Improvements

- Improve README section checks.
- Add deeper package quality checks.
- Add docs quality heuristics.
- Add clearer severity guidance.
- Add more fixture regression cases.
- Consider rule enable/disable controls.

## v0.4: GitHub Action

- Wrap the local CLI in a GitHub Action.
- Keep permissions minimal and documented.
- Avoid uploading reports unless explicitly configured.
- Preserve the same redaction behavior as the local CLI.

## v1.0: Stable Rule Set and Report Format

- Stabilize rule ids and severities.
- Stabilize Markdown report sections.
- Add migration notes for breaking changes.
- Publish long-term maintenance expectations.
