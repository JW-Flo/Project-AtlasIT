export type DemoNavModule =
  | "dashboard"
  | "compliance"
  | "identity"
  | "automation"
  | "incidents"
  | "analytics"
  | "marketplace";

export const DEMO_TENANT = {
  id: "demo-acme-dental",
  name: "Acme Dental Group",
  employees: 43,
  frameworks: ["HIPAA", "SOC2"],
  stack: ["Google Workspace", "Slack", "Okta", "Intune"],
  appsConnected: 12,
  pendingReviews: 3,
  openIncidents: 2,
  automationsToday: 17,
  complianceScore: 86,
};

export const DEMO_MODULES: Array<{ id: DemoNavModule; label: string; blurb: string }> = [
  { id: "dashboard", label: "Dashboard", blurb: "Executive posture in one pane" },
  { id: "compliance", label: "Compliance", blurb: "HIPAA + SOC2 controls and evidence" },
  { id: "identity", label: "Identity", blurb: "Joiner, mover, leaver + MFA coverage" },
  { id: "automation", label: "Automation", blurb: "No-code workflows and approvals" },
  { id: "incidents", label: "Incidents", blurb: "Detections with guided remediation" },
  { id: "analytics", label: "Analytics", blurb: "ROI, risk reduction, success metrics" },
  { id: "marketplace", label: "Marketplace", blurb: "Ready-to-connect integrations" },
];

export const DEMO_MARKETPLACE = [
  "Okta",
  "Slack",
  "Google Workspace",
  "Microsoft 365",
  "Intune",
  "CrowdStrike",
];
