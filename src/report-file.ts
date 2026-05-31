import { promises as fs } from "node:fs";

function isFileExistsError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "EEXIST"
  );
}

export async function writeNewReportFile(
  reportPath: string,
  content: string,
): Promise<void> {
  try {
    await fs.writeFile(reportPath, content, {
      encoding: "utf8",
      flag: "wx",
    });
  } catch (error) {
    if (isFileExistsError(error)) {
      throw new Error(
        `Report file already exists: ${reportPath}. Choose a different path or remove the existing file before rerunning.`,
      );
    }

    throw error;
  }
}
