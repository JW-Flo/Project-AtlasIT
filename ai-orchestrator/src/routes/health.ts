import { Hono } from "hono";
import type { AppEnv } from "../types";

export const healthRoute = new Hono<AppEnv>();

healthRoute.get("/health", async (c) => {
  const checks: Record<string, { status: string; message?: string }> = {};
  try {
    await c.env.DB.prepare("SELECT 1").first();
    checks.d1 = { status: "pass" };
  } catch (e) {
    checks.d1 = {
      status: "fail",
      message: e instanceof Error ? e.message : "Unknown",
    };
  }
  try {
    await c.env.TASKS.get("__health__");
    checks.kv = { status: "pass" };
  } catch (e) {
    checks.kv = {
      status: "fail",
      message: e instanceof Error ? e.message : "Unknown",
    };
  }
  const hasFailure = Object.values(checks).some((ch) => ch.status === "fail");
  return c.json({
    status: hasFailure ? "degraded" : "healthy",
    timestamp: new Date().toISOString(),
    version: "0.2.0",
    service: "orchestrator",
    checks,
  });
});
