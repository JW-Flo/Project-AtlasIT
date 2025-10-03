declare module "@atlasit/idp-okta" {
  export const OKTA_ADAPTER_ID: string;
  export const OKTA_FLAG_ENV: string;
  export function loadFixtureUsers(): Array<any>;
  export function createOktaAdapter(): any;
}

declare module "../../../src/lib/artifacts.js" {
  export function writeArtifact(
    taskId: string,
    fileName: string,
    content: any,
    options?: { minify?: boolean },
  ): Promise<string>;
}
