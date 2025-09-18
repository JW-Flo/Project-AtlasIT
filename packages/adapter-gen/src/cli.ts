#!/usr/bin/env node
import process from "node:process";
import path from "node:path";
import { generateAdapter } from "./generator.js";

interface ParsedArgs {
  command?: string;
  options: Record<string, string | boolean>;
  positionals: string[];
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  const options: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const [flag, value] = token.split("=", 2);
    const key = flag.replace(/^--/, "");
    if (typeof value === "string" && value.length > 0) {
      options[key] = value;
      continue;
    }
    const next = rest[i + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      i += 1;
    } else {
      options[key] = true;
    }
  }

  return { command, options, positionals };
}

function printHelp() {
  console.log(`AtlasIT Adapter Generator\n\nUsage:\n  atlasit-gen gen --schema <path> --name <adapter> [--out adapters] [--flag FEATURE_CONNECTOR_FOO] [--force]\n`);
}

async function run() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (!command || command === "--help" || command === "help") {
    printHelp();
    process.exit(0);
  }

  if (command !== "gen") {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
  }

  const schema = options.schema as string | undefined;
  const name = options.name as string | undefined;
  if (!schema || !name) {
    console.error("Missing required parameters: --schema and --name");
    process.exit(1);
  }

  const outDir = (options.out as string | undefined) ?? path.resolve(process.cwd(), "adapters");
  const featureFlag = options.flag as string | undefined;
  const force = options.force === true || options.force === "true";

  try {
    const result = await generateAdapter({
      schemaPath: schema,
      name,
      outDir,
      featureFlag,
      force,
    });

    console.log(
      JSON.stringify(
        {
          status: "ok",
          slug: result.slug,
          featureFlag: result.featureFlag,
          output: result.targetDir,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(`Adapter generation failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

run();
