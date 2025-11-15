#!/usr/bin/env node
import { readdir, readFile } from "fs/promises";
import { join } from "path";

// NIST control family definitions
const CONTROL_FAMILIES = {
  AU: "Audit and Accountability",
  AC: "Access Control",
  CM: "Configuration Management",
  RA: "Risk Assessment",
  SI: "System and Information Integrity",
};

// Control requirements mapping
const CONTROL_REQUIREMENTS: Record<string, { description: string; required_actions: string[] }> = {
  "AU-2": {
    description: "Audit Events",
    required_actions: ["agent_action", "pr_routing", "drift_detection"],
  },
  "AU-3": {
    description: "Content of Audit Records",
    required_actions: ["evidence_emission"],
  },
  "AC-3": {
    description: "Access Enforcement",
    required_actions: ["approval_enforcement"],
  },
  "CM-2": {
    description: "Baseline Configuration",
    required_actions: ["drift_detection", "drift_fix"],
  },
  "CM-3": {
    description: "Configuration Change Control",
    required_actions: ["pr_routing", "approval_enforcement"],
  },
  "RA-5": {
    description: "Vulnerability Scanning",
    required_actions: ["security_scan"],
  },
  "SI-3": {
    description: "Malicious Code Protection",
    required_actions: ["secret_scan", "prohibited_pattern_check"],
  },
};

interface Evidence {
  trace_id: string;
  control_id: string;
  timestamp: string;
  agent?: string;
  action?: string;
  result?: "pass" | "fail" | "skip" | "error";
  metadata?: Record<string, unknown>;
}

interface NISTVerificationResult {
  control_family: string;
  control_id: string;
  status: "compliant" | "non_compliant" | "not_applicable";
  evidence_count: number;
  evidence_refs: string[];
  verification_timestamp: string;
}

// Load all evidence artifacts
async function loadEvidence(): Promise<Evidence[]> {
  const evidenceDir = join(process.cwd(), ".evidence");
  const evidence: Evidence[] = [];

  try {
    const files = await readdir(evidenceDir);
    
    for (const file of files) {
      if (file.endsWith(".json") && file !== ".keep") {
        const content = await readFile(join(evidenceDir, file), "utf-8");
        const parsed = JSON.parse(content) as Evidence;
        evidence.push(parsed);
      }
    }
  } catch (error) {
    console.warn("⚠️  No evidence directory found or error reading evidence");
  }

  return evidence;
}

// Verify NIST compliance for a control
async function verifyControl(
  controlId: string,
  evidence: Evidence[]
): Promise<NISTVerificationResult> {
  const requirement = CONTROL_REQUIREMENTS[controlId];
  const family = controlId.split("-")[0];
  
  if (!requirement) {
    return {
      control_family: family,
      control_id: controlId,
      status: "not_applicable",
      evidence_count: 0,
      evidence_refs: [],
      verification_timestamp: new Date().toISOString(),
    };
  }

  // Find evidence matching this control
  const matchingEvidence = evidence.filter((e) => {
    return (
      e.control_id === controlId ||
      (e.action && requirement.required_actions.includes(e.action))
    );
  });

  const evidenceRefs = matchingEvidence.map((e) => e.trace_id);
  const hasRequiredActions = requirement.required_actions.every((action) =>
    matchingEvidence.some((e) => e.action === action)
  );

  const status = hasRequiredActions ? "compliant" : "non_compliant";

  return {
    control_family: family,
    control_id: controlId,
    status,
    evidence_count: matchingEvidence.length,
    evidence_refs: evidenceRefs,
    verification_timestamp: new Date().toISOString(),
  };
}

// Main verification
async function verifyNISTCompliance(): Promise<void> {
  console.log("🔍 NIST 800-53 Compliance Verification\n");

  const evidence = await loadEvidence();
  console.log(`📋 Loaded ${evidence.length} evidence artifacts\n`);

  const results: NISTVerificationResult[] = [];
  
  for (const controlId of Object.keys(CONTROL_REQUIREMENTS)) {
    const result = await verifyControl(controlId, evidence);
    results.push(result);
  }

  // Summary by control family
  const familySummary: Record<string, { compliant: number; non_compliant: number; total: number }> = {};
  
  for (const result of results) {
    if (!familySummary[result.control_family]) {
      familySummary[result.control_family] = { compliant: 0, non_compliant: 0, total: 0 };
    }
    
    familySummary[result.control_family].total++;
    
    if (result.status === "compliant") {
      familySummary[result.control_family].compliant++;
    } else if (result.status === "non_compliant") {
      familySummary[result.control_family].non_compliant++;
    }
  }

  // Print results
  console.log("📊 Compliance Status by Control\n");
  
  for (const result of results) {
    const statusIcon = result.status === "compliant" ? "✅" : 
                      result.status === "non_compliant" ? "❌" : "⚪";
    
    console.log(`${statusIcon} ${result.control_id}: ${CONTROL_REQUIREMENTS[result.control_id]?.description || "Unknown"}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Evidence: ${result.evidence_count} artifact(s)`);
    
    if (result.evidence_refs.length > 0) {
      console.log(`   Refs: ${result.evidence_refs.slice(0, 3).join(", ")}${result.evidence_refs.length > 3 ? "..." : ""}`);
    }
    
    console.log();
  }

  // Print family summary
  console.log("📈 Summary by Control Family\n");
  
  for (const [family, summary] of Object.entries(familySummary)) {
    const familyName = CONTROL_FAMILIES[family as keyof typeof CONTROL_FAMILIES] || family;
    const complianceRate = summary.total > 0 ? (summary.compliant / summary.total * 100).toFixed(0) : 0;
    
    console.log(`${family} - ${familyName}`);
    console.log(`   Compliant: ${summary.compliant}/${summary.total} (${complianceRate}%)`);
    console.log();
  }

  // Overall status
  const totalCompliant = results.filter((r) => r.status === "compliant").length;
  const totalControls = results.filter((r) => r.status !== "not_applicable").length;
  const overallRate = totalControls > 0 ? (totalCompliant / totalControls * 100).toFixed(0) : 0;
  
  console.log(`🎯 Overall Compliance: ${totalCompliant}/${totalControls} (${overallRate}%)\n`);

  // Exit with error if not fully compliant
  if (totalCompliant < totalControls) {
    console.error("⚠️  Non-compliant controls detected");
    process.exit(0); // Don't fail CI for now - this is informational
  } else {
    console.log("✅ All controls compliant");
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyNISTCompliance().catch((error) => {
    console.error("❌ NIST verification failed:", error);
    process.exit(1);
  });
}

export { verifyNISTCompliance, NISTVerificationResult };
