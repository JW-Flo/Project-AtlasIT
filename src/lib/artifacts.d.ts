export function writeArtifact(
  taskId: string,
  fileName: string,
  content: any,
  options?: { minify?: boolean },
): Promise<string>;
