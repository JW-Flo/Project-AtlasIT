#!/usr/bin/env node
/**
 * Codex Runner Script
 * 
 * Reads the fenced COMMAND PLAN from ops/hand-off.md,
 * executes commands sequentially, and logs output to .codex.done
 */

import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract the COMMAND PLAN section from hand-off.md
 */
async function extractCommandPlan(filePath) {
  const content = await readFile(filePath, 'utf-8');
  
  // Find the section starting with "## COMMAND PLAN"
  const commandPlanMatch = content.match(/## COMMAND PLAN\s*```(?:bash)?\s*([\s\S]*?)```/);
  
  if (!commandPlanMatch) {
    throw new Error('No COMMAND PLAN section found in ops/hand-off.md');
  }
  
  return commandPlanMatch[1].trim();
}

/**
 * Execute a single command and capture output
 */
function executeCommand(command) {
  return new Promise((resolve) => {
    const timestamp = new Date().toISOString();
    
    console.log(`\n[${timestamp}] Executing: ${command}`);
    
    const proc = spawn('bash', ['-c', command], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env },
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });
    
    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });
    
    proc.on('close', (exitCode) => {
      resolve({
        command,
        exitCode,
        stdout,
        stderr,
        timestamp,
      });
    });
    
    proc.on('error', (error) => {
      console.error(`Error executing command: ${error.message}`);
      resolve({
        command,
        exitCode: -1,
        stdout,
        stderr: stderr + `\nError: ${error.message}`,
        timestamp,
      });
    });
  });
}

/**
 * Parse commands from the command plan, handling comments and multi-line commands
 */
function parseCommands(commandPlan) {
  const lines = commandPlan.split('\n');
  const commands = [];
  let currentCommand = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines and comments
    if (line.trim() === '' || line.trim().startsWith('#')) {
      // If we have a current command, save it
      if (currentCommand.trim()) {
        commands.push(currentCommand.trim());
        currentCommand = '';
      }
      continue;
    }
    
    // Check if line ends with line continuation
    if (line.endsWith('\\')) {
      currentCommand += line.slice(0, -1) + ' ';
    } else {
      currentCommand += line;
      // Check if this is part of a multi-line construct (e.g., within parentheses)
      const openParens = (currentCommand.match(/\(/g) || []).length;
      const closeParens = (currentCommand.match(/\)/g) || []).length;
      
      if (openParens === closeParens) {
        commands.push(currentCommand.trim());
        currentCommand = '';
      } else {
        currentCommand += '\n';
      }
    }
  }
  
  // Add any remaining command
  if (currentCommand.trim()) {
    commands.push(currentCommand.trim());
  }
  
  return commands.filter(cmd => cmd.length > 0);
}

/**
 * Main execution function
 */
async function main() {
  const workspaceRoot = path.resolve(__dirname, '..');
  const handOffPath = path.join(workspaceRoot, 'ops', 'hand-off.md');
  const outputPath = path.join(workspaceRoot, '.codex.done');
  
  console.log('=== Codex Runner Started ===');
  console.log(`Workspace: ${workspaceRoot}`);
  console.log(`Reading from: ${handOffPath}`);
  console.log(`Output will be written to: ${outputPath}`);
  
  try {
    // Extract the command plan
    const commandPlan = await extractCommandPlan(handOffPath);
    console.log('\n=== Extracted Command Plan ===');
    console.log(commandPlan);
    
    // Parse individual commands
    const commands = parseCommands(commandPlan);
    console.log(`\n=== Found ${commands.length} commands to execute ===`);
    
    // Execute commands sequentially
    const results = [];
    
    for (const command of commands) {
      const result = await executeCommand(command);
      results.push(result);
      
      // Stop on first failure (non-zero exit code)
      if (result.exitCode !== 0 && result.exitCode !== null) {
        console.log(`\n⚠️  Command failed with exit code ${result.exitCode}, stopping execution`);
        break;
      }
    }
    
    // Generate output report
    const report = {
      status: results.every(r => r.exitCode === 0) ? 'success' : 'failure',
      timestamp: new Date().toISOString(),
      totalCommands: commands.length,
      executedCommands: results.length,
      results,
    };
    
    // Write the .codex.done file
    await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');
    console.log(`\n=== Codex Runner Completed ===`);
    console.log(`Results written to: ${outputPath}`);
    console.log(`Status: ${report.status}`);
    
    // Exit with error if any command failed
    if (report.status === 'failure') {
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Codex Runner Error: ${error}`);
    
    // Write error to .codex.done
    const errorReport = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
    
    await writeFile(outputPath, JSON.stringify(errorReport, null, 2) + '\n', 'utf-8');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
