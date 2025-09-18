#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function runSyft() {
  const result = spawnSync('syft', ['.', '-o', 'json'], {
    encoding: 'utf8',
  });
  if (result.status === 0) {
    return result.stdout;
  }
  return null;
}

function fallbackSbom() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  return JSON.stringify(
    {
      builder: 'fallback',
      generatedAt: new Date().toISOString(),
      name: pkg.name,
      version: pkg.version,
      dependencies: pkg.dependencies ?? {},
      devDependencies: pkg.devDependencies ?? {},
    },
    null,
    2,
  );
}

export function generateSbom() {
  return runSyft() ?? fallbackSbom();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = generateSbom();
  process.stdout.write(output.endsWith('\n') ? output : `${output}\n`);
}
