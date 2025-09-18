#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { writeArtifact } from '../src/lib/artifacts.js';
import { generateSbom } from './generate-sbom.mjs';

function runCommand(name, command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', shell: false });
  const output = [result.stdout || '', result.stderr || ''].filter(Boolean).join('\n');
  if (result.status !== 0) {
    throw new Error(`${name} failed with code ${result.status}\n${output}`);
  }
  return output;
}

async function main() {
  const buildLog = runCommand('build', 'npm', ['run', 'build:shared']);
  await writeArtifact('ci', 'build.log', buildLog.endsWith('\n') ? buildLog : `${buildLog}\n`);

  const testLog = runCommand('tests', 'npm', ['run', 'test:unit']);
  await writeArtifact('ci', 'test.log', testLog.endsWith('\n') ? testLog : `${testLog}\n`);

  const sbom = generateSbom();
  await writeArtifact('ci', 'sbom.json', sbom);

  await writeArtifact('ci', 'RUN.json', {
    generatedAt: new Date().toISOString(),
    steps: [
      { name: 'build', artifact: 'artifacts/ci/build.log' },
      { name: 'test', artifact: 'artifacts/ci/test.log' },
      { name: 'sbom', artifact: 'artifacts/ci/sbom.json' },
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
