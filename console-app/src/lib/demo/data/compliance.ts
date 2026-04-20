// console-app/src/lib/demo/data/compliance.ts
import { uuid, daysAgo, hoursAgo } from "./helpers";

const FRAMEWORKS = [
  {
    framework: "SOC2",
    label: "SOC 2 Type II",
    controlCount: 85,
    passCount: 70,
    failCount: 8,
    unknownCount: 7,
    score: 82,
  },
  {
    framework: "ISO27001",
    label: "ISO 27001:2022",
    controlCount: 93,
    passCount: 69,
    failCount: 14,
    unknownCount: 10,
    score: 74,
  },
  {
    framework: "NIST_CSF",
    label: "NIST CSF 2.0",
    controlCount: 108,
    passCount: 82,
    failCount: 15,
    unknownCount: 11,
    score: 76,
  },
  {
    framework: "HIPAA",
    label: "HIPAA Security Rule",
    controlCount: 72,
    passCount: 51,
    failCount: 12,
    unknownCount: 9,
    score: 71,
  },
  {
    framework: "GDPR",
    label: "GDPR",
    controlCount: 65,
    passCount: 52,
    failCount: 6,
    unknownCount: 7,
    score: 80,
  },
];

export function getCompliancePacksResponse() {
  return {
    data: {
      items: FRAMEWORKS.map((f, i) => ({
        id: `pack-${f.framework.toLowerCase()}`,
        label: f.label,
        framework: f.framework,
        controlCount: f.controlCount,
        installedAt: daysAgo(60 + i * 5),
        lastEvaluatedAt: hoursAgo(2),
        passCount: f.passCount,
        failCount: f.failCount,
        unknownCount: f.unknownCount,
      })),
    },
  };
}

export function getComplianceTrendResponse() {
  const series = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const base = 64 + ((30 - i) * 14) / 30;
    const noise = Math.sin(i * 0.8) * 2;
    series.push({
      day: d.toISOString().slice(0, 10),
      avgScore: Math.round((base + noise) * 10) / 10,
      snapshotCount: 5,
    });
  }
  return { data: { series } };
}

export function getComplianceScoresResponse() {
  return {
    scores: FRAMEWORKS.map((f) => ({
      framework: f.framework,
      score: f.score,
      grade: f.score >= 80 ? "B" : f.score >= 70 ? "C" : "D",
      source: "evidence" as const,
    })),
    source: "evidence",
  };
}

export function getComplianceSummaryResponse() {
  return {
    data: {
      frameworks: FRAMEWORKS.map((f) => ({
        framework: f.framework,
        controlsTotal: f.controlCount,
        controlsPassing: f.passCount,
        evidenceCount: 30 + f.passCount,
        score: f.score,
      })),
      totalEvidence: 247,
      lastUpdated: hoursAgo(2),
    },
  };
}

const EVIDENCE_SOURCES = ["okta", "github", "aws", "google-workspace", "jira", "slack"];
const CONTROL_PREFIXES: Record<string, string[]> = {
  SOC2: ["CC6.1", "CC6.2", "CC6.3", "CC7.1", "CC7.2", "CC8.1"],
  ISO27001: ["A.5.1", "A.6.1", "A.8.1", "A.9.1", "A.9.2", "A.12.1"],
  NIST_CSF: ["PR.AC-1", "PR.AC-3", "PR.DS-1", "DE.CM-1", "RS.RP-1", "ID.AM-1"],
  HIPAA: ["164.312(a)", "164.312(c)", "164.312(d)", "164.312(e)", "164.308(a)(1)"],
  GDPR: ["Art.5", "Art.25", "Art.30", "Art.32", "Art.33"],
};
const IMPACTS = ["positive", "positive", "positive", "negative", "positive"] as const;
const REASONINGS = [
  "MFA enforcement verified for user account",
  "Access review completed within SLA",
  "Encryption at rest confirmed for data store",
  "Missing audit log configuration detected",
  "Password policy meets complexity requirements",
  "Vendor security questionnaire up to date",
  "Firewall rules reviewed and compliant",
  "User deprovisioned within 24h of offboarding",
];

export function getEvidenceResponse(limit = 25) {
  const items = [];
  for (let i = 0; i < limit; i++) {
    const fw = FRAMEWORKS[i % FRAMEWORKS.length];
    const controls = CONTROL_PREFIXES[fw.framework] ?? ["CTL-1"];
    items.push({
      id: uuid(),
      framework: fw.framework,
      controlId: controls[i % controls.length],
      controlName: `Control ${controls[i % controls.length]}`,
      source: EVIDENCE_SOURCES[i % EVIDENCE_SOURCES.length],
      actor: "system",
      metadata: {
        impact: IMPACTS[i % IMPACTS.length],
        eventType: "assessment",
        reasoning: REASONINGS[i % REASONINGS.length],
      },
      createdAt: hoursAgo(i * 3 + 1),
    });
  }
  return { data: { items, nextCursor: null } };
}

export function getControlsRegistryResponse() {
  const items = [];
  for (const fw of FRAMEWORKS) {
    const controls = CONTROL_PREFIXES[fw.framework] ?? [];
    for (let i = 0; i < controls.length; i++) {
      items.push({
        id: `${fw.framework}-${controls[i]}`,
        framework: fw.framework,
        controlRef: controls[i],
        title: `Control ${controls[i]}`,
        status:
          i < fw.passCount / (fw.controlCount / controls.length)
            ? "passing"
            : i < (fw.passCount + fw.failCount) / (fw.controlCount / controls.length)
              ? "failing"
              : "unknown",
      });
    }
  }
  return { data: { items } };
}
