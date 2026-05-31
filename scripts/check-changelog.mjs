import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const changelog = await readFile("CHANGELOG.md", "utf8");
const version = packageJson.version;

if (typeof version !== "string" || version.length === 0) {
  throw new Error("package.json must define a version.");
}

if (!changelog.includes(`## [${version}]`)) {
  throw new Error(`CHANGELOG.md must include an entry for version ${version}.`);
}

console.log(`CHANGELOG.md includes version ${version}.`);
