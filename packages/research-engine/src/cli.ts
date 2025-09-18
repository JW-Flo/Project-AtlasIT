#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { normalizeDocs } from "./normalizer.js";
import { slugify } from "./utils.js";

interface ParsedArgs {
  command?: string;
  options: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  const options: Record<string, string | boolean> = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) continue;
    const [flag, inline] = token.split("=", 2);
    const key = flag.replace(/^--/, "");
    if (inline) {
      options[key] = inline;
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
  return { command, options };
}

function printHelp() {
  console.log(`AtlasIT Research Engine\n\nUsage:\n  atlasit-research normalize --input research/raw/example.md --out artifacts/research/schema.json --name "Example HR Suite" [--slug example-hr-suite]\n`);
}

async function run() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (!command || command === "help" || command === "--help") {
    printHelp();
    process.exit(0);
  }

  if (command !== "normalize") {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
  }

  const inputPath = options.input as string | undefined;
  const outputPath = options.out as string | undefined;
  const serviceName = options.name as string | undefined;
  const slugOverride = options.slug as string | undefined;

  if (!inputPath || !outputPath || !serviceName) {
    console.error("Missing required parameters: --input, --out, --name");
    process.exit(1);
  }

  const absoluteInput = path.resolve(process.cwd(), inputPath);
  const absoluteOutput = path.resolve(process.cwd(), outputPath);
  const content = await readFile(absoluteInput, "utf8");

  const research = normalizeDocs({
    content,
    sourcePath: path.relative(process.cwd(), absoluteInput),
    serviceName,
    serviceSlug: slugOverride ?? slugify(serviceName),
  });

  await mkdir(path.dirname(absoluteOutput), { recursive: true });
  await writeFile(absoluteOutput, `${JSON.stringify(research, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        status: "ok",
        service: research.service,
        output: path.relative(process.cwd(), absoluteOutput),
      },
      null,
      2,
    ),
  );
}

run();
