import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { resetScanRuntime } from "../../src/runtime/scans/service";
import { clearConfigCache } from "../../src/runtime/config/dynamicConfig";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetEnv();
  resetScanRuntime();
  clearConfigCache();
});

afterEach(() => {
  vi.useRealTimers();
  resetEnv();
  resetScanRuntime();
  clearConfigCache();
});

describe("admin reload endpoint", () => {
  it("debounces subsequent reload attempts", async () => {
    vi.useFakeTimers();
    const { POST } = await import(
      "../../../JW-Site/src/pages/api/admin/reload.ts"
    );

    const first = await POST({} as any);
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.ok).toBe(true);

    const second = await POST({} as any);
    expect(second.status).toBe(429);
    const secondBody = await second.json();
    expect(secondBody.error).toBe("RELOAD_TOO_FREQUENT");
    expect(typeof secondBody.nextAllowedTs).toBe("number");

    vi.advanceTimersByTime(2000);

    const third = await POST({} as any);
    expect(third.status).toBe(200);
    const thirdBody = await third.json();
    expect(thirdBody.ok).toBe(true);
  });
});

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value as string;
  }
}
