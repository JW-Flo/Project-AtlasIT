import { ac as head, ao as ensure_array_like, ah as sanitize_props, ai as spread_props, ad as slot, an as escape_html, aj as attr_class, ap as clsx, al as attr, ak as stringify, am as attr_style, ag as bind_props, af as fallback } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';
import { B as Button } from './button-BXPyX210.js';
import { C as Card } from './card-1P6BfRcm.js';
import { B as Badge } from './badge-CdvwjGCK.js';
import { P as Page_header } from './page-header-BaRCucb6.js';
import { E as Empty_state } from './empty-state-BGCoXdYN.js';
import { T as Trending_up } from './trending-up-YFN1_z68.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import { E as ErrorBoundary, s as safeFetch, r as relativeTime } from './time-D6hT3Ioh.js';
import { p as push } from './toastStore-X6rW096m.js';
import { P as Plug } from './plug-4npMR_bc.js';
import { T as Triangle_alert } from './triangle-alert-BIxAVWgG.js';
import { X } from './x-BmTrGS3K.js';
import { S as Shield_check } from './shield-check-DC5MZnbP.js';
import { A as Arrow_right } from './arrow-right-QFdd_4wx.js';
import { D as Database } from './database-BDhljPiU.js';
import { Z as Zap } from './zap-Bjwz_Fvl.js';
import { C as Chevron_right, A as App_window } from './chevron-right-CfUr7O77.js';
import { F as File_check } from './file-check-nCfSdN0B.js';
import { U as Users } from './users-B6QpDkaK.js';
import { A as Activity } from './activity-BZT1Fpfp.js';
import './index-server-C1ubzO3x.js';
import './stores-emli2svW.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import './index-C1X1AO8K.js';

function Arrow_up_right($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M7 7h10v10" }],
    ["path", { "d": "M7 17 17 7" }]
  ];
  Icon($$renderer, spread_props([
    { name: "arrow-up-right" },
    $$sanitized_props,
    {
      /**
       * @component @name ArrowUpRight
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNyA3aDEwdjEwIiAvPgogIDxwYXRoIGQ9Ik03IDE3IDE3IDciIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/arrow-up-right
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
function Gauge($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "m12 14 4-4" }],
    ["path", { "d": "M3.34 19a10 10 0 1 1 17.32 0" }]
  ];
  Icon($$renderer, spread_props([
    { name: "gauge" },
    $$sanitized_props,
    {
      /**
       * @component @name Gauge
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTIgMTQgNC00IiAvPgogIDxwYXRoIGQ9Ik0zLjM0IDE5YTEwIDEwIDAgMSAxIDE3LjMyIDAiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/gauge
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
function Minus($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [["path", { "d": "M5 12h14" }]];
  Icon($$renderer, spread_props([
    { name: "minus" },
    $$sanitized_props,
    {
      /**
       * @component @name Minus
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNSAxMmgxNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/minus
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
function Trending_down($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M16 17h6v-6" }],
    ["path", { "d": "m22 17-8.5-8.5-5 5L2 7" }]
  ];
  Icon($$renderer, spread_props([
    { name: "trending-down" },
    $$sanitized_props,
    {
      /**
       * @component @name TrendingDown
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTYgMTdoNnYtNiIgLz4KICA8cGF0aCBkPSJtMjIgMTctOC41LTguNS01IDVMMiA3IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/trending-down
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
function Stat_card($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let trendIcon, trendColor;
    let label = $$props["label"];
    let value = $$props["value"];
    let hint = fallback($$props["hint"], void 0);
    let trend = fallback($$props["trend"], void 0);
    let intent = fallback($$props["intent"], "default");
    let icon = fallback($$props["icon"], void 0);
    let className = fallback($$props["class"], "");
    const intentRing = {
      default: "",
      success: "ring-1 ring-success/20",
      warning: "ring-1 ring-warning/20",
      danger: "ring-1 ring-destructive/20"
    };
    const iconBg = {
      default: "bg-primary-muted text-primary",
      success: "bg-success-muted text-success",
      warning: "bg-warning-muted text-warning",
      danger: "bg-destructive-muted text-destructive"
    };
    trendIcon = trend ? trend.delta > 0 ? Trending_up : trend.delta < 0 ? Trending_down : Minus : null;
    trendColor = trend ? trend.delta > 0 ? "text-success" : trend.delta < 0 ? "text-destructive" : "text-muted-foreground" : "";
    $$renderer2.push(`<div${attr_class(clsx(cn("bg-card border border-border rounded-xl p-5 shadow-xs", "transition-all duration-fast hover:shadow-sm hover:border-border-strong", intentRing[intent], className)))}><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">${escape_html(label)}</p> <p class="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">${escape_html(value)}</p> `);
    if (hint) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="mt-1 text-xs text-muted-foreground">${escape_html(hint)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (icon) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div${attr_class(clsx(cn("shrink-0 flex items-center justify-center w-9 h-9 rounded-lg", iconBg[intent])))}>`);
      if (icon) {
        $$renderer2.push("<!--[-->");
        icon($$renderer2, { class: "w-4.5 h-4.5", strokeWidth: 2 });
        $$renderer2.push("<!--]-->");
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push("<!--]-->");
      }
      $$renderer2.push(`</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (trend && trendIcon) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mt-3 flex items-center gap-1 text-xs">`);
      if (trendIcon) {
        $$renderer2.push("<!--[-->");
        trendIcon($$renderer2, { class: cn("w-3 h-3", trendColor) });
        $$renderer2.push("<!--]-->");
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push("<!--]-->");
      }
      $$renderer2.push(` <span${attr_class(clsx(cn("font-medium tabular-nums", trendColor)))}>${escape_html(trend.delta > 0 ? "+" : "")}${escape_html(trend.delta)}${escape_html(trend.suffix ?? "%")}</span> <span class="text-muted-foreground">vs last period</span></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { label, value, hint, trend, intent, icon, class: className });
  });
}
function Checklist($$renderer, $$props) {
  let items = $$props["items"];
  $$renderer.push(`<ul class="space-y-2"><!--[-->`);
  const each_array = ensure_array_like(items);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let item = each_array[$$index];
    $$renderer.push(`<li class="flex items-start gap-3"><input type="checkbox"${attr("checked", item.completed, true)} disabled="" class="mt-1 rounded border-input"${attr("aria-label", item.label)}/> `);
    if (item.href) {
      $$renderer.push("<!--[0-->");
      $$renderer.push(`<a${attr("href", item.href)} class="text-sm text-foreground hover:underline">${escape_html(item.label)}</a>`);
    } else {
      $$renderer.push("<!--[-1-->");
      $$renderer.push(`<span class="text-sm text-foreground">${escape_html(item.label)}</span>`);
    }
    $$renderer.push(`<!--]--></li>`);
  }
  $$renderer.push(`<!--]--></ul>`);
  bind_props($$props, { items });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let sparklinePath, sparklineAreaPath, trendDelta, installedPacks, totalControls, totalPass, totalFail, totalUnknown, overallScore, lastEvaluated, activeIntegrations, checklistItems, allCompleted, showChecklist;
    let dashboard = null;
    let packs = [];
    let evidence = [];
    let integrations = [];
    let trend = [];
    let loading = true;
    let error = null;
    const sparklineWidth = 220;
    const sparklineHeight = 56;
    const quickActions = [
      {
        href: "/console/compliance/controls",
        label: "Controls",
        hint: "All state across packs",
        icon: Shield_check
      },
      {
        href: "/console/policies",
        label: "Policies",
        hint: "Create + acknowledge",
        icon: File_check
      },
      {
        href: "/console/directory",
        label: "Directory",
        hint: "Users + groups",
        icon: Users
      },
      {
        href: "/console/incidents",
        label: "Incidents",
        hint: "Investigate + resolve",
        icon: Activity
      }
    ];
    async function loadAll() {
      loading = true;
      error = null;
      try {
        const [dRes, pRes, eRes, iRes, tRes] = await Promise.all([
          safeFetch("/api/v1/dashboard", { context: "load dashboard" }),
          safeFetch("/api/compliance/api/v1/compliance-packs", { context: "load compliance packs" }),
          safeFetch("/api/compliance/api/v1/evidence?limit=10", { context: "load evidence" }),
          safeFetch("/api/v1/apps/integrations", { context: "load integrations" }),
          safeFetch("/api/compliance/api/v1/compliance-packs/history/aggregate?days=30", { context: "load trend data" })
        ]);
        if (dRes.ok) {
          dashboard = dRes.data.data ?? null;
        } else {
          push({
            variant: "error",
            title: "Dashboard load failed",
            message: dRes.error.actionable
          });
        }
        if (pRes.ok) {
          packs = pRes.data.data?.items ?? [];
        } else if (pRes.error.type !== "auth") {
          push({
            variant: "warning",
            title: "Compliance packs unavailable",
            message: pRes.error.actionable
          });
        }
        if (eRes.ok) {
          evidence = eRes.data.data?.items ?? [];
        }
        if (iRes.ok) {
          integrations = iRes.data.data?.items ?? [];
        }
        if (tRes.ok) {
          trend = tRes.data.data?.series ?? [];
        }
      } catch (e) {
        error = "Failed to load dashboard. Please try again.";
        push({
          variant: "error",
          title: "Load failed",
          message: "Unable to load dashboard data. Check your connection and try again."
        });
      } finally {
        loading = false;
      }
    }
    function scoreColorClass(score) {
      if (score >= 80) return "text-success";
      if (score >= 50) return "text-warning";
      return "text-destructive";
    }
    function scoreBgClass(score) {
      if (score >= 80) return "bg-success";
      if (score >= 50) return "bg-warning";
      return "bg-destructive";
    }
    function frameworkBadge(key) {
      const map = {
        SOC2: "info",
        ISO27001: "default",
        NIST_CSF: "success",
        HIPAA: "warning",
        GDPR: "destructive"
      };
      return map[key] ?? "muted";
    }
    function impactBadge(impact) {
      if (impact === "positive") return "success";
      if (impact === "negative") return "destructive";
      return "muted";
    }
    sparklinePath = (() => {
      if (trend.length < 2) return "";
      const scores = trend.map((t) => t.avgScore);
      const min = Math.max(0, Math.min(...scores) - 5);
      const max = Math.min(100, Math.max(...scores) + 5);
      const range = max - min || 1;
      const step = sparklineWidth / (trend.length - 1);
      return trend.map((t, i) => {
        const x = (i * step).toFixed(1);
        const y = (sparklineHeight - (t.avgScore - min) / range * sparklineHeight).toFixed(1);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      }).join(" ");
    })();
    sparklineAreaPath = sparklinePath ? `${sparklinePath} L${sparklineWidth},${sparklineHeight} L0,${sparklineHeight} Z` : "";
    trendDelta = (() => {
      if (trend.length < 2) return null;
      const first = trend[0].avgScore;
      const last = trend[trend.length - 1].avgScore;
      return { diff: last - first, first, last, days: trend.length };
    })();
    installedPacks = packs.filter((p) => p.installedAt);
    totalControls = installedPacks.reduce((s, p) => s + (p.controlCount ?? 0), 0);
    totalPass = installedPacks.reduce((s, p) => s + (p.passCount ?? 0), 0);
    totalFail = installedPacks.reduce((s, p) => s + (p.failCount ?? 0), 0);
    totalUnknown = installedPacks.reduce((s, p) => s + (p.unknownCount ?? 0), 0);
    overallScore = totalControls > 0 ? Math.round(totalPass * 100 / totalControls) : 0;
    lastEvaluated = installedPacks.map((p) => p.lastEvaluatedAt).filter(Boolean).sort().reverse()[0];
    activeIntegrations = integrations.filter((i) => i.status === "active").length;
    checklistItems = [
      {
        id: "connect-adapter",
        label: "Connect your first application",
        completed: activeIntegrations > 0,
        href: "/console/apps"
      },
      {
        id: "install-pack",
        label: "Install a compliance pack",
        completed: installedPacks.length > 0,
        href: "/console/compliance/packs"
      },
      {
        id: "configure-automation",
        label: "Set up automation rules",
        completed: (dashboard?.stats?.automationRulesTotal ?? 0) > 0,
        href: "/console/automation"
      },
      {
        id: "review-evidence",
        label: "Review collected evidence",
        completed: (dashboard?.stats?.evidenceCount ?? 0) > 0,
        href: "/console/compliance/evidence"
      }
    ];
    allCompleted = checklistItems.every((item) => item.completed);
    showChecklist = !allCompleted && true && !loading;
    head("178shog", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Dashboard · AtlasIT</title>`);
      });
    });
    ErrorBoundary($$renderer2, {
      onRetry: loadAll,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="animate-fade-in">`);
        Page_header($$renderer3, {
          title: "Dashboard",
          description: dashboard?.tenant?.name ?? "Loading workspace…",
          $$slots: {
            actions: ($$renderer4) => {
              {
                if (installedPacks.length > 0) {
                  $$renderer4.push("<!--[0-->");
                  Button($$renderer4, {
                    variant: "outline",
                    size: "sm",
                    href: "/console/compliance",
                    children: ($$renderer5) => {
                      Gauge($$renderer5, { class: "h-3.5 w-3.5", strokeWidth: 2.25 });
                      $$renderer5.push(`<!----> View compliance`);
                    },
                    $$slots: { default: true }
                  });
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--> `);
                Button($$renderer4, {
                  variant: "primary",
                  size: "sm",
                  href: "/console/apps",
                  children: ($$renderer5) => {
                    Plug($$renderer5, { class: "h-3.5 w-3.5", strokeWidth: 2.25 });
                    $$renderer5.push(`<!----> Connect app`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!---->`);
              }
            }
          }
        });
        $$renderer3.push(`<!----> `);
        if (loading) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="space-y-4"><div class="h-44 skeleton rounded-2xl"></div> <div class="grid grid-cols-2 lg:grid-cols-4 gap-3"><!--[-->`);
          const each_array = ensure_array_like(Array(4));
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            each_array[$$index];
            $$renderer3.push(`<div class="h-28 skeleton rounded-xl"></div>`);
          }
          $$renderer3.push(`<!--]--></div> <div class="grid grid-cols-1 lg:grid-cols-3 gap-4"><div class="h-64 skeleton rounded-xl"></div> <div class="lg:col-span-2 h-64 skeleton rounded-xl"></div></div></div>`);
        } else if (error) {
          $$renderer3.push("<!--[1-->");
          Card($$renderer3, {
            padding: "lg",
            class: "bg-destructive-muted border-destructive/20",
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex items-start gap-3">`);
              Triangle_alert($$renderer4, {
                class: "h-5 w-5 text-destructive shrink-0 mt-0.5",
                strokeWidth: 2
              });
              $$renderer4.push(`<!----> <div class="flex-1"><p class="text-sm text-destructive font-medium">${escape_html(error)}</p> `);
              Button($$renderer4, {
                variant: "destructive",
                size: "sm",
                class: "mt-3",
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->Retry`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----></div></div>`);
            },
            $$slots: { default: true }
          });
        } else {
          $$renderer3.push("<!--[-1-->");
          if (showChecklist) {
            $$renderer3.push("<!--[0-->");
            Card($$renderer3, {
              padding: "lg",
              class: "mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 relative",
              children: ($$renderer4) => {
                $$renderer4.push(`<button class="absolute top-4 right-4 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors" aria-label="Dismiss checklist">`);
                X($$renderer4, { class: "h-4 w-4 text-blue-600 dark:text-blue-400" });
                $$renderer4.push(`<!----></button> <div class="mb-3"><h2 class="text-lg font-semibold text-foreground">Getting Started</h2> <p class="text-sm text-muted-foreground mt-1">Complete these steps to get the most out of AtlasIT</p></div> `);
                Checklist($$renderer4, { items: checklistItems });
                $$renderer4.push(`<!---->`);
              },
              $$slots: { default: true }
            });
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (installedPacks.length > 0) {
            $$renderer3.push("<!--[0-->");
            Card($$renderer3, {
              padding: "lg",
              variant: "elevated",
              class: "mb-6 relative overflow-hidden",
              "data-tour": "hero-score",
              children: ($$renderer4) => {
                $$renderer4.push(`<div class="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div> <div class="relative grid lg:grid-cols-[1fr,auto,auto] gap-6 items-end"><div><div class="flex items-center gap-2 mb-3">`);
                Shield_check($$renderer4, { class: "h-3.5 w-3.5 text-primary", strokeWidth: 2.5 });
                $$renderer4.push(`<!----> <span class="text-2xs uppercase tracking-wider font-semibold text-muted-foreground">Overall Compliance Score</span></div> <div class="flex items-baseline gap-3 flex-wrap"><div${attr_class(clsx(cn("text-6xl font-semibold tabular-nums tracking-tight", scoreColorClass(overallScore))))}>${escape_html(overallScore)}<span class="text-2xl text-muted-foreground/40">%</span></div></div> <div class="mt-3 flex items-center gap-2.5 flex-wrap text-xs"><span class="inline-flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-success"></span> <span class="text-foreground tabular-nums font-medium">${escape_html(totalPass)}</span> <span class="text-muted-foreground">passing</span></span> <span class="text-muted-foreground/40">·</span> <span class="inline-flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-destructive"></span> <span class="text-foreground tabular-nums font-medium">${escape_html(totalFail)}</span> <span class="text-muted-foreground">failing</span></span> <span class="text-muted-foreground/40">·</span> <span class="inline-flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span> <span class="text-foreground tabular-nums font-medium">${escape_html(totalUnknown)}</span> <span class="text-muted-foreground">unknown</span></span> <span class="text-muted-foreground/40">·</span> <span class="text-muted-foreground tabular-nums">of ${escape_html(totalControls)}</span></div> <p class="mt-2 text-2xs text-muted-foreground">Last evaluated ${escape_html(relativeTime(lastEvaluated))}</p></div> `);
                if (sparklinePath && trendDelta) {
                  $$renderer4.push("<!--[0-->");
                  $$renderer4.push(`<div class="flex flex-col items-end gap-1.5"><div class="flex items-center gap-1.5 text-2xs text-muted-foreground"><span>Last ${escape_html(trendDelta.days)} days</span> `);
                  if (Math.abs(trendDelta.diff) >= 0.1) {
                    $$renderer4.push("<!--[0-->");
                    $$renderer4.push(`<span${attr_class(clsx(cn("inline-flex items-center gap-0.5 font-semibold tabular-nums", trendDelta.diff > 0 ? "text-success" : "text-destructive")))}>`);
                    if (trendDelta.diff > 0) {
                      $$renderer4.push("<!--[0-->");
                      Trending_up($$renderer4, { class: "h-3 w-3", strokeWidth: 2.5 });
                    } else {
                      $$renderer4.push("<!--[-1-->");
                      Trending_down($$renderer4, { class: "h-3 w-3", strokeWidth: 2.5 });
                    }
                    $$renderer4.push(`<!--]--> ${escape_html(Math.abs(trendDelta.diff).toFixed(1))} pts</span>`);
                  } else {
                    $$renderer4.push("<!--[-1-->");
                  }
                  $$renderer4.push(`<!--]--></div> <svg${attr("width", sparklineWidth)}${attr("height", sparklineHeight)}${attr("viewBox", `0 0 ${stringify(sparklineWidth)} ${stringify(sparklineHeight)}`)}${attr_class(clsx(cn("overflow-visible", scoreColorClass(overallScore))))} aria-hidden="true"><defs><linearGradient id="trendFillDash" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity="0.22"></stop><stop offset="100%" stop-color="currentColor" stop-opacity="0"></stop></linearGradient></defs><path${attr("d", sparklineAreaPath)} fill="url(#trendFillDash)"></path><path${attr("d", sparklinePath)} fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>`);
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--></div> <div class="mt-6 h-2 bg-muted rounded-full overflow-hidden"><div${attr_class(clsx(cn("h-full transition-all duration-700 ease-out-quart rounded-full", scoreBgClass(overallScore))))}${attr_style(`width: ${stringify(overallScore)}%`)}></div></div>`);
              },
              $$slots: { default: true }
            });
          } else {
            $$renderer3.push("<!--[-1-->");
            Card($$renderer3, {
              padding: "lg",
              class: "mb-6 bg-primary-muted border-primary/20",
              children: ($$renderer4) => {
                $$renderer4.push(`<div class="flex items-start gap-4"><div class="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">`);
                Shield_check($$renderer4, { class: "h-5 w-5", strokeWidth: 2 });
                $$renderer4.push(`<!----></div> <div class="flex-1"><h3 class="text-base font-semibold text-foreground">No compliance packs installed yet</h3> <p class="mt-1 text-sm text-muted-foreground">Install a framework pack (SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR) to start scoring evidence against controls.</p> `);
                Button($$renderer4, {
                  variant: "primary",
                  size: "sm",
                  href: "/console/compliance/packs",
                  class: "mt-3",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->Browse packs `);
                    Arrow_right($$renderer5, { class: "h-3 w-3", strokeWidth: 2.25 });
                    $$renderer5.push(`<!---->`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----></div></div>`);
              },
              $$slots: { default: true }
            });
          }
          $$renderer3.push(`<!--]--> <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">`);
          Stat_card($$renderer3, {
            label: "Evidence collected",
            value: dashboard?.stats?.evidenceCount?.toLocaleString() ?? "0",
            hint: "Operational records",
            icon: Database
          });
          $$renderer3.push(`<!----> `);
          Stat_card($$renderer3, {
            label: "Active automations",
            value: `${stringify(dashboard?.stats?.automationRulesEnabled ?? 0)} / ${stringify(dashboard?.stats?.automationRulesTotal ?? 0)}`,
            hint: "Rules enabled / total",
            icon: Zap
          });
          $$renderer3.push(`<!----> `);
          Stat_card($$renderer3, {
            label: "Open incidents",
            value: dashboard?.stats?.openIncidents ?? 0,
            hint: "Awaiting resolution",
            icon: Triangle_alert,
            intent: (dashboard?.stats?.openIncidents ?? 0) > 0 ? "warning" : "default"
          });
          $$renderer3.push(`<!----> `);
          Stat_card($$renderer3, {
            label: "Connected apps",
            value: `${stringify(activeIntegrations)} / ${stringify(integrations.length)}`,
            hint: "Active live-data sources",
            icon: Plug
          });
          $$renderer3.push(`<!----></div> `);
          if (installedPacks.length > 0) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<section class="mb-6"><div class="flex items-baseline justify-between mb-3"><h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frameworks</h2> <a href="/console/compliance/packs" class="text-2xs text-primary hover:underline font-medium inline-flex items-center gap-0.5">Manage packs `);
            Chevron_right($$renderer3, { class: "h-3 w-3", strokeWidth: 2.25 });
            $$renderer3.push(`<!----></a></div> <div class="grid grid-cols-2 lg:grid-cols-5 gap-3" data-tour="framework-cards"><!--[-->`);
            const each_array_1 = ensure_array_like(installedPacks);
            for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
              let p = each_array_1[$$index_1];
              const score = p.controlCount > 0 && p.passCount !== null ? Math.round(p.passCount * 100 / p.controlCount) : 0;
              $$renderer3.push(`<a href="/console/compliance/packs" class="group surface p-4 hover:shadow-sm hover:border-border-strong transition-all duration-fast block"><div class="flex items-start justify-between mb-3">`);
              Badge($$renderer3, {
                variant: frameworkBadge(p.framework),
                size: "sm",
                children: ($$renderer4) => {
                  $$renderer4.push(`<!---->${escape_html(p.framework.replace("_", " "))}`);
                },
                $$slots: { default: true }
              });
              $$renderer3.push(`<!----> `);
              Arrow_up_right($$renderer3, {
                class: "h-3 w-3 text-muted-foreground/40 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-fast",
                strokeWidth: 2.25
              });
              $$renderer3.push(`<!----></div> <div class="text-2xs font-medium text-foreground/80 truncate mb-2">${escape_html(p.label)}</div> <div class="flex items-baseline gap-1.5"><div${attr_class(clsx(cn("text-2xl font-semibold tabular-nums tracking-tight", scoreColorClass(score))))}>${escape_html(score)}<span class="text-sm text-muted-foreground/50">%</span></div> <span class="text-2xs text-muted-foreground tabular-nums">${escape_html(p.passCount ?? 0)}/${escape_html(p.controlCount)}</span></div> <div class="mt-2.5 h-1 bg-muted rounded-full overflow-hidden"><div${attr_class(clsx(cn("h-full transition-all duration-500 ease-out-quart", scoreBgClass(score))))}${attr_style(`width: ${stringify(score)}%`)}></div></div></a>`);
            }
            $$renderer3.push(`<!--]--></div></section>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">`);
          Card($$renderer3, {
            padding: "none",
            class: "overflow-hidden",
            "data-tour": "connected-apps",
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="px-4 py-3 border-b border-border flex items-center justify-between"><h2 class="text-sm font-semibold text-foreground">Connected Apps</h2> <a href="/console/apps" class="text-2xs text-primary hover:underline font-medium inline-flex items-center gap-0.5">All `);
              Chevron_right($$renderer4, { class: "h-3 w-3", strokeWidth: 2.25 });
              $$renderer4.push(`<!----></a></div> `);
              if (integrations.length === 0) {
                $$renderer4.push("<!--[0-->");
                Empty_state($$renderer4, {
                  title: "No apps connected",
                  description: "Connect your first integration to start collecting evidence.",
                  icon: App_window,
                  $$slots: {
                    action: ($$renderer5) => {
                      {
                        Button($$renderer5, {
                          variant: "primary",
                          size: "sm",
                          href: "/console/apps",
                          children: ($$renderer6) => {
                            Plug($$renderer6, { class: "h-3 w-3", strokeWidth: 2.25 });
                            $$renderer6.push(`<!----> Connect app`);
                          },
                          $$slots: { default: true }
                        });
                      }
                    }
                  }
                });
              } else {
                $$renderer4.push("<!--[-1-->");
                $$renderer4.push(`<ul class="divide-y divide-border"><!--[-->`);
                const each_array_2 = ensure_array_like(integrations.slice(0, 5));
                for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
                  let i = each_array_2[$$index_2];
                  $$renderer4.push(`<li class="px-4 py-2.5 flex items-center justify-between row-hover"><div class="min-w-0"><div class="font-medium text-foreground capitalize text-sm truncate">${escape_html(i.provider)}</div> <div class="text-2xs text-muted-foreground">Synced ${escape_html(relativeTime(i.updated_at))}</div></div> `);
                  Badge($$renderer4, {
                    variant: i.status === "active" ? "success" : i.status === "error" ? "destructive" : "muted",
                    size: "sm",
                    dot: true,
                    children: ($$renderer5) => {
                      $$renderer5.push(`<!---->${escape_html(i.status)}`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer4.push(`<!----></li>`);
                }
                $$renderer4.push(`<!--]--></ul>`);
              }
              $$renderer4.push(`<!--]-->`);
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!----> `);
          Card($$renderer3, {
            padding: "none",
            class: "lg:col-span-2 overflow-hidden",
            "data-tour": "evidence-feed",
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="px-4 py-3 border-b border-border flex items-center justify-between"><div><h2 class="text-sm font-semibold text-foreground">Recent Evidence</h2> <p class="text-2xs text-muted-foreground">Latest operational records scored against controls</p></div> <a href="/console/compliance/evidence" class="text-2xs text-primary hover:underline font-medium inline-flex items-center gap-0.5">All `);
              Chevron_right($$renderer4, { class: "h-3 w-3", strokeWidth: 2.25 });
              $$renderer4.push(`<!----></a></div> `);
              if (evidence.length === 0) {
                $$renderer4.push("<!--[0-->");
                Empty_state($$renderer4, {
                  title: "No evidence yet",
                  description: "Connect an app and the compliance engine will start scoring its events.",
                  icon: File_check
                });
              } else {
                $$renderer4.push("<!--[-1-->");
                $$renderer4.push(`<ul class="divide-y divide-border"><!--[-->`);
                const each_array_3 = ensure_array_like(evidence);
                for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
                  let e = each_array_3[$$index_3];
                  $$renderer4.push(`<li class="px-4 py-2.5 row-hover"><div class="flex items-start gap-3">`);
                  Badge($$renderer4, {
                    variant: impactBadge(e.metadata?.impact),
                    size: "sm",
                    class: "shrink-0 mt-0.5",
                    children: ($$renderer5) => {
                      $$renderer5.push(`<!---->${escape_html(e.metadata?.impact ?? "—")}`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer4.push(`<!----> <div class="flex-1 min-w-0"><div class="flex items-center gap-1.5 text-sm flex-wrap">`);
                  if (e.framework) {
                    $$renderer4.push("<!--[0-->");
                    $$renderer4.push(`<span class="font-mono text-2xs text-muted-foreground">${escape_html(e.framework)}</span>`);
                  } else {
                    $$renderer4.push("<!--[-1-->");
                  }
                  $$renderer4.push(`<!--]--> <span class="font-mono text-xs font-medium text-foreground tabular-nums">${escape_html(e.controlId ?? "—")}</span> <span class="text-muted-foreground/30 text-xs">·</span> <span class="text-2xs text-muted-foreground capitalize">${escape_html(e.source)}</span></div> `);
                  if (e.metadata?.reasoning) {
                    $$renderer4.push("<!--[0-->");
                    $$renderer4.push(`<p class="mt-0.5 text-xs text-muted-foreground truncate">${escape_html(e.metadata.reasoning)}</p>`);
                  } else {
                    $$renderer4.push("<!--[-1-->");
                  }
                  $$renderer4.push(`<!--]--></div> <div class="text-2xs text-muted-foreground shrink-0 tabular-nums">${escape_html(relativeTime(e.createdAt))}</div></div></li>`);
                }
                $$renderer4.push(`<!--]--></ul>`);
              }
              $$renderer4.push(`<!--]-->`);
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!----></div> <section><h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Jump to</h2> <div class="grid grid-cols-2 lg:grid-cols-4 gap-3"><!--[-->`);
          const each_array_4 = ensure_array_like(quickActions);
          for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
            let a = each_array_4[$$index_4];
            $$renderer3.push(`<a${attr("href", a.href)} class="group surface p-4 hover:shadow-sm hover:border-primary/40 transition-all duration-fast"><div class="flex items-start justify-between gap-3 mb-2"><div class="w-8 h-8 rounded-lg bg-primary-muted text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">`);
            if (a.icon) {
              $$renderer3.push("<!--[-->");
              a.icon($$renderer3, { class: "h-4 w-4", strokeWidth: 2 });
              $$renderer3.push("<!--]-->");
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push("<!--]-->");
            }
            $$renderer3.push(`</div> `);
            Arrow_up_right($$renderer3, {
              class: "h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all",
              strokeWidth: 2.25
            });
            $$renderer3.push(`<!----></div> <div class="font-medium text-foreground text-sm">${escape_html(a.label)}</div> <div class="text-2xs text-muted-foreground mt-0.5">${escape_html(a.hint)}</div></a>`);
          }
          $$renderer3.push(`<!--]--></div></section>`);
        }
        $$renderer3.push(`<!--]--></div>`);
      },
      $$slots: { default: true }
    });
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BPCawPIC.js.map
