<script lang="ts">
  import { ArrowLeft } from "lucide-svelte";
</script>

<svelte:head>
  <title>Privacy Policy — AtlasIT</title>
  <meta name="description" content="AtlasIT privacy policy — how we collect, use, and protect your data." />
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
  <div class="max-w-3xl mx-auto px-4 py-12">
    <a href="/" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
      <ArrowLeft class="h-4 w-4" /> Back
    </a>

    <h1 class="text-3xl font-bold mb-2">Privacy Policy</h1>
    <p class="text-sm text-muted-foreground mb-10">Last updated: April 5, 2026</p>

    <div class="prose prose-sm dark:prose-invert max-w-none space-y-8">
      <section>
        <h2 class="text-xl font-semibold mb-3">1. Introduction</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          AtlasIT ("we", "our", "us") operates the AtlasIT platform at atlasit.pro. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our IT automation and compliance platform. By using AtlasIT, you agree to the collection and use of information in accordance with this policy.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3">2. Information We Collect</h2>
        <h3 class="text-base font-medium mt-4 mb-2">Account Information</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          When you create an account, we collect your name, email address, organization name, and role. If you sign in via SSO (OIDC/SAML), we receive identity claims from your identity provider.
        </p>

        <h3 class="text-base font-medium mt-4 mb-2">Integration Data</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          When you connect third-party applications (e.g., Okta, Google Workspace, Microsoft 365, GitHub), we collect user directories, group memberships, security configurations, and compliance-relevant settings from those services. This data is used exclusively to provide compliance scoring and identity lifecycle automation.
        </p>

        <h3 class="text-base font-medium mt-4 mb-2">Compliance Evidence</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          We collect and store compliance evidence including adapter check results, audit log entries, policy documents you upload, and platform configuration state. Evidence is tagged to specific compliance framework controls and stored with content hashes for integrity verification.
        </p>

        <h3 class="text-base font-medium mt-4 mb-2">Usage Data</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          We collect standard usage telemetry including page views, feature usage, API call patterns, and error reports. This data is used to improve the platform and is not shared with third parties.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
        <ul class="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-2">
          <li>Provide, maintain, and improve the AtlasIT platform</li>
          <li>Calculate compliance scores and generate evidence reports</li>
          <li>Execute automation rules and identity lifecycle workflows</li>
          <li>Send transactional notifications (access reviews, automation alerts, score changes)</li>
          <li>Detect and prevent security threats and unauthorized access</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3">4. Data Isolation & Multi-Tenancy</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          AtlasIT is a multi-tenant platform. All data is strictly isolated by tenant. Every database query is scoped by your tenant identifier. No tenant can access another tenant's data, users, evidence, or configurations. Tenant isolation is enforced at the application layer, database layer, and API layer.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3">5. Data Security</h2>
        <ul class="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-2">
          <li><strong>Encryption at rest:</strong> All data stored in Cloudflare D1, KV, and R2 is encrypted using AES-256-GCM</li>
          <li><strong>Encryption in transit:</strong> All connections use TLS 1.3</li>
          <li><strong>Credential encryption:</strong> OAuth tokens and API keys stored for integrations are individually encrypted with AES-GCM using per-tenant keys</li>
          <li><strong>Authentication:</strong> Cloudflare Access JWT verification, SSO (OIDC/SAML), and MFA enforcement</li>
          <li><strong>Audit logging:</strong> All administrative actions are logged with actor, timestamp, and action details</li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3">6. Data Retention</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Evidence retention varies by plan: Free (7 days), Starter (90 days), Professional (1 year), Enterprise (custom). Audit logs are retained for a minimum of 1 year. You can configure data retention policies in Settings. When data expires or you delete your account, all associated data is permanently removed within 30 days.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3">7. Third-Party Services</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          AtlasIT runs on Cloudflare's global edge network (Workers, D1, R2, KV, Queues). We use Stripe for payment processing. We do not sell your data to third parties. Integration data fetched from your connected applications is used solely to provide AtlasIT services and is never shared externally.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3">8. Your Rights</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Depending on your jurisdiction, you may have the right to: access your personal data, correct inaccurate data, delete your data, restrict processing, data portability, and object to processing. To exercise these rights, <a href="/privacy/dsar" class="text-primary hover:underline">submit a data privacy request</a> or contact us at privacy@atlasit.pro.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3">9. GDPR Compliance</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          For EU/EEA users: AtlasIT processes personal data as a data processor on behalf of your organization (the data controller). We process data based on the contractual necessity of providing the platform services. Data processing agreements (DPAs) are available for Enterprise customers.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          We may update this Privacy Policy from time to time. We will notify you of material changes via email or a prominent notice in the platform. Continued use after changes constitutes acceptance of the revised policy.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3">11. Contact Us</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          If you have questions about this Privacy Policy or our data practices, contact us at:
        </p>
        <ul class="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1 mt-2">
          <li>Email: privacy@atlasit.pro</li>
          <li>Support: <a href="/support" class="text-primary hover:underline">atlasit.pro/support</a></li>
        </ul>
      </section>
    </div>
  </div>
</div>
