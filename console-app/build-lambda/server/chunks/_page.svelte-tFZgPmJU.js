import { ab as store_get, ac as head, an as escape_html, aj as attr_class, ao as ensure_array_like, ak as stringify, ae as unsubscribe_stores, ah as sanitize_props, ai as spread_props, ad as slot } from './renderer-CwxN8JkH.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import { p as page } from './stores-emli2svW.js';
import { B as Button } from './button-BXPyX210.js';
import { B as Badge } from './badge-CdvwjGCK.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { C as Card_header } from './card-header-DkXf0dG2.js';
import { A as Arrow_left } from './arrow-left-26Np_Hiw.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import { X } from './x-BmTrGS3K.js';
import { Z as Zap } from './zap-Bjwz_Fvl.js';
import { A as Arrow_right } from './arrow-right-QFdd_4wx.js';
import './utils2-BgZmMgq3.js';

function Check($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [["path", { "d": "M20 6 9 17l-5-5" }]];
  Icon($$renderer, spread_props([
    { name: "check" },
    $$sanitized_props,
    {
      /**
       * @component @name Check
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgNiA5IDE3bC01LTUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/check
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
    var $$store_subs;
    let isLoggedIn, urlPlan, currentPlan;
    let selectedTier = null;
    let resolvedPlan = null;
    let planLoading = false;
    const TIER_ORDER = ["free", "starter", "professional", "enterprise"];
    function tierRank(id) {
      return TIER_ORDER.indexOf(id);
    }
    function planCta(plan) {
      if (!isLoggedIn) return plan.cta;
      if (plan.id === "enterprise") return "Contact sales";
      if (plan.id === currentPlan) return "Current plan";
      if (currentPlan && tierRank(plan.id) > tierRank(currentPlan)) return `Upgrade to ${plan.name}`;
      if (currentPlan && tierRank(plan.id) < tierRank(currentPlan)) return `Downgrade to ${plan.name}`;
      return `Select ${plan.name}`;
    }
    function planCtaVariant(plan) {
      if (!isLoggedIn) return plan.ctaVariant;
      if (plan.id === currentPlan) return "ghost";
      if (currentPlan && tierRank(plan.id) === tierRank(currentPlan) + 1) return "default";
      return "outline";
    }
    function planCtaDisabled(plan) {
      return isLoggedIn && (plan.id === currentPlan || planLoading);
    }
    const plans = [
      {
        id: "free",
        name: "Free",
        tagline: "SaaS discovery & compliance assessment",
        monthlyPrice: 0,
        annualPrice: 0,
        minimumMonthly: 0,
        cta: "Get started free",
        ctaVariant: "outline",
        comparisonKey: "free",
        features: [
          "SaaS discovery & shadow IT detection",
          "Compliance assessment for 1 framework",
          "Up to 10 users",
          "3 app integrations",
          "Community support",
          "7-day evidence retention"
        ]
      },
      {
        id: "starter",
        name: "Starter",
        tagline: "IT ops automation for growing teams",
        monthlyPrice: 4,
        annualPrice: 3,
        minimumMonthly: 20,
        cta: "Start 30-day free trial",
        ctaVariant: "outline",
        comparisonKey: "starter",
        features: [
          "Everything in Free",
          "Up to 50 users",
          "10 app integrations",
          "JML automation & provisioning",
          "2 compliance frameworks",
          "30-day evidence retention",
          "Email support"
        ]
      },
      {
        id: "professional",
        name: "Professional",
        tagline: "Full compliance & governance platform",
        monthlyPrice: 6,
        annualPrice: 5,
        minimumMonthly: 30,
        highlighted: true,
        cta: "Start 14-day free trial",
        ctaVariant: "default",
        comparisonKey: "pro",
        features: [
          "Everything in Starter",
          "Up to 500 users",
          "Unlimited integrations",
          "All compliance frameworks",
          "Custom automation rules",
          "Access reviews & NHI governance",
          "1-year evidence retention",
          "Priority support",
          "Audit-ready reports"
        ]
      },
      {
        id: "enterprise",
        name: "Enterprise",
        tagline: "Custom deployment & dedicated support",
        monthlyPrice: -1,
        annualPrice: -1,
        minimumMonthly: 0,
        cta: "Contact sales",
        ctaVariant: "outline",
        comparisonKey: "enterprise",
        features: [
          "Everything in Professional",
          "Unlimited users & integrations",
          "Custom compliance packs",
          "Plugin API access",
          "SSO / SAML",
          "Dedicated account manager",
          "99.99% SLA",
          "Custom integrations",
          "On-premise deployment option"
        ]
      }
    ];
    const comparisonKeys = ["free", "starter", "pro", "enterprise"];
    const comparisonFeatures = [
      {
        name: "Users",
        free: "10",
        starter: "50",
        pro: "500",
        enterprise: "Unlimited"
      },
      {
        name: "App integrations",
        free: "3",
        starter: "10",
        pro: "Unlimited",
        enterprise: "Unlimited"
      },
      {
        name: "Compliance frameworks",
        free: "1",
        starter: "2",
        pro: "All",
        enterprise: "All + Custom"
      },
      {
        name: "Evidence retention",
        free: "7 days",
        starter: "30 days",
        pro: "1 year",
        enterprise: "2 years"
      },
      {
        name: "Automation rules",
        free: "5",
        starter: "25",
        pro: "Unlimited",
        enterprise: "Unlimited"
      },
      {
        name: "SaaS discovery",
        free: true,
        starter: true,
        pro: true,
        enterprise: true
      },
      {
        name: "JML automation",
        free: false,
        starter: true,
        pro: true,
        enterprise: true
      },
      {
        name: "Access reviews",
        free: false,
        starter: false,
        pro: true,
        enterprise: true
      },
      {
        name: "NHI governance",
        free: false,
        starter: false,
        pro: true,
        enterprise: true
      },
      {
        name: "Audit-ready reports",
        free: false,
        starter: false,
        pro: true,
        enterprise: true
      },
      {
        name: "Trend analytics",
        free: false,
        starter: false,
        pro: true,
        enterprise: true
      },
      {
        name: "Custom compliance packs",
        free: false,
        starter: false,
        pro: true,
        enterprise: true
      },
      {
        name: "SSO / SAML",
        free: false,
        starter: false,
        pro: false,
        enterprise: true
      },
      {
        name: "Plugin API",
        free: false,
        starter: false,
        pro: false,
        enterprise: true
      },
      {
        name: "Dedicated support",
        free: false,
        starter: false,
        pro: false,
        enterprise: true
      },
      {
        name: "On-premise option",
        free: false,
        starter: false,
        pro: false,
        enterprise: true
      }
    ];
    function formatPrice(price) {
      if (price === -1) return "Custom";
      if (price === 0) return "$0";
      return `$${price}`;
    }
    function isColumnHighlighted(key) {
      return false;
    }
    isLoggedIn = store_get($$store_subs ??= {}, "$page", page).data?.session?.authenticated === true;
    urlPlan = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("currentPlan") ?? null;
    currentPlan = urlPlan ?? resolvedPlan;
    head("tap46d", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Pricing - AtlasIT</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Transparent pricing for IT automation and compliance. Start free, upgrade as you grow."/>`);
    });
    $$renderer2.push(`<div class="min-h-dvh bg-background relative overflow-hidden"><div class="absolute inset-x-0 top-0 -z-10 overflow-hidden pointer-events-none"><div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] rounded-full bg-primary/8 blur-3xl"></div></div> `);
    if (!isLoggedIn) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<header class="container-page py-5 flex items-center justify-between"><a href="/" class="flex items-center gap-2 group"><div class="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-sm"><svg viewBox="0 0 24 24" fill="none" class="h-4.5 w-4.5 text-primary-foreground" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div> <span class="font-semibold text-lg tracking-tight">AtlasIT</span></a> <div class="flex items-center gap-4"><a href="/login" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</a> `);
      Button($$renderer2, {
        variant: "primary",
        size: "sm",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Get started `);
          Arrow_right($$renderer3, { class: "h-3.5 w-3.5", strokeWidth: 2.25 });
          $$renderer3.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div></header>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<header class="container-page py-5"><button class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">`);
      Arrow_left($$renderer2, { class: "w-3.5 h-3.5", strokeWidth: 2.25 });
      $$renderer2.push(`<!----> Back to Settings</button></header>`);
    }
    $$renderer2.push(`<!--]--> <main class="container-page py-8 lg:py-12"><div class="text-center mb-10 lg:mb-14 max-w-3xl mx-auto animate-slide-up">`);
    if (!isLoggedIn) {
      $$renderer2.push("<!--[0-->");
      Badge($$renderer2, {
        variant: "default",
        size: "md",
        class: "mb-4",
        children: ($$renderer3) => {
          Zap($$renderer3, { class: "h-3 w-3", strokeWidth: 2.5 });
          $$renderer3.push(`<!----> First app connected → compliance score in &lt;10 minutes`);
        },
        $$slots: { default: true }
      });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <h1 class="text-4xl lg:text-5xl font-semibold tracking-tight mb-4 text-foreground">${escape_html(isLoggedIn ? "Change your plan" : "Simple, transparent pricing")}</h1> <p class="text-md text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">`);
    if (isLoggedIn) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`Upgrades take effect immediately with prorated billing. Downgrades apply at the end of your current billing period.`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`No sales calls required. Start free, ship compliance evidence to your auditors as a byproduct of running IT, and upgrade when you're ready.`);
    }
    $$renderer2.push(`<!--]--></p> <div class="inline-flex items-center gap-1 bg-muted rounded-full p-1 border border-border"><button${attr_class("px-4 py-1.5 rounded-full text-sm font-medium transition-all text-muted-foreground hover:text-foreground")}>Monthly</button> <button${attr_class("px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 bg-card text-foreground shadow-xs")}>Annual `);
    Badge($$renderer2, {
      variant: "success",
      size: "sm",
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->Save 25%`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></button></div></div> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24"><!--[-->`);
    const each_array = ensure_array_like(plans);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let plan = each_array[$$index_1];
      $$renderer2.push(`<div${attr_class(`cursor-pointer transition-all duration-200 rounded-lg ${stringify(selectedTier === plan.id ? "ring-2 ring-primary scale-[1.02]" : "hover:scale-[1.01]")}`)}>`);
      Card($$renderer2, {
        class: `relative flex flex-col h-full ${stringify(plan.highlighted || selectedTier === plan.id ? "border-primary shadow-lg" : "")} ${stringify("")}`,
        children: ($$renderer3) => {
          if (plan.highlighted && selectedTier !== plan.id) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="absolute -top-3 left-1/2 -translate-x-1/2">`);
            Badge($$renderer3, {
              variant: "default",
              class: "text-xs",
              children: ($$renderer4) => {
                $$renderer4.push(`<!---->Most Popular`);
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!----></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (selectedTier === plan.id) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="absolute -top-3 left-1/2 -translate-x-1/2">`);
            Badge($$renderer3, {
              variant: "default",
              class: "text-xs",
              children: ($$renderer4) => {
                $$renderer4.push(`<!---->Selected`);
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!----></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          Card_header($$renderer3, {
            class: "pb-4",
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="space-y-2"><h3 class="text-lg font-semibold">${escape_html(plan.name)}</h3> <p class="text-sm text-muted-foreground">${escape_html(plan.tagline)}</p></div> <div class="mt-4">`);
              if (plan.monthlyPrice === -1) {
                $$renderer4.push("<!--[0-->");
                $$renderer4.push(`<span class="text-3xl font-bold">Custom</span>`);
              } else if (plan.monthlyPrice === 0) {
                $$renderer4.push("<!--[1-->");
                $$renderer4.push(`<span class="text-3xl font-bold">$0</span> <span class="text-sm text-muted-foreground">/forever</span>`);
              } else {
                $$renderer4.push("<!--[-1-->");
                $$renderer4.push(`<span class="text-3xl font-bold">${escape_html(formatPrice(plan.annualPrice))}</span> <span class="text-sm text-muted-foreground">/user/month</span> `);
                if (plan.monthlyPrice > 0) {
                  $$renderer4.push("<!--[0-->");
                  $$renderer4.push(`<div class="text-xs text-muted-foreground mt-1">billed annually</div>`);
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--> `);
                if (plan.minimumMonthly > 0) {
                  $$renderer4.push("<!--[0-->");
                  $$renderer4.push(`<div class="text-xs text-muted-foreground mt-1">5 users minimum</div>`);
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]-->`);
              }
              $$renderer4.push(`<!--]--></div>`);
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!----> `);
          Card_content($$renderer3, {
            class: "flex-1 flex flex-col",
            children: ($$renderer4) => {
              Button($$renderer4, {
                variant: selectedTier === plan.id ? "default" : planCtaVariant(plan),
                class: "w-full mb-6",
                disabled: planCtaDisabled(plan),
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->${escape_html(planCta(plan))} `);
                  if (!planCtaDisabled(plan)) {
                    $$renderer5.push("<!--[0-->");
                    Arrow_right($$renderer5, { class: "w-4 h-4 ml-1" });
                  } else {
                    $$renderer5.push("<!--[-1-->");
                  }
                  $$renderer5.push(`<!--]-->`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----> <ul class="space-y-3 text-sm"><!--[-->`);
              const each_array_1 = ensure_array_like(plan.features);
              for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                let feature = each_array_1[$$index];
                $$renderer4.push(`<li class="flex items-start gap-2">`);
                Check($$renderer4, { class: "w-4 h-4 text-primary shrink-0 mt-0.5" });
                $$renderer4.push(`<!----> <span>${escape_html(feature)}</span></li>`);
              }
              $$renderer4.push(`<!--]--></ul>`);
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="mb-24"><h2 class="text-2xl font-bold text-center mb-8">Compare plans</h2> <div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b"><th class="text-left py-3 px-4 font-medium text-muted-foreground w-1/5">Feature</th><!--[-->`);
    const each_array_2 = ensure_array_like([
      { key: "free", label: "Free" },
      { key: "starter", label: "Starter" },
      { key: "pro", label: "Professional" },
      { key: "enterprise", label: "Enterprise" }
    ]);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let col = each_array_2[$$index_2];
      $$renderer2.push(`<th${attr_class(`text-center py-3 px-4 font-medium w-1/5 transition-colors duration-200 ${stringify(isColumnHighlighted(col.key) ? "text-primary bg-primary/10 rounded-t-lg" : col.key === "pro" && !selectedTier ? "text-primary" : "")}`)}>${escape_html(col.label)}</th>`);
    }
    $$renderer2.push(`<!--]--></tr></thead><tbody><!--[-->`);
    const each_array_3 = ensure_array_like(comparisonFeatures);
    for (let $$index_4 = 0, $$length = each_array_3.length; $$index_4 < $$length; $$index_4++) {
      let row = each_array_3[$$index_4];
      $$renderer2.push(`<tr class="border-b border-border/50"><td class="py-3 px-4 font-medium">${escape_html(row.name)}</td><!--[-->`);
      const each_array_4 = ensure_array_like(comparisonKeys);
      for (let $$index_3 = 0, $$length2 = each_array_4.length; $$index_3 < $$length2; $$index_3++) {
        let key = each_array_4[$$index_3];
        $$renderer2.push(`<td${attr_class(`text-center py-3 px-4 transition-colors duration-200 ${stringify("")}`)}>`);
        if (typeof row[key] === "boolean") {
          $$renderer2.push("<!--[0-->");
          if (row[key]) {
            $$renderer2.push("<!--[0-->");
            Check($$renderer2, { class: "w-4 h-4 text-primary mx-auto" });
          } else {
            $$renderer2.push("<!--[-1-->");
            X($$renderer2, { class: "w-4 h-4 text-muted-foreground/40 mx-auto" });
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<span class="text-sm">${escape_html(row[key])}</span>`);
        }
        $$renderer2.push(`<!--]--></td>`);
      }
      $$renderer2.push(`<!--]--></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody></table></div></div> <div class="max-w-3xl mx-auto mb-16"><h2 class="text-2xl font-bold text-center mb-8">Frequently asked questions</h2> <div class="space-y-6"><div><h3 class="font-medium mb-2">Can I try before I buy?</h3> <p class="text-sm text-muted-foreground">Yes! The free tier includes SaaS discovery and one compliance framework with no credit card required.
            Starter includes a 30-day free trial and Professional includes a 14-day free trial, both with full access.</p></div> <div><h3 class="font-medium mb-2">How does per-user pricing work?</h3> <p class="text-sm text-muted-foreground">You're billed based on the number of active users in your directory.
            Users who are deactivated or removed don't count toward your limit.</p></div> <div><h3 class="font-medium mb-2">Can I change plans at any time?</h3> <p class="text-sm text-muted-foreground">Absolutely. Upgrade or downgrade at any time. Upgrades take effect immediately with prorated billing.
            Downgrades take effect at the end of your current billing period.</p></div> <div><h3 class="font-medium mb-2">What compliance frameworks are supported?</h3> <p class="text-sm text-muted-foreground">We support SOC 2, ISO 27001, NIST CSF, HIPAA, and GDPR out of the box.
            Enterprise plans can use custom compliance packs via the Plugin API.</p></div> <div><h3 class="font-medium mb-2">Do you offer discounts for nonprofits or startups?</h3> <p class="text-sm text-muted-foreground">Yes. Contact us at sales@atlasit.pro for special pricing for nonprofits,
            educational institutions, and early-stage startups.</p></div></div></div> <div class="text-center py-12 border-t">`);
    if (isLoggedIn) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="text-sm text-muted-foreground mb-4">Need help choosing? Email us at <a href="mailto:sales@atlasit.pro" class="text-primary hover:underline">sales@atlasit.pro</a></p> `);
      Button($$renderer2, {
        variant: "outline",
        class: "px-8",
        children: ($$renderer3) => {
          Arrow_left($$renderer3, { class: "w-4 h-4 mr-1" });
          $$renderer3.push(`<!----> Back to billing settings`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="flex items-center justify-center gap-2 mb-4">`);
      Zap($$renderer2, { class: "w-5 h-5 text-primary" });
      $$renderer2.push(`<!----> <span class="font-semibold">Connect your first app and see your compliance score in under 10 minutes</span></div> `);
      Button($$renderer2, {
        class: "px-8",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Get started free `);
          Arrow_right($$renderer3, { class: "w-4 h-4 ml-1" });
          $$renderer3.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!---->`);
    }
    $$renderer2.push(`<!--]--></div></main> <footer class="border-t py-8 text-center text-sm text-muted-foreground"><p>© ${escape_html((/* @__PURE__ */ new Date()).getFullYear())} AtlasIT. All rights reserved.</p></footer></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-tFZgPmJU.js.map
