export interface Control {
  id: string;
  framework: string;
  name: string;
  description: string;
  status: "not_started" | "in_progress" | "implemented" | "verified";
  notes: string;
  automatable: boolean;
  evaluationKey?: string;
}

export const FRAMEWORK_CONTROLS: Record<
  string,
  {
    name: string;
    description: string;
    automatable: boolean;
    evaluationKey?: string;
  }[]
> = {
  SOC2: [
    {
      name: "Access Control",
      description:
        "Restrict logical access to systems and data to authorized users",
      automatable: true,
      evaluationKey: "directory_connected",
    },
    {
      name: "Change Management",
      description: "Ensure changes to systems follow a controlled process",
      automatable: false,
    },
    {
      name: "Incident Response",
      description: "Detect, respond to, and recover from security incidents",
      automatable: true,
      evaluationKey: "incidents_configured",
    },
    {
      name: "Risk Assessment",
      description: "Identify and evaluate risks to the organization",
      automatable: false,
    },
    {
      name: "Vendor Management",
      description: "Assess and monitor third-party service providers",
      automatable: true,
      evaluationKey: "apps_connected",
    },
  ],
  ISO27001: [
    {
      name: "Information Security Policy",
      description: "Establish and maintain an information security policy",
      automatable: true,
      evaluationKey: "policies_generated",
    },
    {
      name: "Asset Management",
      description: "Identify and manage information assets",
      automatable: true,
      evaluationKey: "apps_connected",
    },
    {
      name: "Access Control",
      description:
        "Control access to information and information processing facilities",
      automatable: true,
      evaluationKey: "directory_connected",
    },
    {
      name: "Cryptography",
      description: "Ensure proper use of cryptographic controls",
      automatable: false,
    },
    {
      name: "Physical Security",
      description: "Prevent unauthorized physical access and damage",
      automatable: false,
    },
  ],
  "NIST CSF": [
    {
      name: "Identify",
      description: "Develop organizational understanding of cybersecurity risk",
      automatable: true,
      evaluationKey: "apps_connected",
    },
    {
      name: "Protect",
      description: "Develop and implement appropriate safeguards",
      automatable: true,
      evaluationKey: "directory_connected",
    },
    {
      name: "Detect",
      description: "Develop and implement monitoring for cybersecurity events",
      automatable: true,
      evaluationKey: "incidents_configured",
    },
    {
      name: "Respond",
      description: "Develop and implement response activities",
      automatable: true,
      evaluationKey: "workflows_configured",
    },
    {
      name: "Recover",
      description: "Develop and implement recovery activities",
      automatable: false,
    },
  ],
  HIPAA: [
    {
      name: "Privacy Rule",
      description: "Protect individually identifiable health information",
      automatable: false,
    },
    {
      name: "Security Rule",
      description: "Protect electronic protected health information",
      automatable: true,
      evaluationKey: "directory_connected",
    },
    {
      name: "Breach Notification",
      description: "Notify affected parties of data breaches",
      automatable: true,
      evaluationKey: "incidents_configured",
    },
    {
      name: "Administrative Safeguards",
      description: "Implement administrative actions to manage security",
      automatable: true,
      evaluationKey: "policies_generated",
    },
  ],
  GDPR: [
    {
      name: "Data Mapping",
      description: "Map and document personal data processing activities",
      automatable: true,
      evaluationKey: "apps_connected",
    },
    {
      name: "Consent Management",
      description: "Obtain and manage data subject consent",
      automatable: false,
    },
    {
      name: "Data Subject Rights",
      description: "Enable exercise of data subject rights",
      automatable: true,
      evaluationKey: "workflows_configured",
    },
    {
      name: "DPO Appointment",
      description: "Appoint a Data Protection Officer where required",
      automatable: false,
    },
    {
      name: "Breach Notification",
      description:
        "Notify supervisory authority of data breaches within 72 hours",
      automatable: true,
      evaluationKey: "incidents_configured",
    },
  ],
};

/**
 * Maps simplified control IDs to CDT evidence control ID prefixes.
 * Evidence in compliance_evidence uses granular IDs like CC6.1, A.9.2.2, PR.AC-1.
 * This mapping lets us aggregate evidence counts for the simplified controls view.
 */
export const CONTROL_TO_CDT_PREFIXES: Record<string, string[]> = {
  // SOC2
  soc2_access_control: ["CC6"],
  soc2_change_management: ["CC8"],
  soc2_incident_response: ["CC7"],
  soc2_risk_assessment: ["CC3", "CC4"],
  soc2_vendor_management: ["CC9"],
  // ISO27001
  iso27001_information_security_policy: ["A.5", "A.6"],
  iso27001_asset_management: ["A.7", "A.8"],
  iso27001_access_control: ["A.9"],
  iso27001_cryptography: ["A.10"],
  iso27001_physical_security: ["A.11"],
  // NIST CSF
  "nist_csf_identify": ["ID"],
  "nist_csf_protect": ["PR"],
  "nist_csf_detect": ["DE"],
  "nist_csf_respond": ["RS"],
  "nist_csf_recover": ["RC"],
  // HIPAA
  hipaa_privacy_rule: ["164.502", "164.514"],
  hipaa_security_rule: ["164.312"],
  hipaa_breach_notification: ["164.404", "164.408"],
  hipaa_administrative_safeguards: ["164.308"],
  // GDPR
  gdpr_data_mapping: ["Art.30"],
  gdpr_consent_management: ["Art.7"],
  gdpr_data_subject_rights: ["Art.15", "Art.17"],
  gdpr_dpo_appointment: ["Art.37"],
  gdpr_breach_notification: ["Art.33", "Art.34"],
};

/**
 * Given raw CDT evidence counts (keyed by CDT control IDs like CC6.1, A.9.2.2),
 * aggregate them into counts per simplified control ID.
 */
export function aggregateEvidenceForControls(
  cdtCounts: Record<string, number>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [simplifiedId, prefixes] of Object.entries(CONTROL_TO_CDT_PREFIXES)) {
    let total = 0;
    for (const [cdtId, count] of Object.entries(cdtCounts)) {
      if (prefixes.some((p) => cdtId.startsWith(p))) {
        total += count;
      }
    }
    if (total > 0) result[simplifiedId] = total;
  }
  return result;
}

export function buildDefaultControls(frameworks: string[]): Control[] {
  const controls: Control[] = [];
  for (const fw of frameworks) {
    const defs = FRAMEWORK_CONTROLS[fw];
    if (!defs) continue;
    for (const def of defs) {
      controls.push({
        id: `${fw.toLowerCase().replace(/\s+/g, "_")}_${def.name.toLowerCase().replace(/\s+/g, "_")}`,
        framework: fw,
        name: def.name,
        description: def.description,
        status: "not_started",
        notes: "",
        automatable: def.automatable,
        evaluationKey: def.evaluationKey,
      });
    }
  }
  return controls;
}
