import type { ConnectorManifest } from "../../connector-schema/src/manifest.js";
import { generateWorkerTemplate } from "./templates/worker.js";
import { generateAuthTemplate } from "./templates/auth.js";
import { generateConfigTemplate } from "./templates/config.js";
import { generateWranglerTemplate } from "./templates/wrangler.js";
import {
  generatePackageJson,
  generateTsConfig,
} from "./templates/packagejson.js";
import { generateReadme } from "./templates/readme.js";
import { generateInitialMigration } from "./templates/migration.js";

export interface GeneratedAdapter {
  files: Map<string, string>;
  manifest: ConnectorManifest;
}

export function generateAdapter(manifest: ConnectorManifest): GeneratedAdapter {
  const files = new Map<string, string>();

  files.set("src/index.ts", generateWorkerTemplate(manifest));
  files.set("src/auth.ts", generateAuthTemplate(manifest));
  files.set("src/config.ts", generateConfigTemplate(manifest));
  files.set("wrangler.toml", generateWranglerTemplate(manifest));
  files.set("package.json", generatePackageJson(manifest));
  files.set("tsconfig.json", generateTsConfig());
  files.set("README.md", generateReadme(manifest));
  files.set("migrations/0001_initial.sql", generateInitialMigration());

  return { files, manifest };
}
