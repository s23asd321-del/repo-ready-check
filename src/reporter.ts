import type {
  FindingLocation,
  OutputFormat,
  ResultStatus,
  ScanResult,
  SkippedPath,
} from "./types.js";

function statusLabel(status: ResultStatus): string {
  switch (status) {
    case "passed":
      return "PASS";
    case "warning":
      return "WARNING";
    case "error":
      return "ERROR";
    case "info":
      return "INFO";
  }
}

function markdownEscape(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function formatLocations(locations: FindingLocation[]): string {
  if (locations.length === 0) {
    return "-";
  }

  return locations
    .map((location) =>
      [
        location.line === undefined
          ? location.filePath
          : `${location.filePath}:${location.line}`,
        location.ruleName === undefined ? undefined : `(${location.ruleName})`,
      ]
        .filter((part) => part !== undefined)
        .join(" "),
    )
    .join(", ");
}

export function shouldFail(scanResult: ScanResult, failOn: "warning" | "error"): boolean {
  if (scanResult.summary.errors > 0) {
    return true;
  }

  return failOn === "warning" && scanResult.summary.warnings > 0;
}

export function renderConsoleSummary(scanResult: ScanResult): string {
  const lines = [
    "Repo Ready Check",
    `Project: ${scanResult.projectName}`,
    `Scanned path: ${scanResult.displayPath}`,
    `Total checks: ${scanResult.summary.total}`,
    `Passed: ${scanResult.summary.passed}`,
    `Warnings: ${scanResult.summary.warnings}`,
    `Errors: ${scanResult.summary.errors}`,
    `Skipped paths: ${scanResult.skippedPaths.length}`,
  ];

  const failedResults = scanResult.results.filter((result) => !result.passed);

  if (failedResults.length > 0) {
    lines.push("", "Findings:");

    for (const result of failedResults) {
      const locations = formatLocations(result.locations);
      const locationSuffix = locations === "-" ? "" : ` (${locations})`;
      lines.push(
        `- [${statusLabel(result.status)}] ${result.id}: ${result.message}${locationSuffix}`,
      );
    }
  } else {
    lines.push("", "No failed checks.");
  }

  if (scanResult.skippedPaths.length > 0) {
    lines.push("", "Skipped paths:");

    for (const skippedPath of scanResult.skippedPaths) {
      lines.push(`- ${skippedPath.path}: ${skippedPath.reason}`);
    }
  }

  return lines.join("\n");
}

export function renderMarkdownReport(scanResult: ScanResult): string {
  const projectRows = [
    `- Project name: ${scanResult.projectName}`,
    `- Scanned at: ${scanResult.scannedAt}`,
    `- Scanned path: ${scanResult.displayPath}`,
    ...(scanResult.configPath === undefined
      ? []
      : [`- Config path: ${scanResult.configPath}`]),
  ];
  const summaryRows = [
    ["Total checks", String(scanResult.summary.total)],
    ["Passed", String(scanResult.summary.passed)],
    ["Warnings", String(scanResult.summary.warnings)],
    ["Errors", String(scanResult.summary.errors)],
    ["Skipped paths", String(scanResult.skippedPaths.length)],
  ];

  const resultRows = scanResult.results.map((result) => [
    statusLabel(result.status),
    result.severity,
    result.id,
    result.title,
    result.message,
    formatLocations(result.locations),
  ]);
  const skippedRows = scanResult.skippedPaths.map((skippedPath) => [
    skippedPath.path,
    skippedPath.reason,
  ]);

  return `# Repo Ready Check Report

## Project

${projectRows.join("\n")}

## Summary

| Metric | Count |
| --- | ---: |
${summaryRows.map(([label, value]) => `| ${label} | ${value} |`).join("\n")}

## Detailed Check Results

| Status | Severity | Rule | Title | Message | Location |
| --- | --- | --- | --- | --- | --- |
${resultRows
  .map((row) => `| ${row.map(markdownEscape).join(" | ")} |`)
  .join("\n")}

## Skipped Paths

Some files or directories may be skipped when they cannot be read safely as text, are larger than the scan limit, are symlinks, or appear to be binary.

| Path | Reason |
| --- | --- |
${skippedRows.length === 0 ? "| - | - |" : skippedRows.map((row) => `| ${row.map(markdownEscape).join(" | ")} |`).join("\n")}

## Security and Privacy Notes

Repo Ready Check runs locally by default. It does not require network access, does not upload scan results, does not collect telemetry, and does not automatically fix or modify the scanned project. A report file is written only when requested with \`--report\`, and existing report files are not overwritten.

Potential secret findings intentionally omit matched values. Reports include only file paths, line numbers, rule names, and non-sensitive pattern names so maintainers can review the source locally.

## Disclaimer

This report is not legal advice, not compliance certification, and not a complete security audit. Results are informational engineering maintenance guidance only.
`;
}

export function renderJsonReport(scanResult: ScanResult): string {
  return `${JSON.stringify(
    {
      projectName: scanResult.projectName,
      scannedAt: scanResult.scannedAt,
      scannedPath: scanResult.displayPath,
      configPath: scanResult.configPath,
      summary: scanResult.summary,
      results: scanResult.results,
      skippedPaths: scanResult.skippedPaths,
      safety:
        "Local-only report. Potential secret findings omit matched values.",
      disclaimer:
        "This is not legal advice, compliance certification, or a complete security audit.",
    },
    null,
    2,
  )}\n`;
}

export function renderReport(
  scanResult: ScanResult,
  format: OutputFormat,
): string {
  switch (format) {
    case "json":
      return renderJsonReport(scanResult);
    case "markdown":
      return renderMarkdownReport(scanResult);
    case "text":
      return renderConsoleSummary(scanResult);
  }
}
