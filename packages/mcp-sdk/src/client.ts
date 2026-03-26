import type { AgentConfig, AgentRegistration } from "./types";

export class OrchestratorClient {
  constructor(
    private readonly orchestratorUrl: string,
    private readonly apiKey?: string,
  ) {}

  async registerAgent(
    config: Omit<AgentConfig, "orchestratorUrl">,
  ): Promise<AgentRegistration> {
    const response = await fetch(`${this.orchestratorUrl}/api/v1/agents`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        name: config.name,
        description: config.description,
        webhookUrl: config.webhookUrl,
        healthCheckUrl: config.healthCheckUrl,
        capabilities: config.capabilities,
        eventTypes: config.eventTypes,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Registration failed" }));
      throw new AgentSDKError(
        `Agent registration failed: ${(error as Record<string, string>).message}`,
        response.status,
      );
    }

    const result = (await response.json()) as { data: AgentRegistration };
    return result.data;
  }

  async updateAgent(
    agentId: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    const response = await fetch(
      `${this.orchestratorUrl}/api/v1/agents/${agentId}`,
      {
        method: "PATCH",
        headers: this.headers(),
        body: JSON.stringify(updates),
      },
    );

    if (!response.ok) {
      throw new AgentSDKError(`Agent update failed`, response.status);
    }
  }

  async addSubscription(
    agentId: string,
    eventType: string,
    filterExpression?: string,
  ): Promise<void> {
    const response = await fetch(
      `${this.orchestratorUrl}/api/v1/agents/${agentId}/subscriptions`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ eventType, filterExpression }),
      },
    );

    if (!response.ok) {
      throw new AgentSDKError(`Subscription failed`, response.status);
    }
  }

  async reportHealth(agentId: string): Promise<void> {
    const response = await fetch(
      `${this.orchestratorUrl}/api/v1/agents/${agentId}/health`,
      {
        method: "POST",
        headers: this.headers(),
      },
    );

    if (!response.ok) {
      throw new AgentSDKError(`Health report failed`, response.status);
    }
  }

  async deregister(agentId: string): Promise<void> {
    const response = await fetch(
      `${this.orchestratorUrl}/api/v1/agents/${agentId}`,
      {
        method: "DELETE",
        headers: this.headers(),
      },
    );

    if (!response.ok) {
      throw new AgentSDKError(`Deregistration failed`, response.status);
    }
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) h["X-API-Key"] = this.apiKey;
    return h;
  }
}

export class AgentSDKError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AgentSDKError";
  }
}
