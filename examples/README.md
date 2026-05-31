# Examples

This directory contains safe fictional examples for Repo Ready Check.

## Contents

- `minimal-repo/`: a small fictional repository that should pass the MVP checks.
- `report-sample.md`: an example Markdown report shape.
- `../repo-ready-check.config.example.json`: a fictional config file shape.

Examples must not contain real:

- Tokens
- Passwords
- Cookies
- API keys
- Private keys
- Proxy subscription links
- Internal repository data
- Private project names

Run the built CLI against the example repository:

```bash
node ../dist/cli.js minimal-repo --report report-sample-local.md
```

Try JSON output:

```bash
node ../dist/cli.js minimal-repo --format json
```

Try an explicit config file:

```bash
node ../dist/cli.js minimal-repo --config ../repo-ready-check.config.example.json
```

List active rules:

```bash
node ../dist/cli.js minimal-repo --config ../repo-ready-check.config.example.json --list-rules
```
