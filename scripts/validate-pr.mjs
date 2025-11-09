#!/usr/bin/env node
/**
 * PR Validation Script
 * Validates a single PR by running build and lint checks
 * Usage: node scripts/validate-pr.mjs <pr-number>
 */
import { spawnSync } from 'node:child_process';

function runCommand(name, command, args, options = {}) {
  console.log(`Running ${name}...`);
  const result = spawnSync(command, args, { 
    encoding: 'utf8', 
    shell: false,
    stdio: options.silent ? 'pipe' : 'inherit'
  });
  
  if (result.status !== 0) {
    throw new Error(`${name} failed with code ${result.status}`);
  }
  return result;
}

async function main() {
  const prNumber = process.argv[2];
  
  if (!prNumber) {
    console.error('Usage: node scripts/validate-pr.mjs <pr-number>');
    process.exit(1);
  }

  console.log(`\n🔍 Validating PR #${prNumber}...\n`);

  try {
    // Run build
    runCommand('build', 'npm', ['run', 'build']);
    console.log('✅ Build passed');

    // Run lint
    runCommand('lint', 'npm', ['run', 'lint']);
    console.log('✅ Lint passed');

    console.log(`\n✅ Validation passed for PR #${prNumber}\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ Validation failed for PR #${prNumber}: ${error.message}\n`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
