// Design rationale: This entrypoint coordinates the RepairAgent and Orchestrator for full autonomy. It ensures all repairs are made before agents start, and logs any fatal errors. No human input required.

import { RepairAgent } from "./agents/repair_agent.js";
import orchestrator from "./agents/orchestrator.js";

async function main() {
  try {
    const repairAgent = new RepairAgent();
    await repairAgent.run();
    await orchestrator.startAllAgents();
    // Keep process alive for agent monitoring
    process.stdin.resume();
  } catch (err) {
    console.error("[FATAL] Autonomous startup failed:", err);
    process.exit(1);
  }
}

main();
