// console-app/src/lib/demo/data/policies.ts
import { daysAgo } from "./helpers";

export function getPoliciesResponse() {
  return {
    data: {
      items: [
        {
          id: "pol-access",
          tenantId: "demo-tenant-001",
          name: "Access Control Policy",
          category: "access-control",
          version: "2.1",
          status: "published" as const,
          frameworkRefs: ["SOC2:CC6.1", "ISO27001:A.9.1"],
          createdBy: "alex@acmecorp.io",
          createdAt: daysAgo(75),
          updatedAt: daysAgo(10),
          publishedAt: daysAgo(10),
          ackCount: 9,
        },
        {
          id: "pol-incident",
          tenantId: "demo-tenant-001",
          name: "Incident Response Plan",
          category: "incident-response",
          version: "1.3",
          status: "published" as const,
          frameworkRefs: ["SOC2:CC7.2", "NIST_CSF:RS.RP-1"],
          createdBy: "riley@acmecorp.io",
          createdAt: daysAgo(60),
          updatedAt: daysAgo(15),
          publishedAt: daysAgo(15),
          ackCount: 11,
        },
        {
          id: "pol-data",
          tenantId: "demo-tenant-001",
          name: "Data Protection & Encryption Policy",
          category: "data-protection",
          version: "1.0",
          status: "published" as const,
          frameworkRefs: ["GDPR:Art.32", "HIPAA:164.312(a)"],
          createdBy: "morgan@acmecorp.io",
          createdAt: daysAgo(50),
          updatedAt: daysAgo(20),
          publishedAt: daysAgo(20),
          ackCount: 8,
        },
        {
          id: "pol-vendor",
          tenantId: "demo-tenant-001",
          name: "Vendor Risk Management Policy",
          category: "vendor",
          version: "0.9",
          status: "draft" as const,
          frameworkRefs: ["SOC2:CC9.2", "ISO27001:A.15.1"],
          createdBy: "morgan@acmecorp.io",
          createdAt: daysAgo(14),
          updatedAt: daysAgo(3),
          publishedAt: null,
          ackCount: 0,
        },
        {
          id: "pol-acceptable-use",
          tenantId: "demo-tenant-001",
          name: "Acceptable Use Policy",
          category: "acceptable-use",
          version: "0.5",
          status: "draft" as const,
          frameworkRefs: ["SOC2:CC1.1"],
          createdBy: "alex@acmecorp.io",
          createdAt: daysAgo(7),
          updatedAt: daysAgo(2),
          publishedAt: null,
          ackCount: 0,
        },
        {
          id: "pol-retention",
          tenantId: "demo-tenant-001",
          name: "Data Retention Policy (Legacy)",
          category: "retention",
          version: "1.0",
          status: "archived" as const,
          frameworkRefs: ["GDPR:Art.5"],
          createdBy: "alex@acmecorp.io",
          createdAt: daysAgo(120),
          updatedAt: daysAgo(30),
          publishedAt: daysAgo(100),
          ackCount: 6,
        },
      ],
    },
  };
}

export function getPolicyDetailResponse(id: string) {
  const contentMap: Record<string, string> = {
    "pol-access":
      "# Access Control Policy\n\n## Purpose\nEstablish controls for managing access to Acme Corp systems and data.\n\n## Scope\nAll employees, contractors, and third parties with access to company systems.\n\n## Policy\n1. All access must follow least-privilege principles\n2. MFA is required for all accounts\n3. Access reviews must be completed quarterly\n4. Privileged access requires manager approval\n5. Accounts are deactivated within 24 hours of termination",
    "pol-incident":
      "# Incident Response Plan\n\n## Purpose\nDefine procedures for identifying, responding to, and recovering from security incidents.\n\n## Severity Levels\n- **Critical**: Data breach, ransomware, account compromise\n- **High**: Unauthorized access, policy violation\n- **Medium**: Suspicious activity, failed controls\n- **Low**: Minor anomaly, informational\n\n## Response Steps\n1. Detection & triage (< 15 min)\n2. Containment (< 1 hour)\n3. Investigation & remediation\n4. Post-incident review within 72 hours",
    "pol-data":
      "# Data Protection & Encryption Policy\n\n## Purpose\nEnsure all sensitive data is properly classified, encrypted, and handled.\n\n## Requirements\n1. Data at rest: AES-256 encryption\n2. Data in transit: TLS 1.2+\n3. PII must be classified and tagged\n4. Encryption keys rotated annually\n5. Backups encrypted with separate keys",
  };
  return {
    data: {
      content: contentMap[id] ?? "# Policy Document\n\nContent is being drafted.",
    },
  };
}
