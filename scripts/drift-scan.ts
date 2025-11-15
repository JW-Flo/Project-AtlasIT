#!/usr/bin/env node
/**
 * drift-scan.ts
 * Scans repository for drift from framework manifest
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { emitEvidence } from './emit-evidence.js';

interface FrameworkManifest {
  version: string;
  framework_id: string;
  description: string;
  required_files: string[];
  required_directories: string[];
  optional_files?: string[];
  validation_rules?: Record<string, unknown>;
}

interface DriftResult {
  clean: boolean;
  missing_files: string[];
  missing_directories: string[];
  total_missing: number;
  timestamp: string;
}

function scanForDrift(): DriftResult {
  console.log('[DRIFT-SCAN] Starting framework drift detection...');

  const manifestPath = join(process.cwd(), 'FRAMEWORK_MANIFEST.json');

  if (!existsSync(manifestPath)) {
    console.error('[DRIFT-SCAN] FRAMEWORK_MANIFEST.json not found');
    const result: DriftResult = {
      clean: false,
      missing_files: ['FRAMEWORK_MANIFEST.json'],
      missing_directories: [],
      total_missing: 1,
      timestamp: new Date().toISOString(),
    };
    emitEvidence('DRIFT-SCAN', 'error', result);
    return result;
  }

  const manifest: FrameworkManifest = JSON.parse(
    readFileSync(manifestPath, 'utf-8')
  );

  const missingFiles: string[] = [];
  const missingDirs: string[] = [];

  // Check required files
  for (const file of manifest.required_files) {
    const filepath = join(process.cwd(), file);
    if (!existsSync(filepath)) {
      missingFiles.push(file);
      console.log(`❌ Missing file: ${file}`);
    } else {
      console.log(`✅ Found: ${file}`);
    }
  }

  // Check required directories
  for (const dir of manifest.required_directories) {
    const dirpath = join(process.cwd(), dir);
    if (!existsSync(dirpath)) {
      missingDirs.push(dir);
      console.log(`❌ Missing directory: ${dir}`);
    } else {
      console.log(`✅ Found: ${dir}`);
    }
  }

  const totalMissing = missingFiles.length + missingDirs.length;
  const clean = totalMissing === 0;

  const result: DriftResult = {
    clean,
    missing_files: missingFiles,
    missing_directories: missingDirs,
    total_missing: totalMissing,
    timestamp: new Date().toISOString(),
  };

  // Emit evidence
  const evidenceResult = clean ? 'pass' : 'fail';
  emitEvidence('DRIFT-SCAN', evidenceResult, result);

  console.log(`\n[DRIFT-SCAN] Summary:`);
  console.log(`  Clean: ${clean ? 'YES ✅' : 'NO ❌'}`);
  console.log(`  Missing files: ${missingFiles.length}`);
  console.log(`  Missing directories: ${missingDirs.length}`);

  return result;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = scanForDrift();
  const exitCode = result.clean ? 0 : 1;

  // Output JSON result
  console.log('\n[DRIFT-SCAN] JSON Result:');
  console.log(JSON.stringify(result, null, 2));

  process.exit(exitCode);
}

export { scanForDrift };
