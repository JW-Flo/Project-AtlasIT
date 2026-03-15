import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

// ---------------------------------------------------------------------------
// OpenAPI contract parity test
//
// Compares documented paths in docs/api/openapi.yaml against the routes
// actually implemented in compliance-worker/src/index.ts.
//
// Known mismatches are tracked in SPEC_TO_IMPL_MAP below. Any undocumented
// divergence will fail the test and must be resolved by either updating the
// spec or aligning the implementation.
// ---------------------------------------------------------------------------

const REPO_ROOT = join(__dirname, "../..");
const OPENAPI_PATH = join(REPO_ROOT, "docs/api/openapi.yaml");
const IMPL_PATH = join(REPO_ROOT, "compliance-worker/src/index.ts");

function loadSpecPaths(): string[] {
  const raw = readFileSync(OPENAPI_PATH, "utf-8");
  const doc = parse(raw) as { paths: Record<string, unknown> };
  return Object.keys(doc.paths ?? {});
}

function loadImplPatterns(): string[] {
  const src = readFileSync(IMPL_PATH, "utf-8");
  const patterns: string[] = [];

  // Match both exact equality checks and startsWith patterns
  const exactRe = /url\.pathname\s*===\s*["']([^"']+)["']/g;
  const startsRe = /url\.pathname\.startsWith\(["']([^"']+)["']\)/g;

  let m: RegExpExecArray | null;
  while ((m = exactRe.exec(src)) !== null) patterns.push(m[1]);
  while ((m = startsRe.exec(src)) !== null) patterns.push(m[1]);

  return [...new Set(patterns)];
}

/**
 * Derive the first concrete path segment prefix from an OpenAPI path.
 * e.g. "/api/v1/security/incidents/{id}/resolve" -> "/api/v1/security/incidents"
 *      "/health" -> "/health"
 */
function specPathPrefix(specPath: string): string {
  const parts = specPath.split("/").filter(Boolean);
  const staticParts: string[] = [];
  for (const p of parts) {
    if (p.startsWith("{")) break;
    staticParts.push(p);
  }
  return "/" + staticParts.join("/");
}

/**
 * True when at least one impl pattern covers the spec prefix.
 * An impl pattern covers a prefix if:
 *   - it equals the prefix exactly, OR
 *   - the prefix starts with the pattern (the impl uses startsWith for a parent segment)
 */
function isCovered(prefix: string, implPatterns: string[]): boolean {
  return implPatterns.some(
    (p) => p === prefix || prefix.startsWith(p),
  );
}

// ---------------------------------------------------------------------------
// Known route mismatches between spec and implementation.
// The spec uses one path prefix; the impl uses a different one.
// Format: { spec: specPrefix, impl: actualImplPattern }
// ---------------------------------------------------------------------------
const KNOWN_MISMATCHES: Array<{ spec: string; impl: string; reason: string }> =
  [
    {
      spec: "/api/policies/templates",
      impl: "/api/v1/policies/templates",
      reason:
        "Spec documents /api/policies/... but implementation uses /api/v1/policies/...",
    },
    {
      spec: "/api/policies/generate",
      impl: "/api/v1/policies/generate",
      reason:
        "Spec documents /api/policies/... but implementation uses /api/v1/policies/...",
    },
    {
      spec: "/api/policies/coverage",
      impl: "/api/v1/policies/coverage",
      reason:
        "Spec documents /api/policies/... but implementation uses /api/v1/policies/...",
    },
    {
      spec: "/api/controls",
      impl: "/api/v1/controls/",
      reason:
        "Spec documents /api/controls/... but implementation uses /api/v1/controls/...",
    },
    {
      spec: "/api/v1/security/incidents",
      impl: "/api/v1/incidents",
      reason:
        "Spec documents /api/v1/security/incidents but implementation uses /api/v1/incidents",
    },
    {
      spec: "/api/v1/security/status",
      impl: "/api/v1/incidents",
      reason:
        "Spec documents /api/v1/security/status but implementation routes security status under /api/v1/incidents namespace",
    },
    {
      spec: "/api/v1/access/requests",
      impl: "/api/v1/access-requests",
      reason:
        "Spec documents /api/v1/access/requests but implementation uses /api/v1/access-requests",
    },
    {
      spec: "/api/evidence",
      impl: "/api/compliance/evidence",
      reason:
        "Spec documents /api/evidence/{hash} but implementation uses /api/compliance/evidence/* namespace",
    },
    {
      spec: "/api/orchestrator/ai/infer",
      impl: "N/A",
      reason:
        "Spec documents /api/orchestrator/ai/infer but this endpoint is served by ai-orchestrator worker, not compliance-worker",
    },
  ];

const KNOWN_MISMATCH_SPEC_PREFIXES = new Set(
  KNOWN_MISMATCHES.map((m) => m.spec),
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OpenAPI contract parity", () => {
  const specPaths = loadSpecPaths();
  const implPatterns = loadImplPatterns();

  it("loads a non-empty OpenAPI spec", () => {
    expect(specPaths.length).toBeGreaterThan(0);
  });

  it("loads implementation route patterns from compliance-worker/src/index.ts", () => {
    expect(implPatterns.length).toBeGreaterThan(0);
  });

  it("all spec paths have a corresponding implementation route or are tracked as known mismatches", () => {
    const unmatchedPaths: Array<{ specPath: string; prefix: string }> = [];

    for (const specPath of specPaths) {
      const prefix = specPathPrefix(specPath);

      if (KNOWN_MISMATCH_SPEC_PREFIXES.has(prefix)) {
        // Tracked mismatch -- skip coverage check
        continue;
      }

      if (!isCovered(prefix, implPatterns)) {
        unmatchedPaths.push({ specPath, prefix });
      }
    }

    if (unmatchedPaths.length > 0) {
      const detail = unmatchedPaths
        .map((u) => `  spec: "${u.specPath}"  ->  prefix: "${u.prefix}"`)
        .join("\n");
      throw new Error(
        `${unmatchedPaths.length} spec path(s) have no matching implementation route and are not in KNOWN_MISMATCHES:\n${detail}`,
      );
    }
  });

  it("documents each known spec/impl mismatch explicitly", () => {
    for (const mismatch of KNOWN_MISMATCHES) {
      expect(mismatch.spec, "mismatch entry missing spec field").toBeTruthy();
      expect(mismatch.impl, "mismatch entry missing impl field").toBeTruthy();
      expect(
        mismatch.reason,
        `mismatch entry missing reason for "${mismatch.spec}"`,
      ).toBeTruthy();
    }

    const summary = KNOWN_MISMATCHES.map(
      (m) => `MISMATCH: spec="${m.spec}" impl="${m.impl}" -- ${m.reason}`,
    ).join("\n");

    console.warn(`\n[openapi-parity] Known route mismatches:\n${summary}\n`);

    expect(KNOWN_MISMATCHES.length).toBeGreaterThan(0);
  });

  it("implementation covers /health", () => {
    expect(isCovered("/health", implPatterns)).toBe(true);
  });

  it("implementation covers /api/compliance/snapshot", () => {
    expect(isCovered("/api/compliance/snapshot", implPatterns)).toBe(true);
  });

  it("implementation covers /api/evidence/ingest", () => {
    expect(isCovered("/api/evidence/ingest", implPatterns)).toBe(true);
  });

  it("implementation covers /api/evidence/search", () => {
    expect(isCovered("/api/evidence/search", implPatterns)).toBe(true);
  });

  it("implementation covers /api/v1/notifications", () => {
    expect(isCovered("/api/v1/notifications", implPatterns)).toBe(true);
  });
});
