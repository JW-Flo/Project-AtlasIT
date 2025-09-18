import { promises as fs } from "node:fs";
import path from "node:path";
import { isResearchSchema, researchSchemaToOpenApi } from "./research.js";

export interface GenerateOptions {
  schemaPath: string;
  name: string;
  outDir?: string;
  featureFlag?: string;
  force?: boolean;
  templatesDir?: string;
  registryPath?: string;
}

export interface GenerateResult {
  slug: string;
  featureFlag: string;
  targetDir: string;
  manifestPath: string;
}

function sanitizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function pathExists(target: string) {
  try {
    await fs.stat(target);
    return true;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function readJson(file: string) {
  const contents = await fs.readFile(file, "utf8");
  return JSON.parse(contents);
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function deriveFeatureFlag(name: string) {
  return `FEATURE_CONNECTOR_${name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/__+/g, "_")}`;
}

async function copyTemplateTree(
  sourceRoot: string,
  targetRoot: string,
  replacements: Record<string, string>,
) {
  const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceRoot, entry.name);
    const targetPath = path.join(targetRoot, entry.name);
    if (entry.isDirectory()) {
      await ensureDir(targetPath);
      await copyTemplateTree(sourcePath, targetPath, replacements);
      continue;
    }

    let content = await fs.readFile(sourcePath, "utf8");
    for (const [token, value] of Object.entries(replacements)) {
      content = content.split(token).join(value);
    }
    await fs.writeFile(targetPath, content, "utf8");
  }
}

export async function generateAdapter(options: GenerateOptions): Promise<GenerateResult> {
  const cwd = process.cwd();
  const templatesDir = options.templatesDir ?? path.resolve(cwd, "templates/worker");
  const outDir = options.outDir ?? path.resolve(cwd, "adapters");
  const registryPath = options.registryPath ?? path.resolve(cwd, "adapters/registry.json");

  const slug = sanitizeSlug(options.name);
  if (!slug) {
    throw new Error("Adapter name produces an empty slug");
  }

  const featureFlag = options.featureFlag ?? deriveFeatureFlag(slug);
  const targetDir = path.resolve(outDir, slug);
  const schemaPath = path.resolve(cwd, options.schemaPath);

  const templateExists = await pathExists(templatesDir);
  if (!templateExists) {
    throw new Error(`Template directory not found: ${templatesDir}`);
  }

  const schemaExists = await pathExists(schemaPath);
  if (!schemaExists) {
    throw new Error(`Schema not found: ${schemaPath}`);
  }

  if (await pathExists(targetDir)) {
    if (!options.force) {
      throw new Error(`Adapter directory already exists: ${targetDir}`);
    }
    await fs.rm(targetDir, { recursive: true, force: true });
  }

  const rawSchema = await readJson(schemaPath);
  const createdAt = new Date().toISOString();

  let schemaForAdapter = rawSchema;
  let sourceKind: "openapi" | "research" = "openapi";

  if (isResearchSchema(rawSchema)) {
    schemaForAdapter = researchSchemaToOpenApi(rawSchema);
    sourceKind = "research";
  }

  const schemaLiteral = JSON.stringify(schemaForAdapter, null, 2);

  await ensureDir(targetDir);

  const replacements: Record<string, string> = {
    __ADAPTER_NAME__: options.name,
    __ADAPTER_SLUG__: slug,
    __FEATURE_FLAG__: featureFlag,
    __SCHEMA__: schemaLiteral,
    __CREATED_AT__: createdAt,
  };

  await copyTemplateTree(templatesDir, targetDir, replacements);

  const manifest = {
    name: options.name,
    slug,
    featureFlag,
    schemaPath: "schema.json",
    createdAt,
    metadata: {
      sourceKind,
      researchVersion:
        sourceKind === "research" && typeof rawSchema.version === "string"
          ? rawSchema.version
          : undefined,
    },
  };

  await fs.writeFile(
    path.join(targetDir, "schema.json"),
    `${schemaLiteral}\n`,
    "utf8",
  );

  if (sourceKind === "research") {
    await fs.writeFile(
      path.join(targetDir, "research.schema.json"),
      `${JSON.stringify(rawSchema, null, 2)}\n`,
      "utf8",
    );
  }

  const manifestPath = path.join(targetDir, "atlasit.adapter.json");
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  type RegistryEntry = {
    name: string;
    slug: string;
    featureFlag: string;
    createdAt: string;
    sourceKind?: string;
  };
  const registry = ((await pathExists(registryPath))
    ? await readJson(registryPath)
    : []) as RegistryEntry[];

  const filtered = registry.filter((entry) => entry.slug !== slug);
  filtered.push({
    name: options.name,
    slug,
    featureFlag,
    createdAt,
    sourceKind,
  });

  filtered.sort((a, b) => a.slug.localeCompare(b.slug));

  await ensureDir(path.dirname(registryPath));
  await fs.writeFile(
    registryPath,
    `${JSON.stringify(filtered, null, 2)}\n`,
    "utf8",
  );

  return {
    slug,
    featureFlag,
    targetDir,
    manifestPath,
  };
}
