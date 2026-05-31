# Legal and Safety Notes

Repo Ready Check provides repository maintenance guidance only.

## Safety Boundaries

- It does not scan the network.
- It does not upload data.
- It does not collect telemetry.
- It does not automatically fix or modify scanned projects.
- It creates a report file only when the user explicitly passes `--report`.
- It does not overwrite existing report files.
- It does not display matched secret values.
- It does not validate whether credentials are real.
- It does not follow symlinks during scanning.
- It does not encourage illegal, abusive, cracking, piracy, attack, or bypass activity.

## Legal and Compliance Boundaries

- It is not legal advice.
- It is not compliance certification.
- It is not a license compatibility decision engine.
- It is not a complete security audit.
- It does not prove a repository is safe to publish.

## Sensitive Information

Potential secret findings should include only:

- File path.
- Line number when available.
- Rule id.
- Non-sensitive pattern name when available.

Users should review source files locally and avoid sharing reports that expose private project structure or sensitive paths.

JSON output intentionally omits absolute root paths. Reports can still reveal relative file paths, filenames, and project structure, so users should review them before sharing.

Secret allowlist annotations are intended only for known-safe fictional fixtures or carefully reviewed false positives. They must not be used to hide real credentials before publishing a repository.
