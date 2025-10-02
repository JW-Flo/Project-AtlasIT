import type {
  EnhancedFinding,
  EnhancedScanResult,
  ScanRunOutput,
} from "./types";
import type { ScanFeature } from "./types";

export const SCANNER_VERSION = "2.0-modular";

export function generateScanId(prefix = "scan"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function calculateBusinessMetrics(findings: EnhancedFinding[]) {
  let trustScore = 100;
  let professionalismScore = 100;
  let userExperienceScore = 100;
  let brandProtectionScore = 100;

  for (const finding of findings) {
    const impact: Record<string, number> = {
      critical: -20,
      high: -15,
      medium: -10,
      low: -5,
      warning: -3,
      info: 0,
      excellent: 5,
    };

    const reduction = impact[finding.severity] ?? 0;

    if (
      finding.category.includes("SSL") ||
      finding.category.includes("Security")
    ) {
      trustScore += reduction;
      brandProtectionScore += reduction;
    }

    if (
      finding.category.includes("Performance") ||
      finding.category.includes("Accessibility")
    ) {
      userExperienceScore += reduction;
      professionalismScore += reduction * 0.5;
    }

    if (
      finding.category.includes("Privacy") ||
      finding.category.includes("Content")
    ) {
      brandProtectionScore += reduction;
      trustScore += reduction * 0.5;
    }

    if (
      finding.category.includes("SEO") ||
      finding.category.includes("Social")
    ) {
      professionalismScore += reduction;
    }
  }

  return {
    trustScore: clampScore(trustScore),
    professionalismScore: clampScore(professionalismScore),
    userExperienceScore: clampScore(userExperienceScore),
    brandProtectionScore: clampScore(brandProtectionScore),
  };
}

export function calculateSecurityScore(findings: EnhancedFinding[]): number {
  const weights: Record<string, number> = {
    critical: -20,
    high: -15,
    medium: -10,
    low: -5,
    warning: -3,
    info: 0,
    excellent: 10,
  };

  let score = 100;
  for (const finding of findings) {
    score += weights[finding.severity] ?? 0;
  }
  return clampScore(score);
}

function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score * 100) / 100;
}

export function buildScanResult(options: {
  feature: ScanFeature;
  url: string;
  findings: EnhancedFinding[];
  durationMs: number;
  runOutput: ScanRunOutput;
}): EnhancedScanResult {
  const { feature, url, findings, durationMs, runOutput } = options;
  const externalApis = Array.from(
    new Set(
      [
        ...((Array.isArray(runOutput.externalApisUsed)
          ? runOutput.externalApisUsed
          : []) as string[]),
        ...((Array.isArray((feature as any).meta?.externalApis)
          ? (feature as any).meta.externalApis
          : []) as string[]),
      ].filter((v) => typeof v === "string"),
    ),
  );
  const metadata = {
    scannerVersion: SCANNER_VERSION,
    scanDepth: 1,
    externalApisUsed: externalApis as string[],
    ...(runOutput.metadata ?? {}),
  };

  return {
    scanId: generateScanId(feature.id),
    url,
    scanType: feature.id,
    timestamp: new Date().toISOString(),
    duration: durationMs,
    findings,
    summary: {
      totalFindings: findings.length,
      criticalCount: countBy(findings, "critical"),
      highCount: countBy(findings, "high"),
      mediumCount: countBy(findings, "medium"),
      lowCount: countBy(findings, "low"),
      securityScore: calculateSecurityScore(findings),
    },
    businessMetrics: calculateBusinessMetrics(findings),
    metadata,
    diagnostics: runOutput.diagnostics,
  };
}

function countBy(findings: EnhancedFinding[], severity: string): number {
  return findings.filter((finding) => finding.severity === severity).length;
}
