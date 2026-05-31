# AGENTS.md

This file defines development rules for future Codex or agent-assisted work on Repo Ready Check.

## Required Behavior

- Do not output raw secret values. Show only file path, line number, rule id, and non-sensitive pattern name.
- Do not upload scanned files, scan results, reports, logs, private fixtures, or project metadata.
- Do not read from the network by default.
- Do not automatically modify a user's scanned project.
- Do not introduce unnecessary dependencies.
- Prefer small, focused, testable changes.
- Preserve local-first behavior unless a user explicitly requests otherwise.
- Keep risky features opt-in and documented.
- Do not follow symlinks unless a future change has explicit safety design and tests.

## Rule Development Requirements

Every new rule must include:

- Stable `id`.
- `title`.
- `description`.
- `severity`: `info`, `warning`, or `error`.
- Check implementation.
- Result message.
- Test fixture.
- Rule test.
- Documentation update.
- Redaction behavior if sensitive-looking content is involved.

## Safety Requirements

- Treat target repositories as private by default.
- Avoid telemetry.
- Avoid writing reports unless the user explicitly supplies `--report`.
- Avoid printing environment variables or full credential-like values.
- Treat secret allowlist annotations as reviewed exceptions only; never use them to hide real credentials.
- Avoid functionality for bypassing controls, cracking, piracy, attacks, or abuse.

## Implementation Preferences

- Use built-in Node.js APIs where practical.
- Keep rule outputs structured enough for future JSON or SARIF reporters.
- Add tests before expanding rule complexity.
- Update `docs/checklist-rules.md` whenever rule behavior changes.
- Update README examples when CLI behavior changes.
- Update `docs/cli-spec.md` when arguments, output formats, exit behavior, or config fields change.
- Keep config parsing strict and documented.
