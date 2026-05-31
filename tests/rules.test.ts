import { describe, expect, it } from "vitest";

import { scanProject } from "../src/scanner.js";
import { createRules, rules } from "../src/rules.js";

import { fixturePath } from "./helpers.js";

describe("rules", () => {
  it("defines stable metadata for every rule", () => {
    for (const rule of rules) {
      expect(rule.id).toMatch(/^[a-z0-9-]+$/);
      expect(rule.title.length).toBeGreaterThan(0);
      expect(rule.description.length).toBeGreaterThan(0);
      expect(["info", "warning", "error"]).toContain(rule.severity);
      expect(rule.check).toBeTypeOf("function");
    }
  });

  it("passes all checks for a complete fictional repository", async () => {
    const result = await scanProject(fixturePath("complete-repo"));

    expect(result.summary.total).toBe(rules.length);
    expect(result.summary.errors).toBe(0);
    expect(result.summary.warnings).toBe(0);
    expect(result.summary.passed).toBe(rules.length);
  });

  it("reports missing required files for an incomplete repository", async () => {
    const result = await scanProject(fixturePath("incomplete-repo"));
    const failedRuleIds = result.results
      .filter((ruleResult) => !ruleResult.passed)
      .map((ruleResult) => ruleResult.id);

    expect(failedRuleIds).toContain("required-readme");
    expect(failedRuleIds).toContain("required-license");
    expect(result.summary.errors).toBeGreaterThan(0);
  });

  it("reports incomplete package.json metadata when package.json is present", async () => {
    const result = await scanProject(fixturePath("incomplete-repo"));
    const metadataResult = result.results.find(
      (ruleResult) => ruleResult.id === "package-json-metadata",
    );

    expect(metadataResult?.passed).toBe(false);
    expect(metadataResult?.status).toBe("warning");
    expect(metadataResult?.message).toContain("description");
  });

  it("creates configured rules and applies severity overrides", () => {
    const configuredRules = createRules({
      requiredFiles: ["docs/architecture.md"],
      ruleSeverities: {
        "configured-required-files": "warning",
      },
    });
    const configuredRule = configuredRules.find(
      (rule) => rule.id === "configured-required-files",
    );

    expect(configuredRule?.severity).toBe("warning");
  });

  it("omits disabled rules from the active rule list", () => {
    const configuredRules = createRules({
      disabledRules: ["required-security", "no-potential-secrets"],
    });
    const ruleIds = configuredRules.map((rule) => rule.id);

    expect(ruleIds).not.toContain("required-security");
    expect(ruleIds).not.toContain("no-potential-secrets");
    expect(ruleIds).toContain("required-readme");
  });
});
