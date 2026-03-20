/**
 * Tests for credential encryption safety in credentials.ts.
 *
 * Run with: vitest run console-app/src/lib/server/__tests__/credentials.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveCredentials, getCredentials, saveOAuthTokens, getOAuthAccessToken } from "../credentials";

// ---------------------------------------------------------------------------
// D1 mock factory
// ---------------------------------------------------------------------------

function makeMockDb(stored: Record<string, string> = {}) {
  const store = { ...stored };
  const run = vi.fn().mockResolvedValue({});
  const first = vi.fn().mockImplementation(async () => {
    const key = Object.keys(store)[0];
    return key ? { credentials: store[key], access_token: store[key] } : null;
  });
  const all = vi.fn().mockResolvedValue({ results: [] });
  const bind = vi.fn(() => ({ run, first, all }));
  const prepare = vi.fn(() => ({ bind }));
  return { prepare, run, bind, first, store };
}

function makePlatform(
  overrides: Record<string, unknown> = {},
): { env: Record<string, unknown> } {
  return {
    env: {
      ATLAS_SHARED_DB: makeMockDb(),
      ...overrides,
    },
  };
}

// ---------------------------------------------------------------------------
// saveCredentials
// ---------------------------------------------------------------------------

describe("saveCredentials", () => {
  it("encrypts credentials when CRED_ENCRYPTION_KEY is set", async () => {
    const db = makeMockDb();
    const platform = { env: { ATLAS_SHARED_DB: db, CRED_ENCRYPTION_KEY: "test-secret-key" } };
    const result = await saveCredentials(platform as any, "okta", { apiKey: "secret" }, "tenant-1");

    expect(result.ok).toBe(true);
    // The stored value must not be plain JSON
    const storedArg = db.bind.mock.results[0]?.value ?? db.bind.mock.calls[0];
    const boundArgs = db.bind.mock.calls[0];
    // Third bound argument is the credentials value
    const credValue = boundArgs[2] as string;
    expect(credValue).not.toContain('"apiKey"');
    expect(credValue).toMatch(/^[0-9a-f]+:[0-9a-f]+$/); // iv_hex:ct_hex
  });

  it("stores plaintext in dev (NODE_ENV=development, no key) with a warning", async () => {
    const db = makeMockDb();
    const platform = { env: { ATLAS_SHARED_DB: db, NODE_ENV: "development" } };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await saveCredentials(platform as any, "okta", { apiKey: "secret" }, "tenant-1");

    expect(result.ok).toBe(true);
    const credValue = db.bind.mock.calls[0][2] as string;
    expect(credValue).toContain('"apiKey"');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("plaintext"));

    warnSpy.mockRestore();
  });

  it("throws in production when CRED_ENCRYPTION_KEY is missing", async () => {
    const db = makeMockDb();
    // NODE_ENV not set to development = production mode
    const platform = { env: { ATLAS_SHARED_DB: db } };

    await expect(
      saveCredentials(platform as any, "okta", { apiKey: "secret" }, "tenant-1"),
    ).rejects.toThrow(/CRED_ENCRYPTION_KEY/);
  });
});

// ---------------------------------------------------------------------------
// getCredentials
// ---------------------------------------------------------------------------

describe("getCredentials", () => {
  it("decrypts credentials when CRED_ENCRYPTION_KEY is set", async () => {
    const payload = JSON.stringify({ apiKey: "my-secret" });
    // We need a real encrypted value — encrypt inline using WebCrypto
    const key = "test-secret-key";
    const raw = new TextEncoder().encode(key);
    const hash = await crypto.subtle.digest("SHA-256", raw);
    const cryptoKey = await crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    const iv = new Uint8Array(12).fill(1); // fixed IV for reproducibility
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, new TextEncoder().encode(payload));
    const toHex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
    const encrypted = `${toHex(iv.buffer)}:${toHex(ct)}`;

    const db = makeMockDb();
    db.first.mockResolvedValue({ credentials: encrypted });
    const platform = { env: { ATLAS_SHARED_DB: db, CRED_ENCRYPTION_KEY: key } };

    const result = await getCredentials(platform as any, "okta", "tenant-1");
    expect(result).toEqual({ apiKey: "my-secret" });
  });

  it("returns plaintext JSON in dev (NODE_ENV=development, no key)", async () => {
    const payload = JSON.stringify({ apiKey: "my-secret" });
    const db = makeMockDb();
    db.first.mockResolvedValue({ credentials: payload });
    const platform = { env: { ATLAS_SHARED_DB: db, NODE_ENV: "development" } };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await getCredentials(platform as any, "okta", "tenant-1");
    expect(result).toEqual({ apiKey: "my-secret" });

    warnSpy.mockRestore();
  });

  it("throws in production when CRED_ENCRYPTION_KEY is missing", async () => {
    const payload = JSON.stringify({ apiKey: "my-secret" });
    const db = makeMockDb();
    db.first.mockResolvedValue({ credentials: payload });
    const platform = { env: { ATLAS_SHARED_DB: db } };

    await expect(
      getCredentials(platform as any, "okta", "tenant-1"),
    ).rejects.toThrow(/CRED_ENCRYPTION_KEY/);
  });
});

// ---------------------------------------------------------------------------
// saveOAuthTokens
// ---------------------------------------------------------------------------

describe("saveOAuthTokens", () => {
  it("encrypts access and refresh tokens when key is set", async () => {
    const db = makeMockDb();
    const platform = { env: { ATLAS_SHARED_DB: db, CRED_ENCRYPTION_KEY: "test-secret-key" } };

    await saveOAuthTokens(
      platform as any,
      "google-workspace",
      { access_token: "at-plain", refresh_token: "rt-plain" },
      "tenant-1",
    );

    const boundArgs = db.bind.mock.calls[0];
    const accessToken = boundArgs[2] as string;
    const refreshToken = boundArgs[3] as string;
    expect(accessToken).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    expect(refreshToken).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it("throws in production when CRED_ENCRYPTION_KEY is missing", async () => {
    const db = makeMockDb();
    const platform = { env: { ATLAS_SHARED_DB: db } };

    await expect(
      saveOAuthTokens(
        platform as any,
        "google-workspace",
        { access_token: "at-plain" },
        "tenant-1",
      ),
    ).rejects.toThrow(/CRED_ENCRYPTION_KEY/);
  });

  it("stores plaintext tokens in dev with a warning", async () => {
    const db = makeMockDb();
    const platform = { env: { ATLAS_SHARED_DB: db, NODE_ENV: "development" } };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await saveOAuthTokens(
      platform as any,
      "google-workspace",
      { access_token: "at-plain" },
      "tenant-1",
    );

    const accessToken = db.bind.mock.calls[0][2] as string;
    expect(accessToken).toBe("at-plain");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("plaintext"));

    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// getOAuthAccessToken
// ---------------------------------------------------------------------------

describe("getOAuthAccessToken", () => {
  it("throws in production when CRED_ENCRYPTION_KEY is missing", async () => {
    const db = makeMockDb();
    db.first.mockResolvedValue({ access_token: "some-token" });
    const platform = { env: { ATLAS_SHARED_DB: db } };

    await expect(
      getOAuthAccessToken(platform as any, "google-workspace", "tenant-1"),
    ).rejects.toThrow(/CRED_ENCRYPTION_KEY/);
  });

  it("returns plaintext token in dev with a warning", async () => {
    const db = makeMockDb();
    db.first.mockResolvedValue({ access_token: "at-plain" });
    const platform = { env: { ATLAS_SHARED_DB: db, NODE_ENV: "development" } };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await getOAuthAccessToken(platform as any, "google-workspace", "tenant-1");
    expect(result).toBe("at-plain");

    warnSpy.mockRestore();
  });
});
