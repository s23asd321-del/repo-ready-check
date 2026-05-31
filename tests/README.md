# Tests

The test suite uses Vitest.

```bash
npm test
```

`npm test` builds the TypeScript source before running tests so the CLI integration tests can execute `dist/cli.js`.

## Test Types

- Rule tests: verify rule metadata and expected pass/fail behavior.
- Config tests: verify config loading, validation, disabled rules, and defaults.
- Scanner tests: verify target handling, ignore behavior, symlink handling, and structured results.
- Reporter tests: verify console, Markdown, JSON output, and failure thresholds.
- Fixture regression tests: keep fictional fixtures stable.
- Sensitive-value redaction tests: ensure matched secret-like values are never rendered.
- CLI integration tests: execute the built CLI against fixtures, options, and rule listing.

## Fixtures

Fixtures live in `tests/fixtures/`.

They must use fictional content only. Do not include real tokens, passwords, cookies, API keys, private keys, proxy subscription links, private project names, or internal repository data.
