import { describe, it, expect } from "vitest";
import { detectAiTool, hasHighRiskScopes, matchMarketplaceApp } from "../types";

describe("detectAiTool", () => {
  it("detects ChatGPT/OpenAI", () => {
    expect(detectAiTool("ChatGPT")).toEqual({ isAiTool: true, category: "llm" });
    expect(detectAiTool("OpenAI API")).toEqual({ isAiTool: true, category: "llm" });
  });

  it("detects Claude/Anthropic", () => {
    expect(detectAiTool("Claude")).toEqual({ isAiTool: true, category: "llm" });
    expect(detectAiTool("Anthropic API")).toEqual({ isAiTool: true, category: "llm" });
  });

  it("detects AI coding tools", () => {
    expect(detectAiTool("GitHub Copilot")).toEqual({ isAiTool: true, category: "ai_coding" });
    expect(detectAiTool("Cursor")).toEqual({ isAiTool: true, category: "ai_coding" });
    expect(detectAiTool("Tabnine")).toEqual({ isAiTool: true, category: "ai_coding" });
    expect(detectAiTool("Codeium")).toEqual({ isAiTool: true, category: "ai_coding" });
  });

  it("detects AI writing tools", () => {
    expect(detectAiTool("Jasper AI")).toEqual({ isAiTool: true, category: "ai_writing" });
    expect(detectAiTool("Grammarly")).toEqual({ isAiTool: true, category: "ai_writing" });
  });

  it("detects AI image tools", () => {
    expect(detectAiTool("Midjourney")).toEqual({ isAiTool: true, category: "ai_image" });
    expect(detectAiTool("DALL-E")).toEqual({ isAiTool: true, category: "ai_image" });
  });

  it("detects ML platforms", () => {
    expect(detectAiTool("Hugging Face")).toEqual({ isAiTool: true, category: "ml_platform" });
    expect(detectAiTool("Replicate")).toEqual({ isAiTool: true, category: "ml_platform" });
  });

  it("detects via domain", () => {
    expect(detectAiTool("Unknown App", "chatgpt.com")).toEqual({ isAiTool: true, category: "llm" });
    expect(detectAiTool("Some Tool", "anthropic.com")).toEqual({ isAiTool: true, category: "llm" });
  });

  it("returns false for non-AI apps", () => {
    expect(detectAiTool("Slack")).toEqual({ isAiTool: false, category: null });
    expect(detectAiTool("Google Drive")).toEqual({ isAiTool: false, category: null });
    expect(detectAiTool("Jira")).toEqual({ isAiTool: false, category: null });
  });
});

describe("hasHighRiskScopes", () => {
  it("detects mail read scopes", () => {
    expect(hasHighRiskScopes(["mail.read"])).toBe(true);
    expect(hasHighRiskScopes(["gmail.readonly"])).toBe(true);
    expect(hasHighRiskScopes(["Mail.ReadWrite"])).toBe(true);
  });

  it("detects drive/files scopes", () => {
    expect(hasHighRiskScopes(["drive.readonly"])).toBe(true);
    expect(hasHighRiskScopes(["Files.ReadWrite"])).toBe(true);
  });

  it("detects admin scopes", () => {
    expect(hasHighRiskScopes(["admin.directory.user.readonly"])).toBe(true);
  });

  it("detects wildcard scopes", () => {
    expect(hasHighRiskScopes(["*"])).toBe(true);
    expect(hasHighRiskScopes(["full_access"])).toBe(true);
  });

  it("returns false for narrow scopes", () => {
    expect(hasHighRiskScopes(["openid", "profile", "email"])).toBe(false);
    expect(hasHighRiskScopes(["user.read"])).toBe(false);
  });
});

describe("matchMarketplaceApp", () => {
  const catalog = [
    "google_workspace",
    "microsoft_365",
    "slack",
    "github",
    "jira",
    "zoom",
    "salesforce",
  ];

  it("matches exact names", () => {
    expect(matchMarketplaceApp("Slack", catalog)).toBe("slack");
    expect(matchMarketplaceApp("GitHub", catalog)).toBe("github");
    expect(matchMarketplaceApp("Zoom", catalog)).toBe("zoom");
  });

  it("matches partial names", () => {
    expect(matchMarketplaceApp("Google Workspace Admin", catalog)).toBe("google_workspace");
    expect(matchMarketplaceApp("Microsoft 365 Portal", catalog)).toBe("microsoft_365");
  });

  it("returns null for unknown apps", () => {
    expect(matchMarketplaceApp("Random Unknown App", catalog)).toBeNull();
    expect(matchMarketplaceApp("ChatGPT", catalog)).toBeNull();
  });
});
