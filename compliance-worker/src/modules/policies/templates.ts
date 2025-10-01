export interface PolicyTemplateRecord {
  key: string;
  name: string;
  format: "markdown" | "html" | "text";
  body: string;
}

const SOC2_TEMPLATE: PolicyTemplateRecord = {
  key: "soc2.demo",
  name: "SOC 2 Access Control Policy (Demo)",
  format: "markdown",
  body: [
    "# SOC 2 Access Control Policy",
    "",
    "**Tenant:** {{tenantId}}",
    "",
    "**Generated:** {{generatedAt}}",
    "",
    "## Purpose",
    "This policy documents the access control principles adopted by {{tenantId}} to satisfy SOC 2 common criteria for logical access.",
    "",
    "## Scope",
    "- Workforce members with access to production data",
    "- Third-party vendors operating on behalf of {{tenantId}}",
    "- Supporting infrastructure and SaaS services",
    "",
    "## Roles & Responsibilities",
    "- **Policy Owner:** Security Team ({{input.contactEmail}})",
    "- **Approver:** Chief Technology Officer",
    "- **Review Cadence:** Quarterly with ad-hoc updates following significant changes",
    "",
    "## Controls",
    "1. **Account Provisioning**",
    "   - Joiner workflows are initiated within 24 hours of hire confirmation.",
    "   - Access requests are logged and approved by the hiring manager.",
    "2. **Account Reviews**",
    "   - Access is reviewed every 90 days for relevance and least privilege.",
    "   - Reports of inactive accounts over 30 days are generated and remediated.",
    "3. **Account Revocation**",
    "   - Offboarding (leaver) workflows disable primary accounts within 4 hours.",
    "   - Shared credentials are rotated when a user departs.",
    "",
    "## Additional Context",
    "{{input.summary}}",
    "",
    "---",
    "*This document was generated deterministically by AtlasIT compliance automation.*",
    "",
  ].join("\n"),
};

export const DEFAULT_POLICY_TEMPLATES: PolicyTemplateRecord[] = [SOC2_TEMPLATE];
