import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function serializeContent(content, options) {
  if (typeof content === "string" || content instanceof Uint8Array) {
    return content;
  }
  const spacing = options?.minify ? 0 : 2;
  return `${JSON.stringify(content, null, spacing)}\n`;
}

/**
 * Write an artifact file under `artifacts/<taskId>/<fileName>`.
 */
export async function writeArtifact(taskId, fileName, content, options = {}) {
  if (!taskId) throw new Error("taskId is required");
  if (!fileName) throw new Error("fileName is required");
  const dir = path.resolve("artifacts", taskId);
  await mkdir(dir, { recursive: true });
  const output = path.join(dir, fileName);
  const payload = serializeContent(content, options);
  await writeFile(output, payload);
  return output;
}
