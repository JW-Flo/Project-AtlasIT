#!/usr/bin/env node
import fetch from 'node-fetch';

const MCP_URL = process.env.MCP_URL || 'https://project-ignite-mcp.kd8jc7v8cd.workers.dev';
const AGENT_NAME = process.env.AGENT_NAME || 'production-agent';
const POLL_INTERVAL = 5000; // ms

// Task priorities
const PRIORITIES = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
};

// Simulated escalation logic
function shouldEscalate(task) {
  // Escalate if CRITICAL or ambiguous
  return task.priority === 'CRITICAL' || !task.action;
}

// Simulated execution logic
async function executeTask(task) {
  // Simulate work
  await new Promise(r => setTimeout(r, 1000));
  return {
    status: 'completed',
    output: `Executed action '${task.action}' on target '${task.params?.target || 'N/A'}'`,
    completed_at: new Date().toISOString()
  };
}

// Log helper
function log(msg, ...args) {
  console.log(`[${new Date().toISOString()}] [${AGENT_NAME}] ${msg}`, ...args);
}

async function pollAndAct() {
  while (true) {
    try {
      // Fetch all tasks
      const res = await fetch(`${MCP_URL}/task/list`);
      const { tasks = [] } = await res.json();
      // Filter for this agent
      const myTasks = tasks.filter(t => t.agent === AGENT_NAME && !t.completed);
      if (myTasks.length === 0) {
        log('No tasks. Sleeping...');
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
        continue;
      }
      // Prioritize
      myTasks.sort((a, b) => (PRIORITIES[a.priority] ?? 2) - (PRIORITIES[b.priority] ?? 2));
      for (const task of myTasks) {
        log('Evaluating task:', task);
        if (shouldEscalate(task)) {
          log('Escalating task:', task.task_id);
          await reportResult(task.task_id, 'escalated', 'Task escalated to management');
          continue;
        }
        // Execute
        log('Executing task:', task.task_id);
        const result = await executeTask(task);
        await reportResult(task.task_id, result.status, result.output);
      }
    } catch (err) {
      log('Error in agent loop:', err);
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
}

async function reportResult(task_id, status, output) {
  const res = await fetch(`${MCP_URL}/task/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_id,
      agent: AGENT_NAME,
      status,
      output,
      reported_at: new Date().toISOString()
    })
  });
  const data = await res.json();
  log('Reported result:', data);
}

// Register agent on startup
async function registerAgent() {
  const res = await fetch(`${MCP_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: AGENT_NAME,
      type: 'production',
      capabilities: ['build', 'deploy', 'monitor', 'triage', 'escalate']
    })
  });
  const data = await res.json();
  log('Registered agent:', data);
}

// Start
(async () => {
  await registerAgent();
  await pollAndAct();
})(); 