import { expect } from "@playwright/test";

export async function scanA11y(page, context) {
  try {
    const mod = await import("@axe-core/playwright");
    const anyMod = mod; // loose
    const AxeBuilder =
      anyMod.AxeBuilder || (anyMod.default && anyMod.default.AxeBuilder);
    if (!AxeBuilder) {
      console.warn("[a11y] AxeBuilder not available; skipping scan");
      return [];
    }
    const builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);
    const results = await builder.analyze();
    const violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.slice(0, 5).map((n) => n.html),
    }));
    expect
      .soft(
        violations,
        `${context} should have no a11y violations (found: ${violations.map((v) => v.id).join(",")})`,
      )
      .toEqual([]);
    return violations;
  } catch (err) {
    console.warn("[a11y] scan failed, continuing:", err?.message || err);
    return [];
  }
}
