#!/usr/bin/env node
import process from "node:process";
import path from "node:path";
import { promises as fs } from "node:fs";
import { ConnectorManifestSchema } from "../../connector-schema/src/manifest.js";
import { scaffoldAdapter } from "./scaffold.js";

interface ParsedArgs {
  manifestPath?: string;
  outDir?: string;
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { help: false };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--help" || token === "-h") {
      result.help = true;
      continue;
    }

    if (token === "--out" || token === "-o") {
      result.outDir = argv[i + 1];
      i += 1;
      continue;
    }

    if (token.startsWith("--out=")) {
      result.outDir = token.slice("--out=".length);
      continue;
    }

    if (!token.startsWith("-")) {
      result.manifestPath = token;
    }
  }

  return result;
}

function printHelp(): void {
  console.log(
    `AtlasIT Adapter Generator

Usage:
  adapter-gen <manifest.json> [--out <directory>]

Arguments:
  manifest.json    Path to a ConnectorManifest JSON file

Options:
  --out, -o        Output directory (default: ./adapters/<slug>)
  --help, -h       Show this help message
`,
  );
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.manifestPath) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const manifestPath = path.resolve(process.cwd(), args.manifestPath);

  let rawContent: string;
  try {
    rawContent = await fs.readFile(manifestPath, "utf8");
  } catch {
    console.error(`Failed to read manifest file: ${manifestPath}`);
    process.exit(1);
  }

  let rawJson: unknown;
  try {
    rawJson = JSON.parse(rawContent);
  } catch {
    console.error(`Failed to parse JSON from: ${manifestPath}`);
    process.exit(1);
  }

  const parseResult = ConnectorManifestSchema.safeParse(rawJson);
  if (!parseResult.success) {
    console.error("Manifest validation failed:");
    for (const issue of parseResult.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  const manifest = parseResult.data;
  const outputDir = args.outDir
    ? path.resolve(process.cwd(), args.outDir)
    : path.resolve(process.cwd(), "adapters", manifest.slug);

  await scaffoldAdapter(manifest, outputDir);

  const { files } = await import("./generator.js").then((m) =>
    m.generateAdapter(manifest),
  );
  const fileList = Array.from(files.keys())
    .map((f) => `    ${f}`)
    .join("\n");

  console.log(`Adapter generated successfully.

  Connector:  ${manifest.name} (${manifest.slug})
  Provider:   ${manifest.provider}
  Auth:       ${manifest.auth.model}
  Output:     ${outputDir}
  Files (${files.size}):
${fileList}
`);
}

run();
