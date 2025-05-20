#!/usr/bin/env node
import { exec } from 'child_process';

const agents = [
  { name: 'infrastructure', script: 'agents/infrastructure_agent.js' },
  { name: 'production', script: 'agents/production_manager_agent.js' },
  { name: 'filesystem', script: 'agents/filesystem_agent.js' }
];

const MCP_URL = process.env.MCP_URL || 'https://project-ignite.kd8jc7v8cd.workers.dev';

function startAgent(agent) {
  console.log(`[INFO] Starting ${agent.name} agent...`);
  const proc = exec(`node ${agent.script}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`[ERROR] ${agent.name} agent exited:`, err);
    }
    if (stdout) console.log(`[${agent.name} stdout]:`, stdout);
    if (stderr) console.error(`[${agent.name} stderr]:`, stderr);
  });
  proc.on('spawn', () => {
    console.log(`[INFO] ${agent.name} agent started (PID: ${proc.pid})`);
  });
  return proc;
}

function submitTestTask(agentType) {
  let content, provider;
  switch (agentType) {
    case 'infrastructure':
      content = 'Run terraform plan'; provider = 'infrastructure'; break;
    case 'production':
      content = 'Deploy new release'; provider = 'production'; break;
    case 'filesystem':
      content = 'List files in /tmp'; provider = 'filesystem'; break;
    default:
      content = 'Test task'; provider = agentType;
  }
  const payload = JSON.stringify({ content, provider });
  exec(`curl -X POST ${MCP_URL}/task -H 'Content-Type: application/json' -d '${payload}'`, (err, stdout, stderr) => {
    if (err) {
      console.error(`[ERROR] Failed to submit test task for ${agentType}:`, err);
    } else {
      console.log(`[INFO] Submitted test task for ${agentType}:`, stdout.trim());
    }
    if (stderr) console.error(`[${agentType} curl stderr]:`, stderr);
  });
}

// Start all agents
const procs = agents.map(startAgent);

// Give agents a moment to register, then submit test tasks
setTimeout(() => {
  agents.forEach(agent => submitTestTask(agent.name));
}, 5000);

// Keep the main process alive
process.stdin.resume(); 