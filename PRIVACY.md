# Privacy

Repo Ready Check is local-first.

By default, it does not:

- Upload files.
- Send scan results to a server.
- Collect telemetry.
- Require a token.
- Read from the network.
- Automatically fix or modify the scanned project.
- Follow symlinks.

If users pass `--report`, the tool writes only the requested report path and refuses to overwrite an existing report file.

Generated reports may contain relative file paths, project structure, filenames, rule ids, non-sensitive pattern names, and documentation quality notes. JSON output omits absolute root paths, but users should still avoid publicly sharing reports that reveal sensitive paths, private repository structure, internal project names, or confidential implementation details.

Potential secret findings intentionally omit matched values. Users should still review reports before sharing them.

Future integrations must be opt-in and documented before they are enabled.
