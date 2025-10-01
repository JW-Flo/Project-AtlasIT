import { test, expect } from "@playwright/test";
import { scanA11y } from "../utils/a11y.js";

// Basic internal link crawler with depth & count limits.
// Visits root and follows internal anchor hrefs.
// Skips query/hash variations for simplicity.

test("crawl all internal pages and check a11y", async ({ page }) => {
  const visited = new Set();
  const queue = ["/"]; // BFS queue
  const maxPages = 30;

  while (queue.length && visited.size < maxPages) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;
    visited.add(url);
    const res = await page.goto(url);
    expect(res?.status(), `HTTP status for ${url}`).toBeLessThan(500);
    await scanA11y(page, `page ${url}`);
    // Collect internal links
    const links = await page.$$eval("a[href]", (els) =>
      els
        .map((e) => e.getAttribute("href") || "")
        .filter((h) => h.startsWith("/") && !h.startsWith("//"))
        .map((h) => h.split("#")[0].split("?")[0]),
    );
    for (const h of links)
      if (!visited.has(h) && !queue.includes(h)) queue.push(h);
  }

  expect(visited.size).toBeGreaterThan(0);
});
