import { ac as head, ao as ensure_array_like, an as escape_html } from './renderer-CwxN8JkH.js';
import { P as Play, C as Clipboard_check } from './play-CuA3OCFR.js';
import { A as Arrow_right } from './arrow-right-QFdd_4wx.js';
import { S as Shield_check } from './shield-check-DC5MZnbP.js';
import { Z as Zap } from './zap-Bjwz_Fvl.js';
import { P as Plug } from './plug-4npMR_bc.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const features = [
      {
        icon: Shield_check,
        title: "Multi-Framework Compliance",
        description: "SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR — evidence-grounded scoring across frameworks with gap analysis."
      },
      {
        icon: Zap,
        title: "Automation Engine",
        description: "Event-driven rules that enforce MFA, revoke access on offboarding, and trigger access reviews automatically."
      },
      {
        icon: Plug,
        title: "35+ Integrations",
        description: "Connect Okta, AWS, GitHub, Jira, Google Workspace, Slack, and more. Evidence flows in automatically."
      },
      {
        icon: Clipboard_check,
        title: "Access Reviews & Policies",
        description: "Quarterly access review campaigns, self-service requests, AI-assisted policy generation, and acknowledgement tracking."
      }
    ];
    head("9kjhw2", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>AtlasIT Demo — IT Compliance Automation</title>`);
      });
    });
    $$renderer2.push(`<div class="min-h-dvh bg-background text-foreground"><div class="relative overflow-hidden"><div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none"></div> <div class="absolute top-20 right-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div> <div class="relative max-w-5xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28"><div class="flex items-center gap-2.5 mb-12"><div class="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-sm"><span class="text-primary-foreground font-semibold text-sm">A</span></div> <span class="font-semibold text-lg tracking-tight">AtlasIT</span></div> <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl">IT Compliance on <span class="text-primary">Autopilot</span></h1> <p class="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">Automate evidence collection, score compliance across 5 frameworks, and pass audits faster. See how it works with real data — no signup required.</p> <div class="mt-8 flex flex-wrap items-center gap-4"><button class="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-md hover:bg-primary-hover hover:shadow-lg transition-all duration-200 active:scale-[0.98]">`);
    Play($$renderer2, { class: "h-4.5 w-4.5", strokeWidth: 2.5 });
    $$renderer2.push(`<!----> Explore the Console</button> <a href="https://atlasit.pro/signup" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-foreground font-medium text-base hover:bg-accent transition-colors">Start Free Trial `);
    Arrow_right($$renderer2, { class: "h-4 w-4", strokeWidth: 2 });
    $$renderer2.push(`<!----></a></div></div></div> <section class="max-w-5xl mx-auto px-6 pb-20 md:pb-28"><div class="grid grid-cols-1 md:grid-cols-2 gap-5"><!--[-->`);
    const each_array = ensure_array_like(features);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let f = each_array[$$index];
      $$renderer2.push(`<div class="group surface p-6 hover:shadow-md hover:border-primary/30 transition-all duration-200"><div class="w-10 h-10 rounded-lg bg-primary-muted text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">`);
      if (f.icon) {
        $$renderer2.push("<!--[-->");
        f.icon($$renderer2, { class: "h-5 w-5", strokeWidth: 2 });
        $$renderer2.push("<!--]-->");
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push("<!--]-->");
      }
      $$renderer2.push(`</div> <h3 class="text-base font-semibold text-foreground mb-1.5">${escape_html(f.title)}</h3> <p class="text-sm text-muted-foreground leading-relaxed">${escape_html(f.description)}</p></div>`);
    }
    $$renderer2.push(`<!--]--></div></section> <footer class="border-t border-border py-8 text-center text-2xs text-muted-foreground/80"><div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1"><span>© ${escape_html((/* @__PURE__ */ new Date()).getFullYear())} AtlasIT</span> <span class="text-muted-foreground/40">·</span> <a href="/privacy" class="hover:text-foreground transition-colors">Privacy</a> <a href="/support" class="hover:text-foreground transition-colors">Support</a></div></footer></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CLl-ZEyr.js.map
