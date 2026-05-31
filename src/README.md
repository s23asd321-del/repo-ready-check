# Source

The TypeScript source is intentionally small.

- `cli.ts`: argument parsing, command entry, and rule listing.
- `config.ts`: config loading, validation, and defaults.
- `scanner.ts`: local read-only directory scan.
- `rules.ts`: built-in, Node/npm conditional, and config-derived readiness rules.
- `reporter.ts`: text, Markdown, and JSON output.
- `report-file.ts`: safe report file writing without overwrites.
- `types.ts`: shared types.

Safety defaults:

- No network access.
- No telemetry.
- No automatic fixes.
- No raw secret values in output.
- No symlink traversal.
