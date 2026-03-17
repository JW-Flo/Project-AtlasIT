#!/usr/bin/env ts-node
/*
 * Generates a minimized Codex context bundle by concatenating a curated set
 * of small summaries instead of raw source files. Keeps within token window.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

interface Section {
  title: string;
  path: string;
  optional?: boolean;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");
const outFile = resolve(root, "artifacts/codex-context.trimmed.txt");

const argv = process.argv.slice(2);
const has = (flag: string) => argv.includes(flag);
function getArgValue(key: string): string | undefined {
  const idx = argv.findIndex((a) => a === key || a.startsWith(key + "="));
  if (idx === -1) return undefined;
  const val = argv[idx].split("=")[1];
  if (val) return val;
  return argv[idx + 1];
}

const ultra = has("--ultra");
const noReadme = has("--no-readme");
const sectionsFilter = getArgValue("--sections")
  ?.split(",")
  .map((s) => s.trim().toLowerCase());

const baseSections: Section[] = [
  {
    title: ultra ? "Ultra Runtime Context" : "Minimal Runtime Context",
    path: "docs/codex/minimal-runtime-context.md",
  },
  {
    title: "Prompt Update Sheet",
    path: "docs/codex/prompt-update-sheet.md",
    optional: false,
  },
  { title: "Codex Work Protection Rules", path: "artifacts/codex-work.json" },
];
if (!noReadme) {
  baseSections.push({
    title: "README Dynamic Runtime Extract",
    path: "README.md",
    optional: true,
  });
}

let sections: Section[] = baseSections;
if (sectionsFilter && sectionsFilter.length) {
  sections = sections.filter((s) =>
    sectionsFilter.some((f) => s.title.toLowerCase().includes(f)),
  );
}

function extractDynamicRuntime(readme: string): string {
  const start = readme.indexOf("### Dynamic Runtime (Phase A");
  if (start === -1) return "";
  const end = readme.indexOf("### Dynamic Runtime (Phase B", start);
  return readme.substring(start, end === -1 ? undefined : end).trim();
}

let bundle = "# Codex Trimmed Context\n\n";

for (const s of sections) {
  const fullPath = resolve(root, s.path);
  try {
    let raw = readFileSync(fullPath, "utf8");
    if (s.title.includes("README Dynamic Runtime Extract")) {
      raw = extractDynamicRuntime(raw);
    }
    if (!raw) continue;
    // Basic length guard: skip if > 25k chars to prevent token blowout
    if (raw.length > 25_000) {
      raw = raw.slice(0, 24_000) + "\n<!-- truncated -->";
    }
    bundle += `\n## ${s.title}\n\n` + raw.trim() + "\n";
  } catch (e) {
    if (!s.optional) {
      console.error(`Failed to read required section ${s.path}:`, e);
      process.exit(1);
    }
  }
}

// Final size note
bundle += `\n---\nApprox chars: ${bundle.length}\n`;

writeFileSync(outFile, bundle, "utf8");
console.log("Wrote", outFile, "size", bundle.length, "chars");
if (sections.length) {
  for (const s of sections) {
    try {
      const raw = readFileSync(resolve(root, s.path), "utf8");
      console.log("[section]", s.title, "chars=", raw.length);
    } catch {
      /* ignore */
    }
  }
}
if (ultra) console.log("Mode: ULTRA (keep only core runtime + sheet)");
