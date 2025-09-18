#!/usr/bin/env node
import process from "node:process";
import { simulateAdapter } from "./contract.js";

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
    const [flag, value] = token.split("=", 2);
    const key = flag.replace(/^--/, "");
    if (value) {
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

  return { command, options };
}

function printHelp() {
  console.log(`AtlasIT Adapter Simulator\n\nUsage:\n  atlasit-sim sim --adapter <dir> --contract <contract.json> [--junit <path>]\n`);
}

async function run() {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (!command || command === "--help" || command === "help") {
    printHelp();
    process.exit(0);
  }

  if (command !== "sim") {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
  }

  const adapterDir = options.adapter as string | undefined;
  const contract = options.contract as string | undefined;
  const junitPath = options.junit as string | undefined;

  if (!adapterDir || !contract) {
    console.error("Missing required parameters: --adapter and --contract");
    process.exit(1);
  }

  const result = await simulateAdapter({ adapterDir, contractPath: contract, junitPath });

  result.assertions.forEach((assertion) => {
    const status = assertion.passed ? "PASS" : "FAIL";
    if (assertion.message) {
      console.log(`${status} ${assertion.name} :: ${assertion.message}`);
    } else {
      console.log(`${status} ${assertion.name}`);
    }
  });

  if (!result.passed) {
    process.exit(1);
  }
}

run();
