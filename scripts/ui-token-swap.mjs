#!/usr/bin/env node
// Global token-swap pass to lift legacy bare-Tailwind pages onto the new design system.
// Idempotent — running multiple times is a no-op after first pass.

import fs from "node:fs";
import path from "node:path";

const skipFiles = new Set([
  "console-app/src/routes/login/+page.svelte",
  "console-app/src/routes/signup/+page.svelte",
  "console-app/src/routes/console/+page.svelte",
  "console-app/src/routes/console/compliance/+page.svelte",
  "console-app/src/routes/console/directory/+page.svelte",
  "console-app/src/routes/trust/[slug]/+page.svelte",
  "console-app/src/routes/trust/[slug]/embed/+page.svelte",
  "console-app/src/lib/components/layout/AppFrame.svelte",
  "console-app/src/routes/console/settings/trust/+page.svelte",
]);

const swaps = [
  // Surface backgrounds
  [/bg-white dark:bg-gray-800/g, "bg-card"],
  [/bg-gray-50 dark:bg-gray-900\b/g, "bg-background"],
  [/bg-gray-100 dark:bg-gray-800/g, "bg-muted"],
  [/bg-gray-50 dark:bg-gray-900\/50/g, "bg-muted/40"],
  [/bg-gray-100 dark:bg-gray-700/g, "bg-muted"],
  [/bg-gray-200 dark:bg-gray-700/g, "bg-muted"],
  // Borders
  [/border-gray-200 dark:border-gray-700/g, "border-border"],
  [/border-gray-200 dark:border-gray-600/g, "border-input"],
  [/border-gray-300 dark:border-gray-600/g, "border-input"],
  [/border-gray-100 dark:border-gray-700/g, "border-border"],
  // Text
  [/text-gray-900 dark:text-white/g, "text-foreground"],
  [/text-gray-500 dark:text-gray-400/g, "text-muted-foreground"],
  [/text-gray-600 dark:text-gray-300/g, "text-foreground/80"],
  [/text-gray-700 dark:text-gray-300/g, "text-foreground/80"],
  [/text-gray-700 dark:text-gray-200/g, "text-foreground/80"],
  [/text-gray-400 dark:text-gray-500/g, "text-muted-foreground/70"],
  [/text-gray-400(?!\/)/g, "text-muted-foreground/70"],
  [/placeholder-gray-400 dark:placeholder-gray-500/g, "placeholder:text-muted-foreground/60"],
  [/placeholder-gray-400/g, "placeholder:text-muted-foreground/60"],
  // Brand (blue → primary violet)
  [/bg-blue-600 hover:bg-blue-700/g, "bg-primary hover:bg-primary-hover"],
  [/disabled:bg-blue-400/g, "disabled:opacity-50"],
  [/text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300/g, "text-primary hover:text-primary-hover"],
  [/text-blue-600 hover:text-blue-700/g, "text-primary hover:text-primary-hover"],
  [/text-blue-600 dark:text-blue-400/g, "text-primary"],
  [/text-blue-700 dark:text-blue-300/g, "text-primary"],
  [/text-blue-600/g, "text-primary"],
  [/text-blue-400/g, "text-primary"],
  [/bg-blue-50 dark:bg-blue-900\/20/g, "bg-primary-muted"],
  [/bg-blue-50 dark:bg-blue-900\/30/g, "bg-primary-muted"],
  [/bg-blue-100 text-blue-800 dark:bg-blue-900\/30 dark:text-blue-300/g, "bg-primary-muted text-primary"],
  [/bg-blue-100 text-blue-700/g, "bg-primary-muted text-primary"],
  [/border-blue-200 dark:border-blue-800/g, "border-primary/20"],
  [/border-blue-500/g, "border-primary"],
  [/border-blue-400/g, "border-primary"],
  [/focus:ring-blue-500/g, "focus:ring-primary"],
  // Status / semantic
  [/bg-green-50 dark:bg-green-900\/20 border border-green-200 dark:border-green-800/g, "bg-success-muted border border-success/20"],
  [/bg-green-100 text-green-800 dark:bg-green-900\/30 dark:text-green-300/g, "bg-success-muted text-success"],
  [/bg-green-100 text-green-700 dark:bg-green-900\/30 dark:text-green-300/g, "bg-success-muted text-success"],
  [/text-green-800 dark:text-green-300/g, "text-success"],
  [/text-green-700 dark:text-green-300/g, "text-success"],
  [/text-green-600 dark:text-green-400/g, "text-success"],
  [/text-green-600/g, "text-success"],
  [/bg-green-500/g, "bg-success"],
  [/bg-red-50 dark:bg-red-900\/20 border border-red-200 dark:border-red-800/g, "bg-destructive-muted border border-destructive/20"],
  [/bg-red-50 dark:bg-red-900\/20/g, "bg-destructive-muted"],
  [/border-red-200 dark:border-red-800/g, "border-destructive/20"],
  [/bg-red-100 text-red-700 dark:bg-red-900\/30 dark:text-red-300/g, "bg-destructive-muted text-destructive"],
  [/text-red-800 dark:text-red-300/g, "text-destructive"],
  [/text-red-700 dark:text-red-400/g, "text-destructive"],
  [/text-red-600 dark:text-red-400/g, "text-destructive"],
  [/text-red-600/g, "text-destructive"],
  [/text-red-500/g, "text-destructive"],
  [/bg-red-600 hover:bg-red-700/g, "bg-destructive hover:bg-destructive/90"],
  [/bg-red-500/g, "bg-destructive"],
  [/bg-amber-50 dark:bg-amber-900\/20 border border-amber-200 dark:border-amber-800/g, "bg-warning-muted border border-warning/20"],
  [/bg-amber-100 text-amber-800 dark:bg-amber-900\/30 dark:text-amber-300/g, "bg-warning-muted text-warning"],
  [/text-amber-600 dark:text-amber-400/g, "text-warning"],
  [/text-amber-600/g, "text-warning"],
  [/text-amber-500 dark:text-amber-400/g, "text-warning"],
  [/text-amber-500/g, "text-warning"],
  [/bg-amber-500/g, "bg-warning"],
  [/bg-yellow-500/g, "bg-warning"],
  [/text-yellow-600 dark:text-yellow-400/g, "text-warning"],
  // Page container
  [/<div class="p-8 max-w-7xl mx-auto">/g, '<div class="animate-fade-in">'],
  [/<div class="p-8 max-w-5xl mx-auto">/g, '<div class="animate-fade-in max-w-5xl mx-auto">'],
  [/<div class="p-8 max-w-6xl mx-auto">/g, '<div class="animate-fade-in max-w-6xl mx-auto">'],
  [/<div class="p-6 max-w-7xl mx-auto">/g, '<div class="animate-fade-in">'],
];

const targetDirs = [
  "console-app/src/routes/console",
  "console-app/src/routes/pricing",
  "console-app/src/routes/support",
  "console-app/src/routes/faq",
  "console-app/src/routes/privacy",
  "console-app/src/routes/developers",
  "console-app/src/routes/marketplace",
  "console-app/src/routes/notifications",
  "console-app/src/routes/access-requests",
  "console-app/src/routes/accept-invite",
];

let filesChanged = 0;
let totalEdits = 0;

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name).replace(/\\/g, "/");
    if (f.isDirectory()) {
      walk(p);
    } else if (f.name.endsWith(".svelte")) {
      const rel = p.replace(/^.*?(console-app\/.+)/, "$1");
      if (skipFiles.has(rel)) continue;
      const orig = fs.readFileSync(p, "utf8");
      let next = orig;
      let edits = 0;
      for (const [from, to] of swaps) {
        const m = next.match(from);
        if (m) {
          edits += m.length;
          next = next.replace(from, to);
        }
      }
      if (next !== orig) {
        fs.writeFileSync(p, next);
        filesChanged++;
        totalEdits += edits;
        console.log(`${rel}: ${edits} edits`);
      }
    }
  }
}

for (const d of targetDirs) {
  if (fs.existsSync(d)) walk(d);
}

console.log(`\nTotal: ${filesChanged} files modified, ${totalEdits} edits applied`);
