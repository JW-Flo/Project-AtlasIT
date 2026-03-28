import { describe, it, expect, vi } from "vitest";
import { detectAiTool, hasHighRiskScopes, matchMarketplaceApp } from "@atlasit/shared";

describe("discovery-sync integration", () => {
  describe("AI tool detection in discovery context", () => {
    it("flags ChatGPT OAuth grants as AI tools", () => {
      const result = detectAiTool("ChatGPT");
      expect(result.isAiTool).toBe(true);
      expect(result.category).toBe("llm");
    });

    it("flags GitHub Copilot as AI coding tool", () => {
      const result = detectAiTool("GitHub Copilot");
      expect(result.isAiTool).toBe(true);
      expect(result.category).toBe("ai_coding");
    });

    it("does not flag legitimate SaaS apps", () => {
      expect(detectAiTool("Salesforce").isAiTool).toBe(false);
      expect(detectAiTool("Zendesk").isAiTool).toBe(false);
      expect(detectAiTool("Dropbox").isAiTool).toBe(false);
    });
  });

  describe("high risk scope detection", () => {
    it("flags mail read scopes as high risk", () => {
      expect(hasHighRiskScopes(["mail.read", "user.read"])).toBe(true);
    });

    it("flags drive scopes as high risk", () => {
      expect(hasHighRiskScopes(["drive.readonly"])).toBe(true);
    });

    it("does not flag basic scopes", () => {
      expect(hasHighRiskScopes(["openid", "profile", "email"])).toBe(false);
    });

    it("flags wildcard as high risk", () => {
      expect(hasHighRiskScopes(["*"])).toBe(true);
    });
  });

  describe("marketplace matching", () => {
    const catalog = [
      "google_workspace", "microsoft_365", "slack", "github",
      "jira", "zoom", "salesforce", "aws",
    ];

    it("matches known apps to catalog", () => {
      expect(matchMarketplaceApp("Slack", catalog)).toBe("slack");
      expect(matchMarketplaceApp("Zoom Meetings", catalog)).toBe("zoom");
    });

    it("returns null for unknown apps", () => {
      expect(matchMarketplaceApp("Random SaaS Tool", catalog)).toBeNull();
    });
  });
});
