#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

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
  const outputArtifact = 'artifacts/policy/snapshot.md';
  const runMeta = 'artifacts/policy/RUN.json';

  const records = JSON.parse(await readFile(input, 'utf8'));
  const summary = summarize(records);
  const md = renderMarkdown(summary);

  await mkdir(path.dirname(outputDoc), { recursive: true });
  await writeFile(outputDoc, md, 'utf8');

  await mkdir(path.dirname(outputArtifact), { recursive: true });
  await writeFile(outputArtifact, md, 'utf8');

  await writeFile(runMeta, JSON.stringify({ timestamp: new Date().toISOString(), counts: summary }, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify({ status: 'ok', doc: outputDoc, artifact: outputArtifact }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
