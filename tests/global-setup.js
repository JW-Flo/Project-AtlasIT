import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";

async function getPort(start = 5173) {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.listen(start, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", () => resolve(getPort(start + 1)));
  });
}

export default async function globalSetup() {
  const consoleDir = path.join(process.cwd(), "console-app");
  if (!fs.existsSync(consoleDir)) {
    console.warn(
      "[globalSetup] console-app directory missing; skipping preview start",
    );
    return;
  }
  const port = await getPort(5173);
  process.env.PLAYWRIGHT_BASE_URL = `http://localhost:${port}`;

  await new Promise((resolve, reject) => {
    const build = spawn("npm", ["run", "build:console"], {
      stdio: "inherit",
      shell: true,
    });
    build.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("console build failed")),
    );
  });

  const preview = spawn(
    "npm",
    ["run", "preview:console", "--", "--port", String(port), "--strictPort"],
    {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, PORT: String(port) },
    },
  );

  const base = process.env.PLAYWRIGHT_BASE_URL;
  const started = Date.now();
  const timeoutMs = 30000;
  async function waitReady() {
    while (Date.now() - started < timeoutMs) {
      try {
        const res = await fetch(base + "/api/config");
        if (res.ok) return true;
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  }
  const ok = await waitReady();
  if (!ok)
    throw new Error("[globalSetup] preview server failed to become ready");
  fs.writeFileSync(".playwright-preview.pid", String(preview.pid));
  console.log(`[globalSetup] Preview running at ${base}`);
}
