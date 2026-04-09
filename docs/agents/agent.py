import asyncio
from mcp_agent.core.fastagent import FastAgent

# Create the application
fast = FastAgent("Prometheus MCP Client Agent")

# Define the agent
@fast.agent(instruction="You are a Prometheus MCP Client Agent equipped to automate infrastructure, manage secure access, and ensure observability.")
async def main():
    async with fast.run() as agent:
        print("Welcome to the Prometheus MCP Client Agent interactive session!")

        # Add Prometheus-specific tools
        print("Initializing Prometheus tools...")
        agent.add_tool("infrastructure_deployer", lambda config: f"Deployed infrastructure with config: {config}")
        agent.add_tool("access_manager", lambda user: f"Generated secure access token for user: {user}")
        agent.add_tool("metrics_collector", lambda device: f"Collected metrics from device: {device}")
        agent.add_tool("workflow_orchestrator", lambda task: f"Orchestrated workflow for task: {task}")
        agent.add_tool("security_auditor", lambda config: f"Audited security configuration: {config}")

        # Demonstrate tool usage
        print(agent.use_tool("infrastructure_deployer", "Cloudflare Worker Config"))
        print(agent.use_tool("access_manager", "admin_user"))
        print(agent.use_tool("metrics_collector", "Edge Device 1"))
        print(agent.use_tool("workflow_orchestrator", "Device Onboarding"))
        print(agent.use_tool("security_auditor", "Zero-Trust Config"))

        # Start the interactive session
        await agent.interactive()

if __name__ == "__main__":
    asyncio.run(main())
