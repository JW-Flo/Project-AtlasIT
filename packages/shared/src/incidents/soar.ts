/**
 * SOAR (Security Orchestration, Automation and Response) integration stubs.
 * Provides a uniform interface for incident escalation to external platforms.
 * These stubs return success responses and can be swapped for real API calls.
 */

import type { IncidentSeverity, IncidentStatus } from "./lifecycle";

export interface SoarIncident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  ownerEmail: string | null;
  createdAt: string;
  tenantId: string;
}

export interface SoarResponse {
  success: boolean;
  externalId?: string;
  provider: string;
  message?: string;
}

export interface SoarProvider {
  readonly name: string;
  createIncident(incident: SoarIncident): Promise<SoarResponse>;
  updateIncident(externalId: string, updates: Partial<SoarIncident>): Promise<SoarResponse>;
  resolveIncident(externalId: string): Promise<SoarResponse>;
  acknowledge(externalId: string): Promise<SoarResponse>;
}

export type SoarProviderName = "pagerduty" | "opsgenie" | "servicenow";

export interface SoarConfig {
  provider: SoarProviderName;
  apiKey: string;
  enabled: boolean;
  baseUrl?: string;
  routingKey?: string;
}

export const SUPPORTED_PROVIDERS: SoarProviderName[] = ["pagerduty", "opsgenie", "servicenow"];

function stubId(prefix: string): string {
  return `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export class PagerDutyStub implements SoarProvider {
  readonly name = "pagerduty";

  async createIncident(incident: SoarIncident): Promise<SoarResponse> {
    return {
      success: true,
      externalId: stubId("stub-pd-"),
      provider: this.name,
      message: `[stub] PagerDuty incident created for: ${incident.title}`,
    };
  }

  async updateIncident(externalId: string, _updates: Partial<SoarIncident>): Promise<SoarResponse> {
    return { success: true, externalId, provider: this.name, message: "[stub] Updated" };
  }

  async resolveIncident(externalId: string): Promise<SoarResponse> {
    return { success: true, externalId, provider: this.name, message: "[stub] Resolved" };
  }

  async acknowledge(externalId: string): Promise<SoarResponse> {
    return { success: true, externalId, provider: this.name, message: "[stub] Acknowledged" };
  }
}

export class OpsgenieStub implements SoarProvider {
  readonly name = "opsgenie";

  async createIncident(incident: SoarIncident): Promise<SoarResponse> {
    return {
      success: true,
      externalId: stubId("stub-og-"),
      provider: this.name,
      message: `[stub] Opsgenie alert created for: ${incident.title}`,
    };
  }

  async updateIncident(externalId: string, _updates: Partial<SoarIncident>): Promise<SoarResponse> {
    return { success: true, externalId, provider: this.name, message: "[stub] Updated" };
  }

  async resolveIncident(externalId: string): Promise<SoarResponse> {
    return { success: true, externalId, provider: this.name, message: "[stub] Resolved" };
  }

  async acknowledge(externalId: string): Promise<SoarResponse> {
    return { success: true, externalId, provider: this.name, message: "[stub] Acknowledged" };
  }
}

export class ServiceNowStub implements SoarProvider {
  readonly name = "servicenow";

  async createIncident(incident: SoarIncident): Promise<SoarResponse> {
    return {
      success: true,
      externalId: stubId("stub-sn-"),
      provider: this.name,
      message: `[stub] ServiceNow incident created for: ${incident.title}`,
    };
  }

  async updateIncident(externalId: string, _updates: Partial<SoarIncident>): Promise<SoarResponse> {
    return { success: true, externalId, provider: this.name, message: "[stub] Updated" };
  }

  async resolveIncident(externalId: string): Promise<SoarResponse> {
    return { success: true, externalId, provider: this.name, message: "[stub] Resolved" };
  }

  async acknowledge(externalId: string): Promise<SoarResponse> {
    return { success: true, externalId, provider: this.name, message: "[stub] Acknowledged" };
  }
}

export function createSoarProvider(config: SoarConfig): SoarProvider {
  switch (config.provider) {
    case "pagerduty":
      return new PagerDutyStub();
    case "opsgenie":
      return new OpsgenieStub();
    case "servicenow":
      return new ServiceNowStub();
    default:
      throw new Error(`Unsupported SOAR provider: ${config.provider}`);
  }
}
