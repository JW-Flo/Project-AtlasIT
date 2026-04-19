import { DEMO_USER } from "./session.js";
import { daysAgo, hoursAgo, minutesAgo, uuid } from "./helpers.js";

export function getCompliancePacksResponse() {
  return {
    data: {
      items: [
        {
          id: uuid(),
          label: "SOC 2 Type II",
          framework: "SOC2",
          controlCount: 85,
          installedAt: daysAgo(180),
          lastEvaluatedAt: hoursAgo(6),
          passCount: 70,
          failCount: 8,
          unknownCount: 7,
        },
        {
          id: uuid(),
          label: "ISO 27001:2013",
          framework: "ISO27001",
          controlCount: 93,
          installedAt: daysAgo(180),
          lastEvaluatedAt: hoursAgo(6),
          passCount: 69,
          failCount: 14,
          unknownCount: 10,
        },
        {
          id: uuid(),
          label: "NIST CSF v1.1",
          framework: "NIST_CSF",
          controlCount: 108,
          installedAt: daysAgo(120),
          lastEvaluatedAt: hoursAgo(6),
          passCount: 82,
          failCount: 15,
          unknownCount: 11,
        },
        {
          id: uuid(),
          label: "HIPAA Security Rule",
          framework: "HIPAA",
          controlCount: 72,
          installedAt: daysAgo(90),
          lastEvaluatedAt: hoursAgo(6),
          passCount: 51,
          failCount: 12,
          unknownCount: 9,
        },
        {
          id: uuid(),
          label: "GDPR",
          framework: "GDPR",
          controlCount: 65,
          installedAt: daysAgo(60),
          lastEvaluatedAt: hoursAgo(6),
          passCount: 52,
          failCount: 6,
          unknownCount: 7,
        },
      ],
    },
  };
}

export function getComplianceTrendResponse() {
  const series = [];
  const today = new Date();

  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const day = d.toISOString().split("T")[0];

    // Score progression from 64 to 78 with sinusoidal noise
    const progress = (30 - i) / 30;
    const baseScore = 64 + (78 - 64) * progress;
    const noise = Math.sin(i * 0.5) * 2;
    const avgScore = Math.round((baseScore + noise) * 10) / 10;

    series.push({
      day,
      avgScore,
      snapshotCount: 5,
    });
  }

  return {
    data: {
      series,
    },
  };
}

export function getComplianceScoresResponse() {
  return {
    scores: [
      { framework: "SOC2", score: 82, grade: "B", source: "evidence" },
      { framework: "ISO27001", score: 74, grade: "C", source: "evidence" },
      { framework: "NIST_CSF", score: 76, grade: "C", source: "evidence" },
      { framework: "HIPAA", score: 71, grade: "C", source: "evidence" },
      { framework: "GDPR", score: 80, grade: "B", source: "evidence" },
    ],
    source: "evidence",
  };
}

export function getComplianceSummaryResponse() {
  return {
    data: {
      frameworks: [
        {
          framework: "SOC2",
          controlsTotal: 85,
          controlsPassing: 70,
          evidenceCount: 68,
          score: 82,
        },
        {
          framework: "ISO27001",
          controlsTotal: 93,
          controlsPassing: 69,
          evidenceCount: 62,
          score: 74,
        },
        {
          framework: "NIST_CSF",
          controlsTotal: 108,
          controlsPassing: 82,
          evidenceCount: 74,
          score: 76,
        },
        {
          framework: "HIPAA",
          controlsTotal: 72,
          controlsPassing: 51,
          evidenceCount: 28,
          score: 71,
        },
        {
          framework: "GDPR",
          controlsTotal: 65,
          controlsPassing: 52,
          evidenceCount: 15,
          score: 80,
        },
      ],
      totalEvidence: 247,
      lastUpdated: hoursAgo(6),
    },
  };
}

export function getEvidenceResponse(limit = 25) {
  const sources = ["okta", "github", "aws", "google-workspace", "jira", "slack"];
  const frameworks = ["SOC2", "ISO27001", "NIST_CSF", "HIPAA", "GDPR"];
  const impacts = ["positive", "positive", "positive", "positive", "negative"];

  const evidenceTemplates = [
    {
      controlId: "AC-01",
      controlName: "Access Control Policy",
      eventType: "user.mfa_enabled",
      reasoning: "User enabled MFA, strengthening access control posture",
    },
    {
      controlId: "AC-02",
      controlName: "Account Management",
      eventType: "user.created",
      reasoning: "New user account provisioned with least privilege principle",
    },
    {
      controlId: "AC-03",
      controlName: "Access Enforcement",
      eventType: "policy.enforced",
      reasoning: "Access policy successfully enforced at authentication boundary",
    },
    {
      controlId: "AU-02",
      controlName: "Audit Events",
      eventType: "log.collected",
      reasoning: "Comprehensive audit logs collected and retained",
    },
    {
      controlId: "AU-06",
      controlName: "Audit Review",
      eventType: "audit.reviewed",
      reasoning: "Security team completed quarterly audit log review",
    },
    {
      controlId: "CM-02",
      controlName: "Baseline Configuration",
      eventType: "config.baseline_applied",
      reasoning: "Security baseline configuration applied to production systems",
    },
    {
      controlId: "CM-07",
      controlName: "Least Functionality",
      eventType: "service.disabled",
      reasoning: "Unnecessary service disabled to reduce attack surface",
    },
    {
      controlId: "IA-02",
      controlName: "Identification and Authentication",
      eventType: "auth.success",
      reasoning: "Strong authentication mechanisms enforced for all users",
    },
    {
      controlId: "IA-05",
      controlName: "Authenticator Management",
      eventType: "password.rotated",
      reasoning: "User password rotated according to security policy",
    },
    {
      controlId: "SC-07",
      controlName: "Boundary Protection",
      eventType: "firewall.rule_added",
      reasoning: "Network boundary protection enhanced with new firewall rule",
    },
    {
      controlId: "SC-13",
      controlName: "Cryptographic Protection",
      eventType: "encryption.enabled",
      reasoning: "Data encryption enabled for sensitive information at rest",
    },
    {
      controlId: "SI-02",
      controlName: "Flaw Remediation",
      eventType: "vulnerability.patched",
      reasoning: "Critical vulnerability patched within SLA timeframe",
    },
    {
      controlId: "SI-04",
      controlName: "Information System Monitoring",
      eventType: "alert.triggered",
      reasoning: "Security monitoring detected and alerted on anomalous activity",
    },
    {
      controlId: "AC-17",
      controlName: "Remote Access",
      eventType: "vpn.connection",
      reasoning: "Remote access authenticated through secure VPN tunnel",
    },
    {
      controlId: "AC-20",
      controlName: "Use of External Systems",
      eventType: "external.approved",
      reasoning: "External system integration approved by security review",
    },
    {
      controlId: "CP-09",
      controlName: "System Backup",
      eventType: "backup.completed",
      reasoning: "Automated backup completed successfully for critical systems",
    },
    {
      controlId: "IR-04",
      controlName: "Incident Handling",
      eventType: "incident.created",
      reasoning: "Security incident detected and formal response initiated",
    },
    {
      controlId: "IR-05",
      controlName: "Incident Monitoring",
      eventType: "incident.updated",
      reasoning: "Active incident being tracked and monitored for resolution",
    },
    {
      controlId: "PE-02",
      controlName: "Physical Access Authorization",
      eventType: "badge.access_granted",
      reasoning: "Physical access granted to authorized personnel only",
    },
    {
      controlId: "RA-05",
      controlName: "Vulnerability Scanning",
      eventType: "scan.completed",
      reasoning: "Scheduled vulnerability scan completed across infrastructure",
    },
    {
      controlId: "SA-04",
      controlName: "Acquisition Process",
      eventType: "vendor.assessed",
      reasoning: "New vendor security assessment completed before engagement",
    },
    {
      controlId: "AC-06",
      controlName: "Least Privilege",
      eventType: "permission.revoked",
      reasoning: "Excessive permissions identified and revoked from user account",
    },
    {
      controlId: "AC-07",
      controlName: "Unsuccessful Login Attempts",
      eventType: "auth.failed",
      reasoning: "Account locked after multiple failed authentication attempts",
    },
    {
      controlId: "IA-08",
      controlName: "Identification and Authentication",
      eventType: "identity.verified",
      reasoning: "User identity verified through multi-factor authentication",
    },
    {
      controlId: "SC-08",
      controlName: "Transmission Confidentiality",
      eventType: "tls.enforced",
      reasoning: "TLS 1.3 enforced for all data transmissions",
    },
  ];

  const items = [];
  for (let i = 0; i < limit; i++) {
    const template = evidenceTemplates[i % evidenceTemplates.length];
    const source = sources[i % sources.length];
    const framework = frameworks[i % frameworks.length];
    const impact = impacts[i % impacts.length];
    const hoursBack = i * 2 + Math.floor(Math.random() * 12);

    items.push({
      id: uuid(),
      framework,
      controlId: template.controlId,
      controlName: template.controlName,
      source,
      actor: `${source}-adapter`,
      metadata: {
        impact,
        eventType: template.eventType,
        reasoning: template.reasoning,
      },
      createdAt: hoursAgo(hoursBack),
    });
  }

  return {
    data: {
      items,
    },
  };
}

export function getControlsRegistryResponse() {
  const controls = [
    {
      framework: "SOC2",
      controlRef: "CC6.1",
      title: "Logical and Physical Access Controls",
      status: "passing",
    },
    {
      framework: "SOC2",
      controlRef: "CC6.2",
      title: "Prior to Issuing System Credentials",
      status: "passing",
    },
    { framework: "SOC2", controlRef: "CC6.3", title: "Removal of Access", status: "passing" },
    {
      framework: "SOC2",
      controlRef: "CC6.6",
      title: "Management of Identification and Authentication",
      status: "failing",
    },
    {
      framework: "SOC2",
      controlRef: "CC6.7",
      title: "Restricted Access to Sensitive Information",
      status: "passing",
    },
    {
      framework: "SOC2",
      controlRef: "CC7.2",
      title: "Detection of Security Threats and Anomalies",
      status: "passing",
    },
    {
      framework: "SOC2",
      controlRef: "CC7.3",
      title: "Security Event Monitoring and Response",
      status: "unknown",
    },
    {
      framework: "ISO27001",
      controlRef: "A.9.1.1",
      title: "Access control policy",
      status: "passing",
    },
    {
      framework: "ISO27001",
      controlRef: "A.9.2.1",
      title: "User registration and de-registration",
      status: "passing",
    },
    {
      framework: "ISO27001",
      controlRef: "A.9.2.3",
      title: "Management of privileged access rights",
      status: "failing",
    },
    {
      framework: "ISO27001",
      controlRef: "A.9.4.1",
      title: "Information access restriction",
      status: "passing",
    },
    { framework: "ISO27001", controlRef: "A.12.4.1", title: "Event logging", status: "passing" },
    {
      framework: "ISO27001",
      controlRef: "A.18.1.1",
      title: "Identification of applicable legislation",
      status: "unknown",
    },
    {
      framework: "NIST_CSF",
      controlRef: "PR.AC-1",
      title: "Identities and credentials are issued",
      status: "passing",
    },
    {
      framework: "NIST_CSF",
      controlRef: "PR.AC-4",
      title: "Access permissions are managed",
      status: "failing",
    },
    {
      framework: "NIST_CSF",
      controlRef: "PR.DS-1",
      title: "Data-at-rest is protected",
      status: "passing",
    },
    {
      framework: "NIST_CSF",
      controlRef: "DE.CM-1",
      title: "Network is monitored",
      status: "passing",
    },
    {
      framework: "HIPAA",
      controlRef: "164.308(a)(3)",
      title: "Workforce Security",
      status: "passing",
    },
    {
      framework: "HIPAA",
      controlRef: "164.308(a)(4)",
      title: "Information Access Management",
      status: "failing",
    },
    { framework: "HIPAA", controlRef: "164.312(a)(1)", title: "Access Control", status: "passing" },
    {
      framework: "GDPR",
      controlRef: "Art. 25",
      title: "Data protection by design",
      status: "passing",
    },
    {
      framework: "GDPR",
      controlRef: "Art. 32",
      title: "Security of processing",
      status: "passing",
    },
    { framework: "GDPR", controlRef: "Art. 33", title: "Breach notification", status: "unknown" },
  ];

  return {
    data: {
      items: controls.map((c) => ({ ...c, id: uuid() })),
    },
  };
}
