export interface TourStep {
  selector: string;
  title: string;
  description: string;
  placement: "top" | "bottom" | "left" | "right";
  route?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    selector: "[data-tour='compliance-pill']",
    title: "Compliance Score",
    description:
      "Your real-time compliance score updates every 60 seconds. Color-coded green/yellow/red based on how your controls are performing across all installed frameworks.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='hero-score']",
    title: "Overall Compliance",
    description:
      "The hero card shows your aggregate score, trend sparkline over the past 30 days, and a breakdown of passing, failing, and unknown controls.",
    placement: "bottom",
    route: "/console",
  },
  {
    selector: "[data-tour='framework-cards']",
    title: "Framework Breakdown",
    description:
      "Each framework card shows its individual score and control coverage. Click any card to drill into the compliance pack details.",
    placement: "top",
    route: "/console",
  },
  {
    selector: "[data-tour='evidence-feed']",
    title: "Evidence Stream",
    description:
      "Real-time feed of compliance evidence collected from your connected integrations. Each item is scored against relevant controls.",
    placement: "left",
    route: "/console",
  },
  {
    selector: "[data-tour='connected-apps']",
    title: "Connected Apps",
    description:
      "Your active integrations that feed evidence into the compliance engine. Sync status shows when data was last pulled.",
    placement: "right",
    route: "/console",
  },
  {
    selector: "[data-tour='directory-users']",
    title: "User Directory",
    description:
      "Users synced from your identity provider. Lifecycle tracking (active, suspended, deactivated) powers JML automation and access reviews.",
    placement: "bottom",
    route: "/console/directory",
  },
  {
    selector: "[data-tour='compliance-packs']",
    title: "Compliance Packs",
    description:
      "Pre-built framework packs with mapped controls. Install a pack and controls auto-populate with evidence-grounded scoring.",
    placement: "bottom",
    route: "/console/compliance/packs",
  },
  {
    selector: "[data-tour='policies']",
    title: "Policy Management",
    description:
      "Create, publish, and track acknowledgement of compliance policies. Policies are evidence items that feed into framework scoring.",
    placement: "bottom",
    route: "/console/policies",
  },
  {
    selector: "[data-tour='automation-rules']",
    title: "Automation Rules",
    description:
      "Event-driven rules that automate compliance tasks: enforce MFA on new users, revoke access on offboarding, trigger quarterly reviews.",
    placement: "bottom",
    route: "/console/automation",
  },
  {
    selector: "[data-tour='access-reviews']",
    title: "Access Reviews",
    description:
      "Periodic access review campaigns. Reviewers approve or revoke access for each user-resource pair, generating SOC 2 and ISO 27001 evidence.",
    placement: "bottom",
    route: "/console/access-reviews",
  },
  {
    selector: "[data-tour='marketplace']",
    title: "Integration Marketplace",
    description:
      "35+ integrations available. Connect your tools and evidence flows in automatically — no code required.",
    placement: "bottom",
    route: "/console/marketplace",
  },
];
