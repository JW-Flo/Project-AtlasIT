import { describe, it, expect } from "vitest";
import {
  classifySeverity,
  type EventData,
  type ClassificationResult,
  CLASSIFICATION_RULES,
} from "../packages/shared/src/incidents/classifier";

describe("classifySeverity", () => {
  it("classifies data breach events as critical", () => {
    const event: EventData = {
      type: "security.alert",
      source: "okta",
      title: "Potential data breach detected",
      description: "Unauthorized export of user PII from production database",
      metadata: {},
    };
    const result = classifySeverity(event);
    expect(result.severity).toBe("critical");
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.matchedRules.length).toBeGreaterThan(0);
  });

  it("classifies account compromise as critical", () => {
    const event: EventData = {
      type: "security.alert",
      source: "okta",
      title: "Admin account compromised",
      description: "Multiple failed MFA attempts followed by successful login from unknown IP",
      metadata: { userRole: "admin" },
    };
    const result = classifySeverity(event);
    expect(result.severity).toBe("critical");
  });

  it("classifies service outage as high", () => {
    const event: EventData = {
      type: "system.alert",
      source: "monitoring",
      title: "Production API service down",
      description: "HTTP 503 errors across all endpoints, service unreachable",
      metadata: {},
    };
    const result = classifySeverity(event);
    expect(result.severity).toBe("high");
  });

  it("classifies permission changes as medium", () => {
    const event: EventData = {
      type: "audit.change",
      source: "google-workspace",
      title: "User role elevated",
      description: "User john@example.com was granted editor access to shared drive",
      metadata: {},
    };
    const result = classifySeverity(event);
    expect(result.severity).toBe("medium");
  });

  it("classifies informational events as low", () => {
    const event: EventData = {
      type: "audit.info",
      source: "jira",
      title: "New user onboarded",
      description: "User jane@example.com completed onboarding checklist",
      metadata: {},
    };
    const result = classifySeverity(event);
    expect(result.severity).toBe("low");
  });

  it("returns medium as default for ambiguous events", () => {
    const event: EventData = {
      type: "unknown",
      source: "custom",
      title: "Something happened",
      description: "",
      metadata: {},
    };
    const result = classifySeverity(event);
    expect(result.severity).toBe("medium");
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("boosts severity when admin users are involved", () => {
    const event: EventData = {
      type: "audit.change",
      source: "okta",
      title: "Password reset",
      description: "Password was reset for user",
      metadata: { userRole: "admin" },
    };
    const result = classifySeverity(event);
    // Admin involvement should boost severity
    expect(["critical", "high"]).toContain(result.severity);
  });

  it("boosts severity for production environment", () => {
    const event: EventData = {
      type: "system.alert",
      source: "aws",
      title: "Configuration change",
      description: "Security group modified in production VPC",
      metadata: { environment: "production" },
    };
    const result = classifySeverity(event);
    expect(["critical", "high"]).toContain(result.severity);
  });

  it("provides matched rule names in the result", () => {
    const event: EventData = {
      type: "security.alert",
      source: "okta",
      title: "Ransomware detected",
      description: "Ransomware activity detected on endpoint",
      metadata: {},
    };
    const result = classifySeverity(event);
    expect(result.matchedRules).toBeInstanceOf(Array);
    result.matchedRules.forEach((rule) => {
      expect(typeof rule).toBe("string");
      expect(rule.length).toBeGreaterThan(0);
    });
  });

  it("returns autoClassified flag", () => {
    const event: EventData = {
      type: "security.alert",
      source: "okta",
      title: "Failed login",
      description: "Multiple failed login attempts",
      metadata: {},
    };
    const result = classifySeverity(event);
    expect(result.autoClassified).toBe(true);
  });

  it("exports classification rules for inspection", () => {
    expect(CLASSIFICATION_RULES).toBeInstanceOf(Array);
    expect(CLASSIFICATION_RULES.length).toBeGreaterThan(0);
    CLASSIFICATION_RULES.forEach((rule) => {
      expect(rule).toHaveProperty("name");
      expect(rule).toHaveProperty("severity");
      expect(rule).toHaveProperty("patterns");
    });
  });
});
