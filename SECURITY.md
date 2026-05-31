# Security Policy

## Scope

Repo Ready Check is a repository readiness helper. It is not a complete security scanner, penetration testing tool, compliance platform, or formal security audit.

The potential secret check is best-effort. It can miss real secrets and can report false positives. A clean report does not prove that a repository is safe to publish.

## Default Security Boundary

By default, the tool:

- Runs locally.
- Performs read-only scanning.
- Avoids network access.
- Avoids requiring tokens.
- Avoids uploading scan results.
- Avoids telemetry.
- Avoids printing raw secret values.
- Avoids automatically fixing or modifying the scanned project.
- Avoids following symlinks during scans.
- Writes a report file only when `--report` is explicitly provided.
- Refuses to overwrite an existing report file.

## Reporting Security Issues

Please do not include real tokens, passwords, private keys, cookies, API keys, proxy subscription links, or private project data in public issues, pull requests, logs, screenshots, examples, or fixtures.

When reporting a security issue, include:

- A brief description.
- A minimal reproduction using fake values.
- The affected version or commit when known.
- The expected safer behavior.

## Sensitive Data Handling

Reports may include file paths, line numbers, rule ids, non-sensitive pattern names, and summary messages. Reports must not include complete credential-like values.

Secret allowlist annotations are intended only for fictional fixtures or carefully reviewed false positives. Do not use allowlist annotations to hide real credentials before publishing a repository.
