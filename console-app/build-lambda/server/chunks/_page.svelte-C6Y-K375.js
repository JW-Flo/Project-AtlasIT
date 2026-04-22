import { ac as head, af as fallback, an as escape_html, ao as ensure_array_like, aj as attr_class, ak as stringify, am as attr_style, al as attr, ag as bind_props, ah as sanitize_props, ai as spread_props, ad as slot } from './renderer-CwxN8JkH.js';
import { o as onDestroy } from './index-server-C1ubzO3x.js';
import { S as Shield_check } from './shield-check-DC5MZnbP.js';
import { T as Trending_up } from './trending-up-YFN1_z68.js';
import { Z as Zap } from './zap-Bjwz_Fvl.js';
import { T as Triangle_alert } from './triangle-alert-BIxAVWgG.js';
import { D as Database } from './database-BDhljPiU.js';
import { P as Plug } from './plug-4npMR_bc.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import { F as File_check } from './file-check-nCfSdN0B.js';

function Circle_check($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["path", { "d": "m9 12 2 2 4-4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "circle-check" },
    $$sanitized_props,
    {
      /**
       * @component @name CircleCheck
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJtOSAxMiAyIDIgNC00IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/circle-check
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
const DEMO_TENANT = {
  name: "Acme Dental Group",
  appsConnected: 12,
  openIncidents: 2,
  automationsToday: 17,
  complianceScore: 86
};
const DEMO_MODULES = [
  { id: "dashboard", label: "Dashboard", blurb: "Executive posture in one pane" },
  { id: "compliance", label: "Compliance", blurb: "HIPAA + SOC2 controls and evidence" },
  { id: "identity", label: "Identity", blurb: "Joiner, mover, leaver + MFA coverage" },
  { id: "automation", label: "Automation", blurb: "No-code workflows and approvals" },
  { id: "incidents", label: "Incidents", blurb: "Detections with guided remediation" },
  { id: "analytics", label: "Analytics", blurb: "ROI, risk reduction, success metrics" },
  { id: "marketplace", label: "Marketplace", blurb: "Ready-to-connect integrations" }
];
function InteractiveDemo($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let authenticated = fallback($$props["authenticated"], false);
    let activeModule = "dashboard";
    let liveCompliance = DEMO_TENANT.complianceScore;
    let liveAutomations = DEMO_TENANT.automationsToday;
    let liveIncidents = DEMO_TENANT.openIncidents;
    const ctas = authenticated ? [
      {
        label: "Start Free Trial",
        href: "/pricing",
        event: "requested_trial",
        primary: true
      },
      {
        label: "Explore Sandbox",
        href: "/console",
        event: "clicked_cta",
        primary: false
      }
    ] : [
      {
        label: "Start Free Trial",
        href: "/signup",
        event: "requested_trial",
        primary: true
      },
      {
        label: "Book Demo",
        href: "/support",
        event: "booked_demo",
        primary: false
      }
    ];
    onDestroy(() => {
    });
    const frameworks = [
      {
        name: "HIPAA",
        score: 89,
        passing: 31,
        total: 36,
        color: "bg-blue-500"
      },
      {
        name: "SOC 2",
        score: 83,
        passing: 42,
        total: 48,
        color: "bg-[hsl(252,87%,65%)]"
      }
    ];
    const recentActivity = [
      {
        icon: Circle_check,
        color: "text-green-500",
        msg: "New-hire onboarding completed — Dr. Maya Lin",
        time: "Just now"
      },
      {
        icon: Zap,
        color: "text-[hsl(252,87%,58%)]",
        msg: "Device quarantine flow triggered automatically",
        time: "4m ago"
      },
      {
        icon: File_check,
        color: "text-blue-500",
        msg: "SOC 2 evidence collected — Okta login events (128 items)",
        time: "12m ago"
      },
      {
        icon: Triangle_alert,
        color: "text-amber-500",
        msg: "MFA bypass attempt detected — investigating",
        time: "31m ago"
      }
    ];
    $$renderer2.push(`<div class="min-h-screen bg-slate-50 text-slate-900 pb-20"><div class="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-10"><div class="flex items-center gap-2.5"><div class="h-7 w-7 rounded-lg bg-[hsl(252,87%,58%)] flex items-center justify-center shrink-0">`);
    Shield_check($$renderer2, { class: "h-4 w-4 text-white", strokeWidth: 2.5 });
    $$renderer2.push(`<!----></div> <span class="font-semibold text-slate-900 text-sm">AtlasIT</span> <span class="hidden sm:inline-flex items-center rounded-full bg-[hsl(252,87%,96%)] px-2.5 py-0.5 text-xs font-medium text-[hsl(252,87%,48%)]">Demo</span></div> <div class="flex items-center gap-3"><span class="hidden sm:block text-xs text-slate-500">${escape_html(DEMO_TENANT.name)}</span> <div class="h-7 w-7 rounded-full bg-[hsl(252,87%,92%)] flex items-center justify-center text-xs font-semibold text-[hsl(252,87%,48%)]">AD</div></div></div> <div class="mx-auto max-w-5xl px-4 pt-5"><div class="mb-5 flex gap-1 overflow-x-auto no-scrollbar"><!--[-->`);
    const each_array = ensure_array_like(DEMO_MODULES);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let mod = each_array[$$index];
      $$renderer2.push(`<button${attr_class(`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${stringify(activeModule === mod.id ? "bg-[hsl(252,87%,58%)] text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm")}`)}>${escape_html(mod.label)}</button>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4"><div class="col-span-2 rounded-xl bg-white border border-slate-200 p-5 shadow-sm"><p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Overall Compliance</p> <div class="flex items-end gap-3"><span class="text-5xl font-bold text-green-600">${escape_html(liveCompliance)}%</span> <span class="mb-1 flex items-center gap-1 text-xs font-medium text-green-600">`);
      Trending_up($$renderer2, { class: "h-3.5 w-3.5" });
      $$renderer2.push(`<!----> +3% this week</span></div> <div class="mt-3 h-1.5 w-full rounded-full bg-slate-100"><div class="h-1.5 rounded-full bg-green-500 transition-all duration-700"${attr_style(`width: ${stringify(liveCompliance)}%`)}></div></div> <div class="mt-3 flex gap-4"><!--[-->`);
      const each_array_1 = ensure_array_like(frameworks);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let fw = each_array_1[$$index_1];
        $$renderer2.push(`<div class="text-xs"><span class="font-medium text-slate-700">${escape_html(fw.name)}</span> <span class="ml-1 text-slate-500">${escape_html(fw.score)}%</span></div>`);
      }
      $$renderer2.push(`<!--]--></div></div> <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm"><div class="flex items-center gap-2 mb-2"><div class="rounded-md bg-[hsl(252,87%,96%)] p-1.5">`);
      Zap($$renderer2, { class: "h-3.5 w-3.5 text-[hsl(252,87%,58%)]" });
      $$renderer2.push(`<!----></div> <p class="text-xs text-slate-500">Automations</p></div> <p class="text-2xl font-bold text-slate-900">${escape_html(liveAutomations)}</p> <p class="text-xs text-slate-400 mt-0.5">today</p></div> <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm"><div class="flex items-center gap-2 mb-2"><div class="rounded-md bg-amber-50 p-1.5">`);
      Triangle_alert($$renderer2, { class: "h-3.5 w-3.5 text-amber-500" });
      $$renderer2.push(`<!----></div> <p class="text-xs text-slate-500">Incidents</p></div> <p class="text-2xl font-bold text-amber-600">${escape_html(liveIncidents)}</p> <p class="text-xs text-slate-400 mt-0.5">open</p></div> <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm"><div class="flex items-center gap-2 mb-2"><div class="rounded-md bg-blue-50 p-1.5">`);
      Database($$renderer2, { class: "h-3.5 w-3.5 text-blue-500" });
      $$renderer2.push(`<!----></div> <p class="text-xs text-slate-500">Evidence</p></div> <p class="text-2xl font-bold text-slate-900">243</p> <p class="text-xs text-slate-400 mt-0.5">collected</p></div> <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm"><div class="flex items-center gap-2 mb-2"><div class="rounded-md bg-slate-100 p-1.5">`);
      Plug($$renderer2, { class: "h-3.5 w-3.5 text-slate-500" });
      $$renderer2.push(`<!----></div> <p class="text-xs text-slate-500">Integrations</p></div> <p class="text-2xl font-bold text-slate-900">${escape_html(DEMO_TENANT.appsConnected)}</p> <p class="text-xs text-slate-400 mt-0.5">connected</p></div></div> <div class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden"><div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between"><h3 class="text-sm font-semibold text-slate-900">Recent Activity</h3> <span class="inline-flex items-center gap-1 text-xs text-green-600 font-medium"><span class="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>Live</span></div> <div class="divide-y divide-slate-50"><!--[-->`);
      const each_array_2 = ensure_array_like(recentActivity);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let item = each_array_2[$$index_2];
        $$renderer2.push(`<div class="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">`);
        if (item.icon) {
          $$renderer2.push("<!--[-->");
          item.icon($$renderer2, { class: `mt-0.5 h-4 w-4 shrink-0 ${stringify(item.color)}` });
          $$renderer2.push("<!--]-->");
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push("<!--]-->");
        }
        $$renderer2.push(` <p class="flex-1 text-sm text-slate-700 min-w-0">${escape_html(item.msg)}</p> <span class="shrink-0 text-xs text-slate-400">${escape_html(item.time)}</span></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white shadow-sm"><div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3"><p class="hidden sm:block text-xs text-slate-500">Try AtlasIT with your own data.</p> <div class="flex w-full sm:w-auto gap-2 justify-center sm:justify-end"><!--[-->`);
    const each_array_10 = ensure_array_like(ctas);
    for (let $$index_10 = 0, $$length = each_array_10.length; $$index_10 < $$length; $$index_10++) {
      let cta = each_array_10[$$index_10];
      $$renderer2.push(`<a${attr("href", cta.href)}${attr_class(`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${stringify(cta.primary ? "bg-[hsl(252,87%,58%)] text-white hover:bg-[hsl(252,87%,48%)] shadow-sm" : "border border-slate-200 text-slate-700 hover:bg-slate-50")}`)}>${escape_html(cta.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></div></div></div>`);
    bind_props($$props, { authenticated });
  });
}
function _page($$renderer) {
  head("j9227w", $$renderer, ($$renderer2) => {
    $$renderer2.title(($$renderer3) => {
      $$renderer3.push(`<title>Demo Tenant · AtlasIT Console</title>`);
    });
  });
  InteractiveDemo($$renderer, { authenticated: true });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-C6Y-K375.js.map
