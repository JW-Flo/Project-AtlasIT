<script lang="ts">
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-svelte";

  interface FaqItem {
    question: string;
    answer: string;
    category: string;
  }

  const faqs: FaqItem[] = [
    // Getting Started
    {
      category: "Getting Started",
      question: "What is AtlasIT?",
      answer:
        "AtlasIT is a multi-tenant IT automation and compliance platform. It connects your SaaS applications, automates identity lifecycle management (Joiner/Mover/Leaver), and provides evidence-grounded compliance scoring across frameworks like SOC 2, ISO 27001, NIST CSF, HIPAA, and GDPR.",
    },
    {
      category: "Getting Started",
      question: "How do I get started?",
      answer:
        "Sign up for a free account, complete the onboarding wizard to set your industry and compliance frameworks, then connect your first integration (e.g., Google Workspace, Okta, or Microsoft 365). AtlasIT will immediately begin discovering users, assessing compliance posture, and collecting evidence.",
    },
    {
      category: "Getting Started",
      question: "What integrations are supported?",
      answer:
        "AtlasIT supports 35+ integrations across identity providers (Okta, Azure AD, Google Workspace), cloud platforms (AWS, GCP, Azure), collaboration tools (Slack, Microsoft Teams, Jira, Confluence), HR systems (BambooHR, Workday), and security tools (CrowdStrike, Zscaler). Nine core-tier adapters have full evidence collection and provisioning capabilities.",
    },
    {
      category: "Getting Started",
      question: "Is there a free tier?",
      answer:
        "Yes. The Free plan includes SaaS discovery, shadow IT detection, compliance assessment for 1 framework, up to 10 users, 3 app integrations, and 7-day evidence retention. No credit card required.",
    },

    // Compliance
    {
      category: "Compliance",
      question: "Which compliance frameworks are supported?",
      answer:
        "AtlasIT supports SOC 2 (Trust Services Criteria), ISO 27001 (Annex A controls), NIST Cybersecurity Framework, HIPAA (Security Rule), and GDPR (Articles 5-32). Each framework has 10-15 controls evaluated by 60 CDT (Compliance Data Transform) rules.",
    },
    {
      category: "Compliance",
      question: "How are compliance scores calculated?",
      answer:
        "Scores are evidence-grounded. The platform collects evidence from connected adapters, platform state (MFA enforcement, RBAC configuration, audit logging), and lifecycle events. Each piece of evidence is mapped to specific framework controls. Controls are weighted: not_started (0%), in_progress (25%), implemented (75%), verified (100%). The framework score is the weighted average across all controls.",
    },
    {
      category: "Compliance",
      question: "What is the evidence locker?",
      answer:
        "The evidence locker is an immutable, auditable record of all compliance evidence collected by AtlasIT. Every adapter check, platform state probe, and lifecycle event is classified against framework controls and stored with a content hash, actor, timestamp, and impact score. Evidence is stored in Cloudflare R2 and D1 for durability.",
    },
    {
      category: "Compliance",
      question: "Can I use my own compliance controls?",
      answer:
        "Currently, AtlasIT ships with predefined control sets for each framework. You can mark controls as not_started, in_progress, implemented, or verified. Custom control definitions are on the roadmap. You can also upload policy documents as evidence against any control.",
    },

    // Automation
    {
      category: "Automation",
      question: "What is JML automation?",
      answer:
        "JML (Joiner/Mover/Leaver) automation handles the full identity lifecycle. When an employee joins, moves departments, or leaves the organization, AtlasIT automatically provisions or deprovisions access to the right applications based on group-to-app mappings and automation rules.",
    },
    {
      category: "Automation",
      question: "How do automation rules work?",
      answer:
        "Automation rules are event-driven: when a trigger fires (e.g., user.joined, compliance.score_changed), conditions are evaluated, and actions execute (e.g., provision_app_access, send_notification, request_access_review). Rules can be created via the visual builder or the natural language builder.",
    },
    {
      category: "Automation",
      question: "What happens if an automation fails?",
      answer:
        "Failed automation steps are retried with exponential backoff. If retries are exhausted, the step is sent to the dead letter queue (DLQ) with full context for manual review. All automation executions are logged with status, duration, and affected users.",
    },

    // Security
    {
      category: "Security",
      question: "How is my data secured?",
      answer:
        "AtlasIT runs on Cloudflare's global edge network. Data is encrypted at rest (AES-256-GCM) and in transit (TLS 1.3). Tenant data is strictly isolated — every database query is scoped by tenant_id. Credentials stored for integrations are AES-GCM encrypted with per-tenant keys. The platform supports SSO via OIDC/SAML and enforces MFA.",
    },
    {
      category: "Security",
      question: "Is AtlasIT SOC 2 compliant?",
      answer:
        "AtlasIT is built with SOC 2 principles throughout — we use the same compliance engine internally. Our Trust Center (available at /trust) provides real-time transparency into our own compliance posture, connected integrations, and evidence counts.",
    },
    {
      category: "Security",
      question: "What access review capabilities exist?",
      answer:
        "AtlasIT supports periodic access review campaigns. Admins create campaigns scoped by app, department, or all users. Reviewers (managers, owners, or peers) approve or revoke access per user/app pair. Unreviewed items are auto-revoked after a configurable grace period.",
    },

    // Billing
    {
      category: "Billing",
      question: "How does pricing work?",
      answer:
        "AtlasIT uses per-user-per-month pricing with four tiers: Free, Starter ($3-4/user/mo), Professional ($7-9/user/mo), and Enterprise (custom). Annual billing saves 25%. Each tier unlocks more frameworks, integrations, automation capabilities, and evidence retention.",
    },
    {
      category: "Billing",
      question: "Can I change plans?",
      answer:
        "Yes. Upgrade or downgrade anytime from Settings > Billing. Upgrades take effect immediately with prorated charges. Downgrades take effect at the end of the current billing period.",
    },
  ];

  const categories = [...new Set(faqs.map((f) => f.category))];
  let openIndex: number | null = null;

  function toggle(i: number) {
    openIndex = openIndex === i ? null : i;
  }
</script>

<svelte:head>
  <title>FAQ — AtlasIT</title>
  <meta name="description" content="Frequently asked questions about AtlasIT — IT automation and compliance platform." />
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
  <div class="max-w-3xl mx-auto px-4 py-12">
    <a href="/" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
      <ArrowLeft class="h-4 w-4" /> Back
    </a>

    <h1 class="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
    <p class="text-muted-foreground mb-10">Everything you need to know about AtlasIT.</p>

    {#each categories as cat}
      <h2 class="text-lg font-semibold mt-8 mb-4">{cat}</h2>
      {#each faqs.filter((f) => f.category === cat) as faq, i}
        {@const idx = faqs.indexOf(faq)}
        <Card class="mb-3">
          <button
            class="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
            on:click={() => toggle(idx)}
          >
            <span class="font-medium text-sm">{faq.question}</span>
            {#if openIndex === idx}
              <ChevronUp class="h-4 w-4 shrink-0 text-muted-foreground" />
            {:else}
              <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground" />
            {/if}
          </button>
          {#if openIndex === idx}
            <CardContent class="pt-0 pb-4 px-5">
              <p class="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
            </CardContent>
          {/if}
        </Card>
      {/each}
    {/each}

    <div class="mt-12 text-center text-sm text-muted-foreground">
      <p>Still have questions? <a href="/support" class="text-primary hover:underline">Contact support</a></p>
    </div>
  </div>
</div>
