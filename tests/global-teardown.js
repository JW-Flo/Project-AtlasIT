import fs from "node:fs";

export default async function globalTeardown() {
  try {
    if (fs.existsSync(".playwright-preview.pid")) {
      const pid = Number(fs.readFileSync(".playwright-preview.pid", "utf-8"));
      if (pid) {
        try {
          process.kill(pid, "SIGTERM");
        } catch {}
        console.log(`[globalTeardown] Killed preview pid ${pid}`);
      }
      fs.unlinkSync(".playwright-preview.pid");
    }
  } catch (e) {
    console.warn("[globalTeardown] Failed to cleanup preview", e);
  }
}
