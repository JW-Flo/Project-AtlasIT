import { ac as head, ao as ensure_array_like, an as escape_html, aj as attr_class, am as attr_style, ak as stringify } from './renderer-CwxN8JkH.js';
import { B as Button } from './button-BXPyX210.js';
import { C as Card } from './card-1P6BfRcm.js';
import { B as Badge } from './badge-CdvwjGCK.js';
import { P as Page_header } from './page-header-BaRCucb6.js';
import { E as Empty_state } from './empty-state-BGCoXdYN.js';
import { E as ErrorBoundary, s as safeFetch, r as relativeTime } from './time-D6hT3Ioh.js';
import { p as push } from './toastStore-X6rW096m.js';
import { R as Refresh_cw } from './refresh-cw-Bn83BloP.js';
import { D as Database } from './database-BDhljPiU.js';
import { S as Shield_check } from './shield-check-DC5MZnbP.js';
import { A as Arrow_right } from './arrow-right-QFdd_4wx.js';
import { C as Circle_alert } from './circle-alert-CWX8Vrvc.js';
import './utils2-BgZmMgq3.js';
import './index-server-C1ubzO3x.js';
import './stores-emli2svW.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import './triangle-alert-BIxAVWgG.js';
import './Icon-DQFqITWq.js';
import './index-C1X1AO8K.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let summaryLoading = true;
    let summaryError = null;
    let summary = null;
    let evidenceLoading = true;
    let evidenceError = null;
    let evidenceItems = [];
    let evidenceNextCursor = null;
    let evidenceLoadingMore = false;
    function scoreColorClass(score) {
      if (score >= 80) return "text-success";
      if (score >= 60) return "text-warning";
      return "text-destructive";
    }
    function scoreBgClass(score) {
      if (score >= 80) return "bg-success";
      if (score >= 60) return "bg-warning";
      return "bg-destructive";
    }
    function frameworkBadge(key) {
      if (!key) return "muted";
      const map = {
        SOC2: "info",
        ISO27001: "default",
        NIST_CSF: "success",
        HIPAA: "warning",
        GDPR: "destructive"
      };
      return map[key] ?? "muted";
    }
    async function loadSummary() {
      summaryLoading = true;
      summaryError = null;
      try {
        const res = await safeFetch("/api/compliance/api/v1/compliance/summary", { context: "load compliance summary", retry: true });
        if (res.ok) {
          const result = res.data;
          if (result.data) {
            const d = result.data;
            const rawFw = d.frameworks ?? [];
            summary = {
              frameworks: rawFw.map((f) => ({
                framework: String(f.framework ?? ""),
                controlsTotal: Number(f.controlsTotal ?? f.controls_total ?? 0),
                controlsPassing: Number(f.controlsPassing ?? f.controls_passing ?? 0),
                evidenceCount: Number(f.evidenceCount ?? f.evidence_count ?? 0),
                score: Number(f.score ?? 0)
              })),
              totalEvidence: Number(d.totalEvidence ?? d.total_evidence ?? 0),
              lastUpdated: String(d.lastUpdated ?? d.last_updated ?? ""),
              hasSyntheticEvidence: Boolean(d.hasSyntheticEvidence ?? d.has_synthetic_evidence ?? false)
            };
          } else {
            summaryError = "No summary data returned";
          }
        } else {
          summaryError = res.error.actionable;
          push({
            variant: "error",
            title: "Failed to load compliance summary",
            message: res.error.actionable
          });
        }
      } catch (e) {
        summaryError = "Failed to load compliance summary. Please try again.";
        push({
          variant: "error",
          title: "Load failed",
          message: "Unable to load compliance data. Check your connection and try again."
        });
      } finally {
        summaryLoading = false;
      }
    }
    async function loadEvidence(cursor) {
      {
        evidenceLoading = true;
        evidenceError = null;
      }
      try {
        const url = cursor ? `/api/compliance/api/v1/evidence?limit=25&cursor=${encodeURIComponent(cursor)}` : "/api/compliance/api/v1/evidence?limit=25";
        const res = await safeFetch(url, { context: "load evidence", retry: true });
        if (res.ok) {
          const result = res.data;
          if (result.data) {
            const raw = result.data.items ?? [];
            const mapped = raw.map((r) => ({
              id: String(r.id ?? ""),
              framework: String(r.framework ?? ""),
              controlId: String(r.controlId ?? r.control_id ?? ""),
              controlName: String(r.controlName ?? r.control_name ?? ""),
              source: String(r.source ?? ""),
              createdAt: String(r.createdAt ?? r.created_at ?? "")
            }));
            if (cursor) ;
            else {
              evidenceItems = mapped;
            }
            evidenceNextCursor = result.data.nextCursor ?? result.data.next_cursor ?? null;
          } else {
            evidenceError = "No evidence data returned";
          }
        } else {
          evidenceError = res.error.actionable;
          if (!cursor) {
            push({
              variant: "error",
              title: "Failed to load evidence",
              message: res.error.actionable
            });
          }
        }
      } catch (e) {
        evidenceError = "Failed to load evidence. Please try again.";
        push({
          variant: "error",
          title: "Load failed",
          message: "Unable to load evidence. Check your connection and try again."
        });
      } finally {
        evidenceLoading = false;
        evidenceLoadingMore = false;
      }
    }
    function refresh() {
      loadSummary();
      loadEvidence();
    }
    head("1mo12y0", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Compliance · AtlasIT</title>`);
      });
    });
    ErrorBoundary($$renderer2, {
      onRetry: refresh,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="animate-fade-in">`);
        Page_header($$renderer3, {
          title: "Compliance",
          description: "Live framework scoring grounded in operational evidence",
          $$slots: {
            actions: ($$renderer4) => {
              {
                if (summary) {
                  $$renderer4.push("<!--[0-->");
                  Badge($$renderer4, {
                    variant: "muted",
                    size: "md",
                    children: ($$renderer5) => {
                      Database($$renderer5, { class: "h-3 w-3", strokeWidth: 2.25 });
                      $$renderer5.push(`<!----> <span class="tabular-nums">${escape_html(summary.totalEvidence.toLocaleString())}</span> evidence records`);
                    },
                    $$slots: { default: true }
                  });
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--> `);
                Button($$renderer4, {
                  variant: "outline",
                  size: "sm",
                  children: ($$renderer5) => {
                    Refresh_cw($$renderer5, { class: "h-3.5 w-3.5", strokeWidth: 2.25 });
                    $$renderer5.push(`<!----> Refresh`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!---->`);
              }
            }
          }
        });
        $$renderer3.push(`<!----> `);
        if (summary?.hasSyntheticEvidence) {
          $$renderer3.push("<!--[0-->");
          Card($$renderer3, {
            padding: "md",
            class: "mb-6 bg-info-muted border-info/20",
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex items-start gap-3">`);
              Shield_check($$renderer4, { class: "h-5 w-5 text-info shrink-0 mt-0.5", strokeWidth: 2 });
              $$renderer4.push(`<!----> <div class="flex-1"><p class="font-medium text-info">Estimated Compliance Score</p> <p class="text-sm text-muted-foreground mt-1">Your current score is based on industry benchmarks and estimated evidence.
            Connect adapters to see your actual compliance posture with real-time data.</p> <a href="/console/marketplace" class="text-sm font-medium text-info underline underline-offset-2 mt-2 inline-flex items-center gap-1.5 hover:text-info/80 transition-colors">Connect Adapters `);
              Arrow_right($$renderer4, { class: "h-3.5 w-3.5", strokeWidth: 2.25 });
              $$renderer4.push(`<!----></a></div></div>`);
            },
            $$slots: { default: true }
          });
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (summaryLoading) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8"><!--[-->`);
          const each_array = ensure_array_like(Array(5));
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            each_array[$$index];
            $$renderer3.push(`<div class="h-36 skeleton rounded-xl"></div>`);
          }
          $$renderer3.push(`<!--]--></div>`);
        } else if (summaryError) {
          $$renderer3.push("<!--[1-->");
          Card($$renderer3, {
            padding: "md",
            class: "mb-8 bg-destructive-muted border-destructive/20",
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex items-start gap-3">`);
              Circle_alert($$renderer4, {
                class: "h-5 w-5 text-destructive shrink-0 mt-0.5",
                strokeWidth: 2
              });
              $$renderer4.push(`<!----> <div class="flex-1"><p class="text-sm text-destructive font-medium">${escape_html(summaryError)}</p> `);
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
        } else if (summary && summary.frameworks.length === 0) {
          $$renderer3.push("<!--[2-->");
          Card($$renderer3, {
            padding: "lg",
            class: "mb-8",
            children: ($$renderer4) => {
              Empty_state($$renderer4, {
                title: "No framework data yet",
                description: "Install a compliance pack and connect an integration — scores appear as evidence flows in.",
                icon: Shield_check,
                $$slots: {
                  action: ($$renderer5) => {
                    {
                      Button($$renderer5, {
                        variant: "primary",
                        size: "sm",
                        href: "/console/compliance/packs",
                        children: ($$renderer6) => {
                          $$renderer6.push(`<!---->Browse packs `);
                          Arrow_right($$renderer6, { class: "h-3 w-3", strokeWidth: 2.25 });
                          $$renderer6.push(`<!---->`);
                        },
                        $$slots: { default: true }
                      });
                    }
                  }
                }
              });
            },
            $$slots: { default: true }
          });
        } else if (summary) {
          $$renderer3.push("<!--[3-->");
          $$renderer3.push(`<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8"><!--[-->`);
          const each_array_1 = ensure_array_like(summary.frameworks);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let fw = each_array_1[$$index_1];
            const passPct = fw.controlsTotal > 0 ? Math.round(fw.controlsPassing * 100 / fw.controlsTotal) : 0;
            Card($$renderer3, {
              padding: "md",
              class: "relative overflow-hidden group hover:shadow-sm hover:border-border-strong transition-all duration-fast",
              children: ($$renderer4) => {
                $$renderer4.push(`<div class="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/3 blur-2xl pointer-events-none"></div> <div class="relative"><div class="flex items-start justify-between mb-3">`);
                Badge($$renderer4, {
                  variant: frameworkBadge(fw.framework),
                  size: "md",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->${escape_html(fw.framework.replace("_", " "))}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----> <span${attr_class("h-2 w-2 rounded-full mt-1.5 " + scoreBgClass(fw.score))}></span></div> <div class="flex items-baseline gap-2 mb-3"><div${attr_class("text-5xl font-semibold tabular-nums tracking-tight " + scoreColorClass(fw.score))}>${escape_html(fw.score)}<span class="text-xl text-muted-foreground/40">%</span></div></div> <div class="text-sm text-foreground tabular-nums"><span class="font-medium">${escape_html(fw.controlsPassing)}</span> <span class="text-muted-foreground">of ${escape_html(fw.controlsTotal)} controls passing</span></div> <div class="mt-3 h-1.5 bg-muted rounded-full overflow-hidden"><div${attr_class("h-full transition-all duration-700 ease-out-quart rounded-full " + scoreBgClass(passPct))}${attr_style(`width: ${stringify(passPct)}%`)}></div></div> <div class="mt-2 text-2xs text-muted-foreground tabular-nums">${escape_html(fw.evidenceCount.toLocaleString())} evidence records</div></div>`);
              },
              $$slots: { default: true }
            });
          }
          $$renderer3.push(`<!--]--></section>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        Card($$renderer3, {
          padding: "none",
          class: "overflow-hidden",
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="px-5 py-3 border-b border-border flex items-center justify-between"><div><h2 class="text-sm font-semibold text-foreground">Recent Evidence</h2> <p class="text-2xs text-muted-foreground">Continuous stream of operational records scored against controls</p></div></div> `);
            if (evidenceLoading) {
              $$renderer4.push("<!--[0-->");
              $$renderer4.push(`<div class="divide-y divide-border"><!--[-->`);
              const each_array_2 = ensure_array_like(Array(6));
              for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
                each_array_2[$$index_2];
                $$renderer4.push(`<div class="px-5 py-3 flex gap-4 items-center"><div class="h-4 skeleton w-20"></div> <div class="h-4 skeleton w-32"></div> <div class="h-4 skeleton w-24"></div> <div class="h-4 skeleton w-16 ml-auto"></div></div>`);
              }
              $$renderer4.push(`<!--]--></div>`);
            } else if (evidenceError) {
              $$renderer4.push("<!--[1-->");
              $$renderer4.push(`<div class="p-5"><div class="flex items-start gap-3 p-3 bg-destructive-muted border border-destructive/20 rounded-lg">`);
              Circle_alert($$renderer4, {
                class: "h-4 w-4 text-destructive shrink-0 mt-0.5",
                strokeWidth: 2.25
              });
              $$renderer4.push(`<!----> <div class="flex-1"><p class="text-sm text-destructive">${escape_html(evidenceError)}</p> `);
              Button($$renderer4, {
                variant: "destructive",
                size: "sm",
                class: "mt-2",
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->Retry`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----></div></div></div>`);
            } else if (evidenceItems.length === 0) {
              $$renderer4.push("<!--[2-->");
              Empty_state($$renderer4, {
                title: "No evidence records yet",
                description: "Connect an integration and the compliance engine will start scoring its events.",
                icon: Database
              });
            } else {
              $$renderer4.push("<!--[-1-->");
              $$renderer4.push(`<div class="overflow-x-auto mobile-table-wrapper"><table class="min-w-full text-sm"><thead><tr class="bg-muted/40 border-b border-border"><th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Framework</th><th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Control</th><th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Source</th><th class="px-5 py-2.5 text-right text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Collected</th></tr></thead><tbody class="divide-y divide-border"><!--[-->`);
              const each_array_3 = ensure_array_like(evidenceItems);
              for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
                let item = each_array_3[$$index_3];
                $$renderer4.push(`<tr class="row-hover"><td class="px-5 py-2.5 whitespace-nowrap">`);
                Badge($$renderer4, {
                  variant: frameworkBadge(item.framework),
                  size: "sm",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->${escape_html((item.framework ?? "—").replace("_", " "))}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----></td><td class="px-5 py-2.5 max-w-md"><div class="flex items-center gap-1.5 min-w-0"><span class="font-mono text-xs font-medium text-foreground tabular-nums shrink-0">${escape_html(item.controlId)}</span> `);
                if (item.controlName) {
                  $$renderer4.push("<!--[0-->");
                  $$renderer4.push(`<span class="text-xs text-muted-foreground truncate">${escape_html(item.controlName)}</span>`);
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--></div></td><td class="px-5 py-2.5 whitespace-nowrap text-xs text-muted-foreground capitalize">${escape_html(item.source ?? "—")}</td><td class="px-5 py-2.5 whitespace-nowrap text-right text-2xs text-muted-foreground tabular-nums">${escape_html(relativeTime(item.createdAt))}</td></tr>`);
              }
              $$renderer4.push(`<!--]--></tbody></table></div> `);
              if (evidenceNextCursor) {
                $$renderer4.push("<!--[0-->");
                $$renderer4.push(`<div class="px-5 py-3 border-t border-border">`);
                Button($$renderer4, {
                  variant: "outline",
                  size: "sm",
                  loading: evidenceLoadingMore,
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->${escape_html(evidenceLoadingMore ? "Loading…" : "Show more")}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----></div>`);
              } else {
                $$renderer4.push("<!--[-1-->");
              }
              $$renderer4.push(`<!--]-->`);
            }
            $$renderer4.push(`<!--]-->`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----></div>`);
      },
      $$slots: { default: true }
    });
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Dj43sd9p.js.map
