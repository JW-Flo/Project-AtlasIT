import { an as escape_html, al as attr, aj as attr_class, ap as clsx, ao as ensure_array_like, ak as stringify, af as fallback, ab as store_get, ae as unsubscribe_stores, ag as bind_props, ah as sanitize_props, ai as spread_props, ad as slot } from './renderer-CwxN8JkH.js';
import { E as ErrorBoundary, s as safeFetch, r as relativeTime } from './time-D6hT3Ioh.js';
import { p as push } from './toastStore-X6rW096m.js';
import { marked } from 'marked';
import { c as cn } from './utils2-BgZmMgq3.js';
import { w as writable } from './index-C1X1AO8K.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import './index-server-C1ubzO3x.js';
import './stores-emli2svW.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import './button-BXPyX210.js';
import './card-1P6BfRcm.js';
import './triangle-alert-BIxAVWgG.js';

function Circle_question_mark($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["path", { "d": "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }],
    ["path", { "d": "M12 17h.01" }]
  ];
  Icon($$renderer, spread_props([
    { name: "circle-question-mark" },
    $$sanitized_props,
    {
      /**
       * @component @name CircleQuestionMark
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJNOS4wOSA5YTMgMyAwIDAgMSA1LjgzIDFjMCAyLTMgMy0zIDMiIC8+CiAgPHBhdGggZD0iTTEyIDE3aC4wMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/circle-question-mark
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
const preferences = writable({
  showHelpIcons: true
});
function Help_icon($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let showHelp;
    let content = $$props["content"];
    let placement = fallback($$props["placement"], "top");
    showHelp = store_get($$store_subs ??= {}, "$preferences", preferences).showHelpIcons;
    marked.parse(content, { async: false });
    if (showHelp) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button type="button" aria-label="Help"${attr_class(clsx(cn("inline-flex items-center justify-center w-4 h-4 ml-1", "text-muted-foreground hover:text-foreground", "transition-colors duration-150", "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-full")))}>`);
      Circle_question_mark($$renderer2, { class: "w-4 h-4" });
      $$renderer2.push(`<!----></button> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { content, placement });
  });
}
const helpContent = {
  automationTriggers: `Automation rules execute when specific **events** occur:
- \`user_joined_group\` — User added to directory group
- \`user_left_group\` — User removed from group
- \`user_created\` — New user provisioned
- \`user_suspended\` — User account disabled
Configure rules to auto-provision access, send notifications, or trigger workflows.`
};
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let filteredRules, enabledCount, disabledCount;
    let rules = [];
    let stats = null;
    let rulesLoading = true;
    let rulesError = null;
    let activeTab = "rules";
    let search = "";
    let expandedRuleId = null;
    const API_BASE = "/orchestrator/api/v1";
    async function loadRules() {
      rulesLoading = true;
      rulesError = null;
      try {
        const [rulesRes, statsRes] = await Promise.all([
          safeFetch(`${API_BASE}/automation/rules`, { context: "load automation rules", retry: true }),
          safeFetch(`${API_BASE}/automation/stats`, { context: "load automation stats" })
        ]);
        if (rulesRes.ok) {
          const rulesJson = rulesRes.data;
          rules = rulesJson.data ?? [];
        } else {
          rulesError = rulesRes.error.actionable;
          push({
            variant: "error",
            title: "Failed to load rules",
            message: rulesRes.error.actionable
          });
        }
        if (statsRes.ok) {
          const statsJson = statsRes.data;
          stats = statsJson.data?.summary ?? null;
        }
      } catch (e) {
        rulesError = "Failed to load automation rules. Please try again.";
        push({
          variant: "error",
          title: "Load failed",
          message: "Unable to load automation data. Check your connection and try again."
        });
      } finally {
        rulesLoading = false;
      }
    }
    function statusBadgeClass(s) {
      if (s === "completed" || s === "success") return "bg-success-muted text-success";
      if (s === "failed" || s === "error") return "bg-destructive-muted text-destructive";
      if (s === "running") return "bg-info-muted text-info";
      if (s === "pending") return "bg-warning-muted text-warning";
      return "bg-muted text-muted-foreground";
    }
    const th = "px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider";
    function tabCls(t) {
      return "pb-3 text-sm font-medium border-b-2 transition-colors " + (activeTab === t ? "border-blue-600 text-primary" : "border-transparent text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300");
    }
    filteredRules = rules.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
    enabledCount = rules.filter((r) => r.enabled).length;
    disabledCount = rules.filter((r) => !r.enabled).length;
    ErrorBoundary($$renderer2, {
      onRetry: loadRules,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="animate-fade-in" data-tour="automation-rules"><div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 class="text-3xl font-bold text-foreground">Automation</h1> <div class="mt-2 flex gap-2 flex-wrap"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">${escape_html(stats?.total_rules ?? rules.length)} total</span> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-muted text-success">${escape_html(enabledCount)} enabled</span> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-muted-foreground/70">${escape_html(disabledCount)} disabled</span></div></div> <div class="flex gap-3 items-center"><input type="search"${attr("value", search)} placeholder="Search rules..." class="px-3 py-2 text-sm border border-input rounded-md bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary w-48"/> <button class="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-md transition-colors">${escape_html("New Rule")}</button></div></div> `);
        {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <div class="mb-6 border-b border-border"><nav class="-mb-px flex gap-6"><button${attr_class(clsx(tabCls("rules")))}>Rules</button> <button${attr_class(clsx(tabCls("runs")))}>Runs</button></nav></div> `);
        {
          $$renderer3.push("<!--[0-->");
          if (rulesLoading) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="space-y-2"><!--[-->`);
            const each_array_1 = ensure_array_like(Array(6));
            for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
              each_array_1[$$index_1];
              $$renderer3.push(`<div class="h-14 bg-muted rounded-lg animate-pulse"></div>`);
            }
            $$renderer3.push(`<!--]--></div>`);
          } else if (rulesError) {
            $$renderer3.push("<!--[1-->");
            $$renderer3.push(`<div class="bg-destructive-muted border border-destructive/20 rounded-lg p-4"><p class="text-destructive">${escape_html(rulesError)}</p> <button class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md">Retry</button></div>`);
          } else if (filteredRules.length === 0) {
            $$renderer3.push("<!--[2-->");
            $$renderer3.push(`<div class="bg-card border border-border rounded-lg p-10 text-center"><p class="text-muted-foreground">${escape_html("No automation rules yet. Create one above.")}</p></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<div class="bg-card border border-border rounded-lg overflow-hidden"><table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead class="bg-background"><tr><th${attr_class(`${stringify(th)} text-left`)}>Name</th><th${attr_class(`${stringify(th)} text-left hidden sm:table-cell`)}><span class="inline-flex items-center">Trigger `);
            Help_icon($$renderer3, { content: helpContent.automationTriggers });
            $$renderer3.push(`<!----></span></th><th${attr_class(`${stringify(th)} text-center`)}>Enabled</th><th${attr_class(`${stringify(th)} text-right hidden md:table-cell`)}>Runs</th><th${attr_class(`${stringify(th)} text-left hidden lg:table-cell`)}>Last Run</th><th${attr_class(`${stringify(th)} text-right`)}>Actions</th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
            const each_array_2 = ensure_array_like(filteredRules);
            for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
              let rule = each_array_2[$$index_2];
              $$renderer3.push(`<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"><td class="px-4 py-3"><div class="font-medium text-foreground text-sm">${escape_html(rule.name)}</div> `);
              if (rule.description) {
                $$renderer3.push("<!--[0-->");
                $$renderer3.push(`<div class="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">${escape_html(rule.description)}</div>`);
              } else {
                $$renderer3.push("<!--[-1-->");
              }
              $$renderer3.push(`<!--]--></td><td class="px-4 py-3 hidden sm:table-cell"><span class="text-xs font-mono text-gray-600 dark:text-muted-foreground/70">${escape_html(rule.trigger_type)}</span></td><td class="px-4 py-3 text-center"><button${attr("aria-label", `${stringify(rule.enabled ? "Disable" : "Enable")} ${stringify(rule.name)}`)}${attr_class(`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${stringify(rule.enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600")}`)}><span${attr_class(`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${stringify(rule.enabled ? "translate-x-4" : "translate-x-1")}`)}></span></button></td><td class="px-4 py-3 text-right hidden md:table-cell"><span class="text-sm text-foreground">${escape_html(rule.run_count)}</span> `);
              if (rule.error_count > 0) {
                $$renderer3.push("<!--[0-->");
                $$renderer3.push(`<span class="ml-1 text-xs text-destructive">${escape_html(rule.error_count)} err</span>`);
              } else {
                $$renderer3.push("<!--[-1-->");
              }
              $$renderer3.push(`<!--]--></td><td class="px-4 py-3 hidden lg:table-cell">`);
              if (rule.last_run_at) {
                $$renderer3.push("<!--[0-->");
                $$renderer3.push(`<div class="text-xs text-muted-foreground">${escape_html(relativeTime(rule.last_run_at))}</div> `);
                if (rule.last_status) {
                  $$renderer3.push("<!--[0-->");
                  $$renderer3.push(`<span${attr_class(`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${stringify(statusBadgeClass(rule.last_status))}`)}>${escape_html(rule.last_status)}</span>`);
                } else {
                  $$renderer3.push("<!--[-1-->");
                }
                $$renderer3.push(`<!--]-->`);
              } else {
                $$renderer3.push("<!--[-1-->");
                $$renderer3.push(`<span class="text-xs text-muted-foreground/70">Never</span>`);
              }
              $$renderer3.push(`<!--]--></td><td class="px-4 py-3 text-right"><div class="flex items-center justify-end gap-2"><button class="px-2.5 py-1 text-xs font-medium text-primary border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">View</button> <button class="px-2.5 py-1 text-xs font-medium text-destructive border border-red-300 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete</button></div></td></tr> `);
              if (expandedRuleId === rule.id) {
                $$renderer3.push("<!--[0-->");
                $$renderer3.push(`<tr class="bg-background/50"><td colspan="6" class="px-6 py-3 text-xs text-gray-600 dark:text-muted-foreground/70 space-y-0.5"><div><span class="font-medium">ID:</span> <span class="font-mono">${escape_html(rule.id)}</span></div> <div><span class="font-medium">Trigger:</span> <span class="font-mono">${escape_html(rule.trigger_type)}</span></div> <div><span class="font-medium">Runs:</span> ${escape_html(rule.run_count)} total, ${escape_html(rule.error_count)} errors · Created ${escape_html(relativeTime(rule.created_at))}</div> `);
                if (rule.description) {
                  $$renderer3.push("<!--[0-->");
                  $$renderer3.push(`<div><span class="font-medium">Description:</span> ${escape_html(rule.description)}</div>`);
                } else {
                  $$renderer3.push("<!--[-1-->");
                }
                $$renderer3.push(`<!--]--></td></tr>`);
              } else {
                $$renderer3.push("<!--[-1-->");
              }
              $$renderer3.push(`<!--]-->`);
            }
            $$renderer3.push(`<!--]--></tbody></table></div>`);
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--> `);
        {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></div>`);
      },
      $$slots: { default: true }
    });
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-csC0Ne_D.js.map
