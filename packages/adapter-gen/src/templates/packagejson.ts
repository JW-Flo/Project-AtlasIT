import type { ConnectorManifest } from "../../../connector-schema/src/manifest.js";

export function generatePackageJson(manifest: ConnectorManifest): string {
  const deps: Record<string, string> = {
    hono: "^4.4.0",
  };

  const devDeps: Record<string, string> = {
    "@cloudflare/workers-types": "^4.20240320.0",
    typescript: "^5.7.2",
    wrangler: "^3.60.0",
  };

  const pkg = {
    name: `@atlasit/adapter-${manifest.slug}`,
    version: manifest.version,
    private: true,
    type: "module",
    scripts: {
      dev: "wrangler dev",
      deploy: "wrangler deploy",
      "type-check": "tsc --noEmit",
    },
    dependencies: deps,
    devDependencies: devDeps,
  };

  return JSON.stringify(pkg, null, 2) + "\n";
}

export function generateTsConfig(): string {
  const config = {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "Bundler",
      lib: ["ES2022"],
      types: ["@cloudflare/workers-types"],
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      isolatedModules: true,
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"],
  };

  return JSON.stringify(config, null, 2) + "\n";
}
