#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { writeArtifact } from '../src/lib/artifacts.js';

function summarize(records) {
  const summary = { total: records.length, controls: {}, pass: 0, fail: 0 };
  for (const r of records) {
    const c = r.control;
    const status = r.result.status;
    summary.controls[c] ??= { pass: 0, fail: 0 };
    summary.controls[c][status] += 1;
    summary[status] += 1;
  }
  return summary;
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push('# Compliance Snapshot');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`Total evidence: ${summary.total}`);
  lines.push('');
  lines.push('| Control | Pass | Fail |');
  lines.push('|---|---:|---:|');
  for (const [control, s] of Object.entries(summary.controls)) {
    lines.push(`| ${control} | ${s.pass} | ${s.fail} |`);
  }
  lines.push('');
  lines.push(`Overall pass: ${summary.pass}, fail: ${summary.fail}`);
  return lines.join('\n') + '\n';
}

async function main() {
  const input = process.argv[2] || 'artifacts/policy/evidence.json';
  const outputDoc = process.argv[3] || 'docs/COMPLIANCE_SNAPSHOT.md';

  const records = JSON.parse(await readFile(input, 'utf8'));
  const summary = summarize(records);
  const md = renderMarkdown(summary);

  await mkdir(path.dirname(outputDoc), { recursive: true });
  await writeFile(outputDoc, md, 'utf8');
  await writeArtifact('policy', 'snapshot.md', md);
  await writeArtifact('policy', 'RUN.json', {
    timestamp: new Date().toISOString(),
    counts: summary,
    source: path.relative(process.cwd(), input),
  });

  console.log(JSON.stringify({ status: 'ok', doc: outputDoc, artifact: 'artifacts/policy/snapshot.md' }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
