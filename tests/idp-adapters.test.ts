import { describe, expect, it } from "vitest";
import {
  createAwsCognitoAdapter,
  createCrowdstrikeAdapter,
  createEntraAdapter,
  createGoogleWorkspaceAdapter,
  createOktaAdapter,
  createPaycomAdapter,
  createDevFallbackProvider,
} from "../packages/idp/src/index";

const ADAPTER_FACTORIES = [
  { name: "Okta", create: createOktaAdapter },
  { name: "Entra", create: createEntraAdapter },
  { name: "Google", create: createGoogleWorkspaceAdapter },
  { name: "AWS", create: createAwsCognitoAdapter },
  { name: "Paycom", create: createPaycomAdapter },
  { name: "CrowdStrike", create: createCrowdstrikeAdapter },
];

describe("static IdP adapters", () => {
  for (const factory of ADAPTER_FACTORIES) {
    it(`exposes metadata and basic contract for ${factory.name}`, async () => {
      const adapter = factory.create();
      expect(adapter.metadata.name).toMatch(/^[A-Za-z0-9\s-]+$/);
      expect(adapter.metadata.kind).toBeDefined();

      const users = await adapter.listUsers();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]?.email).toContain("@");

      const user = await adapter.getUser(users[0]!.id);
      expect(user?.id).toBe(users[0]!.id);

      const token = await adapter.issueToken({ subject: users[0]!.id });
      expect(token.token).toBeTruthy();
      expect(token.issuedAt).toBeDefined();
      expect(token.expiresAt).toBeDefined();

      const decoded = JSON.parse(Buffer.from(token.token, "base64url").toString("utf8"));
      expect(decoded.sub).toBe(users[0]!.id);
      expect(decoded.provider).toBe(adapter.metadata.kind);
    });
  }
});

describe("dev fallback provider", () => {
  it("registers users dynamically and issues tokens", async () => {
    const fallback = createDevFallbackProvider({ audience: "atlasit-dev-test" });
    fallback.registerUser({
      id: "dev-user-99",
      email: "dev99@example.local",
      displayName: "Dev NinetyNine",
      status: "active",
    });

    const users = await fallback.listUsers();
    expect(users.find((user) => user.id === "dev-user-99")).toBeTruthy();

    const token = await fallback.issueToken({ subject: "dev-user-99", ttlSeconds: 60 });
    const payload = JSON.parse(Buffer.from(token.token, "base64url").toString("utf8"));
    expect(payload.aud).toBe("atlasit-dev-test");
    expect(payload.exp - payload.iat).toBeLessThanOrEqual(60);
  });
});
