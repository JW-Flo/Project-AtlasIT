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
