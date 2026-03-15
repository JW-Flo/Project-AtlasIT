import { promises as fs } from "node:fs";
import path from "node:path";
import type { ConnectorManifest } from "../../connector-schema/src/manifest.js";
import { generateAdapter } from "./generator.js";

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function scaffoldAdapter(
  manifest: ConnectorManifest,
  outputDir: string,
): Promise<void> {
  const { files } = generateAdapter(manifest);

  for (const [filePath, content] of files) {
    const fullPath = path.join(outputDir, filePath);
    await ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, "utf8");
  }
}
