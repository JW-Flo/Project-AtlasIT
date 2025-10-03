import { MonitoringAgent } from "./monitoring_agent.js";
import { SecurityAgent } from "./security_agent.js";
import { DeploymentAgent } from "./deployment_agent.js";
import { InfrastructureAgent } from "./infrastructure_agent.js";
import { FilesystemAgent } from "./filesystem_agent.js";
import { GCPPOCAgent } from "./gcp_poc_agent.js";
import { RepairAgent } from "./repair_agent.js";
import { SlackAPI } from "../utils/slack.js";
import { LoggingAPI } from "../utils/logging.js";

class AgentOrchestrator {
  constructor() {
    this.agents = new Map();
    this.agentStatus = new Map();
    this.slack = new SlackAPI();
    this.logging = new LoggingAPI();
    this.initializeAgents();
  }

  initializeAgents() {
    // Initialize all agents
    this.agents.set("repair", new RepairAgent());
    this.agents.set("monitoring", new MonitoringAgent());
    this.agents.set("security", new SecurityAgent());
    this.agents.set("deployment", new DeploymentAgent());
    this.agents.set("infrastructure", new InfrastructureAgent());
    this.agents.set("filesystem", new FilesystemAgent());
    this.agents.set("gcp_poc", new GCPPOCAgent());
  }

  async startAllAgents() {
    await this.logging.logInfo("orchestrator", "Starting all agents...");
    await this.slack.sendAlert("🚀 Starting Project Ignite Agent System");

    const startResults = new Map();

    for (const [name, agent] of this.agents) {
      try {
        await agent.start();
        this.agentStatus.set(name, "running");
        startResults.set(name, "success");
        await this.logging.logInfo(
          "orchestrator",
          `${name} agent started successfully`,
        );
      } catch (error) {
        this.agentStatus.set(name, "error");
        startResults.set(name, "failed");
        await this.logging.logError("orchestrator", {
          context: `Failed to start ${name} agent`,
          error: error.message,
          stack: error.stack,
        });

        // Attempt to restart failed agent
        await this.attemptAgentRestart(name);
      }
    }

    // Send startup summary to Slack
    const summary = Array.from(startResults.entries())
      .map(([name, status]) => `${name}: ${status === "success" ? "✅" : "❌"}`)
      .join("\n");

    await this.slack.sendAlert(`📊 Agent Startup Summary:\n${summary}`);

    // Start monitoring agent status
    this.monitorAgentStatus();
  }

  async attemptAgentRestart(agentName, retries = 3) {
    const agent = this.agents.get(agentName);
    if (!agent) return;

    await this.slack.sendAlert(
      `🔄 Attempting to restart ${agentName} agent...`,
    );

    for (let i = 0; i < retries; i++) {
      try {
        await this.logging.logInfo(
          "orchestrator",
          `Restart attempt ${i + 1}/${retries} for ${agentName}`,
        );
        await agent.start();
        this.agentStatus.set(agentName, "running");
        await this.slack.sendAlert(
          `✅ ${agentName} agent restarted successfully`,
        );
        return;
      } catch (error) {
        await this.logging.logError("orchestrator", {
          context: `Failed to restart ${agentName} (attempt ${i + 1}/${retries})`,
          error: error.message,
          stack: error.stack,
        });
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds between retries
      }
    }

    // If all retries failed, mark agent as failed
    this.agentStatus.set(agentName, "failed");
    await this.slack.sendAlert(
      `❌ ${agentName} agent failed to start after ${retries} attempts`,
    );
  }

  monitorAgentStatus() {
    setInterval(async () => {
      const statusReport = new Map();
      let hasIssues = false;

      for (const [name, status] of this.agentStatus) {
        if (status === "error" || status === "failed") {
          hasIssues = true;
          statusReport.set(name, status);
          await this.attemptAgentRestart(name);
        }
      }

      if (hasIssues) {
        const summary = Array.from(statusReport.entries())
          .map(([name, status]) => `${name}: ${status}`)
          .join("\n");

        await this.slack.sendAlert(
          `⚠️ Agent Status Issues Detected:\n${summary}`,
        );
      }
    }, 60000); // Check every minute
  }

  async stopAllAgents() {
    await this.logging.logInfo("orchestrator", "Stopping all agents...");
    await this.slack.sendAlert("🛑 Stopping Project Ignite Agent System");

    const stopResults = new Map();

    for (const [name, agent] of this.agents) {
      try {
        await agent.stop();
        this.agentStatus.set(name, "stopped");
        stopResults.set(name, "success");
        await this.logging.logInfo(
          "orchestrator",
          `${name} agent stopped successfully`,
        );
      } catch (error) {
        stopResults.set(name, "failed");
        await this.logging.logError("orchestrator", {
          context: `Failed to stop ${name} agent`,
          error: error.message,
          stack: error.stack,
        });
      }
    }

    // Send shutdown summary to Slack
    const summary = Array.from(stopResults.entries())
      .map(([name, status]) => `${name}: ${status === "success" ? "✅" : "❌"}`)
      .join("\n");

    await this.slack.sendAlert(`📊 Agent Shutdown Summary:\n${summary}`);
  }

  getAgentStatus() {
    return Object.fromEntries(this.agentStatus);
  }

  async handleAgentError(agentName, error) {
    await this.logging.logError("orchestrator", {
      context: `Error in ${agentName} agent`,
      error: error.message,
      stack: error.stack,
    });

    this.agentStatus.set(agentName, "error");

    // Notify other agents if needed
    if (agentName === "security") {
      // Security agent errors are critical
      await this.agents.get("monitoring").handleSecurityError(error);
    }

    // Attempt to restart the agent
    await this.attemptAgentRestart(agentName);
  }
}

// Create and export a singleton instance
const orchestrator = new AgentOrchestrator();
export default orchestrator;
