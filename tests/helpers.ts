import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

export function fixturePath(name: string): string {
  return path.join(currentDir, "fixtures", name);
}
