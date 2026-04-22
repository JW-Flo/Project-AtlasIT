import { ac as head, ao as ensure_array_like, an as escape_html, ah as sanitize_props, ai as spread_props, ad as slot } from './renderer-CwxN8JkH.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { A as Arrow_left } from './arrow-left-26Np_Hiw.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import { C as Chevron_down } from './chevron-down-CeLScmpZ.js';
import './utils2-BgZmMgq3.js';

function Chevron_up($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [["path", { "d": "m18 15-6-6-6 6" }]];
  Icon($$renderer, spread_props([
    { name: "chevron-up" },
    $$sanitized_props,
    {
      /**
       * @component @name ChevronUp
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTggMTUtNi02LTYgNiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/chevron-up
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const faqs = [
      // Getting Started
      {
        category: "Getting Started",
        question: "What is AtlasIT?",
        answer: "AtlasIT is a multi-tenant IT automation and compliance platform. It connects your SaaS applications, automates identity lifecycle management (Joiner/Mover/Leaver), and provides evidence-grounded compliance scoring across frameworks like SOC 2, ISO 27001, NIST CSF, HIPAA, and GDPR."
      },
      {
        category: "Getting Started",
        question: "How do I get started?",
        answer: "Sign up for a free account, complete the onboarding wizard to set your industry and compliance frameworks, then connect your first integration (e.g., Google Workspace, Okta, or Microsoft 365). AtlasIT will immediately begin discovering users, assessing compliance posture, and collecting evidence."
      },
      {
        category: "Getting Started",
        question: "What integrations are supported?",
        answer: "AtlasIT supports 35+ integrations across identity providers (Okta, Azure AD, Google Workspace), cloud platforms (AWS, GCP, Azure), collaboration tools (Slack, Microsoft Teams, Jira, Confluence), HR systems (BambooHR, Workday), and security tools (CrowdStrike, Zscaler). Nine core-tier adapters have full evidence collection and provisioning capabilities."
      },
      {
        category: "Getting Started",
        question: "Is there a free tier?",
        answer: "Yes. The Free plan includes SaaS discovery, shadow IT detection, compliance assessment for 1 framework, up to 10 users, 3 app integrations, and 7-day evidence retention. No credit card required."
      },
      // Compliance
      {
        category: "Compliance",
        question: "Which compliance frameworks are supported?",
        answer: "AtlasIT supports SOC 2 (Trust Services Criteria), ISO 27001 (Annex A controls), NIST Cybersecurity Framework, HIPAA (Security Rule), and GDPR (Articles 5-32). Each framework has 10-15 controls evaluated by 60 CDT (Compliance Data Transform) rules."
      },
      {
        category: "Compliance",
        question: "How are compliance scores calculated?",
        answer: "Scores are evidence-grounded. The platform collects evidence from connected adapters, platform state (MFA enforcement, RBAC configuration, audit logging), and lifecycle events. Each piece of evidence is mapped to specific framework controls. Controls are weighted: not_started (0%), in_progress (25%), implemented (75%), verified (100%). The framework score is the weighted average across all controls."
      },
      {
        category: "Compliance",
        question: "What is the evidence locker?",
        answer: "The evidence locker is an immutable, auditable record of all compliance evidence collected by AtlasIT. Every adapter check, platform state probe, and lifecycle event is classified against framework controls and stored with a content hash, actor, timestamp, and impact score. Evidence is stored in Cloudflare R2 and D1 for durability."
      },
      {
        category: "Compliance",
        question: "Can I use my own compliance controls?",
        answer: "Currently, AtlasIT ships with predefined control sets for each framework. You can mark controls as not_started, in_progress, implemented, or verified. Custom control definitions are on the roadmap. You can also upload policy documents as evidence against any control."
      },
      // Automation
      {
        category: "Automation",
        question: "What is JML automation?",
        answer: "JML (Joiner/Mover/Leaver) automation handles the full identity lifecycle. When an employee joins, moves departments, or leaves the organization, AtlasIT automatically provisions or deprovisions access to the right applications based on group-to-app mappings and automation rules."
      },
      {
        category: "Automation",
        question: "How do automation rules work?",
        answer: "Automation rules are event-driven: when a trigger fires (e.g., user.joined, compliance.score_changed), conditions are evaluated, and actions execute (e.g., provision_app_access, send_notification, request_access_review). Rules can be created via the visual builder or the natural language builder."
      },
      {
        category: "Automation",
        question: "What happens if an automation fails?",
        answer: "Failed automation steps are retried with exponential backoff. If retries are exhausted, the step is sent to the dead letter queue (DLQ) with full context for manual review. All automation executions are logged with status, duration, and affected users."
      },
      // Security
      {
        category: "Security",
        question: "How is my data secured?",
        answer: "AtlasIT runs on Cloudflare's global edge network. Data is encrypted at rest (AES-256-GCM) and in transit (TLS 1.3). Tenant data is strictly isolated — every database query is scoped by tenant_id. Credentials stored for integrations are AES-GCM encrypted with per-tenant keys. The platform supports SSO via OIDC/SAML and enforces MFA."
      },
      {
        category: "Security",
        question: "Is AtlasIT SOC 2 compliant?",
        answer: "AtlasIT is built with SOC 2 principles throughout — we use the same compliance engine internally. Our Trust Center (available at /trust) provides real-time transparency into our own compliance posture, connected integrations, and evidence counts."
      },
      {
        category: "Security",
        question: "What access review capabilities exist?",
        answer: "AtlasIT supports periodic access review campaigns. Admins create campaigns scoped by app, department, or all users. Reviewers (managers, owners, or peers) approve or revoke access per user/app pair. Unreviewed items are auto-revoked after a configurable grace period."
      },
      // Billing
      {
        category: "Billing",
        question: "How does pricing work?",
        answer: "AtlasIT uses per-user-per-month pricing with four tiers: Free, Starter ($3-4/user/mo), Professional ($7-9/user/mo), and Enterprise (custom). Annual billing saves 25%. Each tier unlocks more frameworks, integrations, automation capabilities, and evidence retention."
      },
      {
        category: "Billing",
        question: "Can I change plans?",
        answer: "Yes. Upgrade or downgrade anytime from Settings > Billing. Upgrades take effect immediately with prorated charges. Downgrades take effect at the end of the current billing period."
      }
    ];
    const categories = [...new Set(faqs.map((f) => f.category))];
    let openIndex = null;
    head("1nai8ev", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>FAQ — AtlasIT</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Frequently asked questions about AtlasIT — IT automation and compliance platform."/>`);
    });
    $$renderer2.push(`<div class="min-h-screen bg-background text-foreground"><div class="max-w-3xl mx-auto px-4 py-12"><a href="/" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">`);
    Arrow_left($$renderer2, { class: "h-4 w-4" });
    $$renderer2.push(`<!----> Back</a> <h1 class="text-3xl font-bold mb-2">Frequently Asked Questions</h1> <p class="text-muted-foreground mb-10">Everything you need to know about AtlasIT.</p> <!--[-->`);
    const each_array = ensure_array_like(categories);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let cat = each_array[$$index_1];
      $$renderer2.push(`<h2 class="text-lg font-semibold mt-8 mb-4">${escape_html(cat)}</h2> <!--[-->`);
      const each_array_1 = ensure_array_like(faqs.filter((f) => f.category === cat));
      for (let i = 0, $$length2 = each_array_1.length; i < $$length2; i++) {
        let faq = each_array_1[i];
        const idx = faqs.indexOf(faq);
        Card($$renderer2, {
          class: "mb-3",
          children: ($$renderer3) => {
            $$renderer3.push(`<button class="w-full text-left px-5 py-4 flex items-center justify-between gap-4"><span class="font-medium text-sm">${escape_html(faq.question)}</span> `);
            if (openIndex === idx) {
              $$renderer3.push("<!--[0-->");
              Chevron_up($$renderer3, { class: "h-4 w-4 shrink-0 text-muted-foreground" });
            } else {
              $$renderer3.push("<!--[-1-->");
              Chevron_down($$renderer3, { class: "h-4 w-4 shrink-0 text-muted-foreground" });
            }
            $$renderer3.push(`<!--]--></button> `);
            if (openIndex === idx) {
              $$renderer3.push("<!--[0-->");
              Card_content($$renderer3, {
                class: "pt-0 pb-4 px-5",
                children: ($$renderer4) => {
                  $$renderer4.push(`<p class="text-sm text-muted-foreground leading-relaxed">${escape_html(faq.answer)}</p>`);
                },
                $$slots: { default: true }
              });
            } else {
              $$renderer3.push("<!--[-1-->");
            }
            $$renderer3.push(`<!--]-->`);
          },
          $$slots: { default: true }
        });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> <div class="mt-12 text-center text-sm text-muted-foreground"><p>Still have questions? <a href="/support" class="text-primary hover:underline">Contact support</a></p></div></div></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-uRtXXaLY.js.map
