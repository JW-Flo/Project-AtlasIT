import {
  $ as e,
  D as t,
  F as n,
  H as r,
  I as i,
  L as a,
  N as o,
  P as s,
  Tt as c,
  W as l,
  X as u,
  at as d,
  bt as f,
  ct as p,
  l as m,
  ot as h,
  pt as g,
  rt as _,
  st as v,
  ut as y,
  wt as b,
  xt as x,
  z as S,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as C } from "../chunks/BZ8YNDoC.js";
import { t as w } from "../chunks/CMgwAYwY.js";
import { t as T } from "../chunks/Cj66XTu9.js";
import { n as E, t as D } from "../chunks/BEJa09Kq2.js";
var O = S(
    `<meta name="description" content="Frequently asked questions about AtlasIT — IT automation and compliance platform."/>`,
  ),
  k = S(`<p class="text-sm text-muted-foreground leading-relaxed"> </p>`),
  A = S(
    `<button class="w-full text-left px-5 py-4 flex items-center justify-between gap-4"><span class="font-medium text-sm"> </span> <!></button> <!>`,
    1,
  ),
  j = S(`<h2 class="text-lg font-semibold mt-8 mb-4"> </h2> <!>`, 1),
  M = S(
    `<div class="min-h-screen bg-background text-foreground"><div class="max-w-3xl mx-auto px-4 py-12"><a href="/" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"><!> Back</a> <h1 class="text-3xl font-bold mb-2">Frequently Asked Questions</h1> <p class="text-muted-foreground mb-10">Everything you need to know about AtlasIT.</p> <!> <div class="mt-12 text-center text-sm text-muted-foreground"><p>Still have questions? <a href="/support" class="text-primary hover:underline">Contact support</a></p></div></div></div>`,
  );
function N(S, N) {
  x(N, !1);
  let P = [
      {
        category: `Getting Started`,
        question: `What is AtlasIT?`,
        answer: `AtlasIT is a multi-tenant IT automation and compliance platform. It connects your SaaS applications, automates identity lifecycle management (Joiner/Mover/Leaver), and provides evidence-grounded compliance scoring across frameworks like SOC 2, ISO 27001, NIST CSF, HIPAA, and GDPR.`,
      },
      {
        category: `Getting Started`,
        question: `How do I get started?`,
        answer: `Sign up for a free account, complete the onboarding wizard to set your industry and compliance frameworks, then connect your first integration (e.g., Google Workspace, Okta, or Microsoft 365). AtlasIT will immediately begin discovering users, assessing compliance posture, and collecting evidence.`,
      },
      {
        category: `Getting Started`,
        question: `What integrations are supported?`,
        answer: `AtlasIT supports 35+ integrations across identity providers (Okta, Azure AD, Google Workspace), cloud platforms (AWS, GCP, Azure), collaboration tools (Slack, Microsoft Teams, Jira, Confluence), HR systems (BambooHR, Workday), and security tools (CrowdStrike, Zscaler). Nine core-tier adapters have full evidence collection and provisioning capabilities.`,
      },
      {
        category: `Getting Started`,
        question: `Is there a free tier?`,
        answer: `Yes. The Free plan includes SaaS discovery, shadow IT detection, compliance assessment for 1 framework, up to 10 users, 3 app integrations, and 7-day evidence retention. No credit card required.`,
      },
      {
        category: `Compliance`,
        question: `Which compliance frameworks are supported?`,
        answer: `AtlasIT supports SOC 2 (Trust Services Criteria), ISO 27001 (Annex A controls), NIST Cybersecurity Framework, HIPAA (Security Rule), and GDPR (Articles 5-32). Each framework has 10-15 controls evaluated by 60 CDT (Compliance Data Transform) rules.`,
      },
      {
        category: `Compliance`,
        question: `How are compliance scores calculated?`,
        answer: `Scores are evidence-grounded. The platform collects evidence from connected adapters, platform state (MFA enforcement, RBAC configuration, audit logging), and lifecycle events. Each piece of evidence is mapped to specific framework controls. Controls are weighted: not_started (0%), in_progress (25%), implemented (75%), verified (100%). The framework score is the weighted average across all controls.`,
      },
      {
        category: `Compliance`,
        question: `What is the evidence locker?`,
        answer: `The evidence locker is an immutable, auditable record of all compliance evidence collected by AtlasIT. Every adapter check, platform state probe, and lifecycle event is classified against framework controls and stored with a content hash, actor, timestamp, and impact score. Evidence is stored in Cloudflare R2 and D1 for durability.`,
      },
      {
        category: `Compliance`,
        question: `Can I use my own compliance controls?`,
        answer: `Currently, AtlasIT ships with predefined control sets for each framework. You can mark controls as not_started, in_progress, implemented, or verified. Custom control definitions are on the roadmap. You can also upload policy documents as evidence against any control.`,
      },
      {
        category: `Automation`,
        question: `What is JML automation?`,
        answer: `JML (Joiner/Mover/Leaver) automation handles the full identity lifecycle. When an employee joins, moves departments, or leaves the organization, AtlasIT automatically provisions or deprovisions access to the right applications based on group-to-app mappings and automation rules.`,
      },
      {
        category: `Automation`,
        question: `How do automation rules work?`,
        answer: `Automation rules are event-driven: when a trigger fires (e.g., user.joined, compliance.score_changed), conditions are evaluated, and actions execute (e.g., provision_app_access, send_notification, request_access_review). Rules can be created via the visual builder or the natural language builder.`,
      },
      {
        category: `Automation`,
        question: `What happens if an automation fails?`,
        answer: `Failed automation steps are retried with exponential backoff. If retries are exhausted, the step is sent to the dead letter queue (DLQ) with full context for manual review. All automation executions are logged with status, duration, and affected users.`,
      },
      {
        category: `Security`,
        question: `How is my data secured?`,
        answer: `AtlasIT runs on Cloudflare's global edge network. Data is encrypted at rest (AES-256-GCM) and in transit (TLS 1.3). Tenant data is strictly isolated — every database query is scoped by tenant_id. Credentials stored for integrations are AES-GCM encrypted with per-tenant keys. The platform supports SSO via OIDC/SAML and enforces MFA.`,
      },
      {
        category: `Security`,
        question: `Is AtlasIT SOC 2 compliant?`,
        answer: `AtlasIT is built with SOC 2 principles throughout — we use the same compliance engine internally. Our Trust Center (available at /trust) provides real-time transparency into our own compliance posture, connected integrations, and evidence counts.`,
      },
      {
        category: `Security`,
        question: `What access review capabilities exist?`,
        answer: `AtlasIT supports periodic access review campaigns. Admins create campaigns scoped by app, department, or all users. Reviewers (managers, owners, or peers) approve or revoke access per user/app pair. Unreviewed items are auto-revoked after a configurable grace period.`,
      },
      {
        category: `Billing`,
        question: `How does pricing work?`,
        answer: `AtlasIT uses per-user-per-month pricing with four tiers: Free, Starter ($3-4/user/mo), Professional ($7-9/user/mo), and Enterprise (custom). Annual billing saves 25%. Each tier unlocks more frameworks, integrations, automation capabilities, and evidence retention.`,
      },
      {
        category: `Billing`,
        question: `Can I change plans?`,
        answer: `Yes. Upgrade or downgrade anytime from Settings > Billing. Upgrades take effect immediately with prorated charges. Downgrades take effect at the end of the current billing period.`,
      },
    ],
    F = [...new Set(P.map((e) => e.category))],
    I = p(null);
  function L(e) {
    y(I, l(I) === e ? null : e);
  }
  m();
  var R = M();
  t(`1bex8oj`, (e) => {
    var t = O();
    (u(() => {
      _.title = `FAQ — AtlasIT`;
    }),
      a(e, t));
  });
  var z = d(R),
    B = d(z);
  (C(d(B), { class: `h-4 w-4` }),
    b(),
    c(B),
    o(
      v(B, 6),
      1,
      () => F,
      s,
      (t, u) => {
        var f = j(),
          p = h(f),
          m = d(p, !0);
        (c(p),
          o(
            v(p, 2),
            1,
            () => P.filter((e) => e.category === l(u)),
            s,
            (t, o) => {
              let s = g(() => P.indexOf(l(o)));
              E(t, {
                class: `mb-3`,
                children: (t, u) => {
                  var f = A(),
                    p = h(f),
                    m = d(p),
                    g = d(m, !0);
                  c(m);
                  var _ = v(m, 2),
                    y = (e) => {
                      T(e, { class: `h-4 w-4 shrink-0 text-muted-foreground` });
                    },
                    b = (e) => {
                      w(e, { class: `h-4 w-4 shrink-0 text-muted-foreground` });
                    };
                  (n(_, (e) => {
                    l(I) === l(s) ? e(y) : e(b, -1);
                  }),
                    c(p));
                  var x = v(p, 2),
                    S = (t) => {
                      D(t, {
                        class: `pt-0 pb-4 px-5`,
                        children: (t, n) => {
                          var r = k(),
                            s = d(r, !0);
                          (c(r), e(() => i(s, l(o).answer)), a(t, r));
                        },
                        $$slots: { default: !0 },
                      });
                    };
                  (n(x, (e) => {
                    l(I) === l(s) && e(S);
                  }),
                    e(() => i(g, l(o).question)),
                    r(`click`, p, () => L(l(s))),
                    a(t, f));
                },
                $$slots: { default: !0 },
              });
            },
          ),
          e(() => i(m, l(u))),
          a(t, f));
      },
    ),
    b(2),
    c(z),
    c(R),
    a(S, R),
    f());
}
export { N as component };
