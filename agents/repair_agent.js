// Design rationale: This RepairAgent proactively scans for known Node.js compatibility issues (e.g., 'cloudflare:' imports), auto-remediates them before orchestrator startup, and notifies Slack of any fixes. This prevents runtime failures and enables self-healing before errors impact the system.

import fs from 'fs';
import path from 'path';
import { LoggingAPI } from '../utils/logging.js';
import { SlackAPI } from '../utils/slack.js';

export class RepairAgent {
  constructor() {
    this.logging = new LoggingAPI();
    this.slack = new SlackAPI();
    this.projectRoot = process.cwd();
    this.knownPatterns = [
      {
        description: 'Remove unsupported cloudflare: imports',
        file: 'mcp_index.js',
        regex: /import\s+\{[^}]+\}\s+from\s+['"]cloudflare:workers['"];?/g,
        replacement: match => `// [auto-removed by RepairAgent] ${match}`
      }
    ];
    this.running = false;
    this.interval = null;
  }

  async run() {
    let anyFixes = false;
    for (const pattern of this.knownPatterns) {
      const filePath = path.join(this.projectRoot, pattern.file);
      if (!fs.existsSync(filePath)) continue;
      let content = fs.readFileSync(filePath, 'utf-8');
      const newContent = content.replace(pattern.regex, pattern.replacement);
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        anyFixes = true;
        await this.logging.logInfo('repair', `Patched: ${pattern.description} in ${pattern.file}`);
        await this.slack.sendAlert(`🛠️ RepairAgent: ${pattern.description} in ${pattern.file}`);
      }
    }
    if (!anyFixes) {
      await this.logging.logInfo('repair', 'No repairs needed. System is compatible.');
    }
    return anyFixes;
  }

  async start() {
    this.running = true;
    await this.run(); // Run immediately
    this.interval = setInterval(() => this.run(), 60000); // Run every 60 seconds
    await this.logging.logInfo('repair', 'RepairAgent started continuous operation.');
    await this.slack.sendAlert('🛠️ RepairAgent started continuous operation.');
  }

  async stop() {
    this.running = false;
    if (this.interval) clearInterval(this.interval);
    await this.logging.logInfo('repair', 'RepairAgent stopped.');
    await this.slack.sendAlert('🛠️ RepairAgent stopped.');
  }
}

// If run directly, execute the repair agent before orchestrator startup
default async function main() {
  const agent = new RepairAgent();
  await agent.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 