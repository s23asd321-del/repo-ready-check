# TODO

## Phase 0: Repository Foundation

- [x] Create core repository documentation.
- [x] Define safety, privacy, and disclaimer boundaries.
- [x] Add TypeScript project configuration.
- [x] Keep the first version dependency-light.

## Phase 1: MVP CLI

- [x] Parse a local target directory argument.
- [x] Default to scanning the current directory.
- [x] Support `--help`.
- [x] Support `--report <file>` for Markdown output.
- [x] Keep scanning read-only.

## Phase 2: Minimal Local Scanning

- [x] Check recommended repository files and directories.
- [x] Check common `.gitignore` entries.
- [x] Check README keywords.
- [x] Detect obvious potential secret patterns without printing matched values.
- [x] Generate console and Markdown reports.

## Phase 3: Stabilization

- [x] Add rule tests.
- [x] Add scanner tests.
- [x] Add reporter tests.
- [x] Add fixture regression tests.
- [x] Add sensitive-value redaction tests.
- [x] Add config file support.
- [x] Add JSON and Markdown output selection.
- [x] Add configurable failure thresholds.
- [x] Add active rule listing and disabled rule config.
- [x] Add conditional Node/npm metadata checks.
- [x] Add reviewed false-positive annotations for secret-like fixture values.
- [x] Add npm pack and changelog checks.
- [ ] Review README examples after the first real external repository scan.
- [x] Add release notes before tagging a public version.

## Phase 4: Next Small Improvements

- [ ] Add deeper package quality checks.
- [ ] Improve README section detection beyond keyword matching.
- [ ] Add opt-in rule enable/disable controls.
- [ ] Evaluate a dedicated GitHub Action wrapper.
