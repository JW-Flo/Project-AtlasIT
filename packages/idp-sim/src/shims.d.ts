declare module "../../../src/lib/artifacts.js" {
  export function writeArtifact(
    dir: string,
    name: string,
    data: string | object,
  ): Promise<void>;
}
