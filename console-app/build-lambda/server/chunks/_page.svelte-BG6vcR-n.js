import { ac as head, aj as attr_class, ak as stringify, an as escape_html, al as attr, ah as sanitize_props, ai as spread_props, ad as slot } from './renderer-CwxN8JkH.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { I as Input } from './input-JvKuIRs1.js';
import { L as Label } from './label-C8HvX4HJ.js';
import { A as Arrow_right } from './arrow-right-QFdd_4wx.js';
import { F as File_text } from './file-text-ONGDnfqP.js';
import { P as Puzzle } from './puzzle-YzdexiB9.js';
import { A as Activity } from './activity-BZT1Fpfp.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import { C as Clock } from './clock-DtsFhFWK.js';
import { S as Send } from './send-BSqYoF4I.js';
import './utils2-BgZmMgq3.js';

function Mail($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" }],
    [
      "rect",
      { "x": "2", "y": "4", "width": "20", "height": "16", "rx": "2" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "mail" },
    $$sanitized_props,
    {
      /**
       * @component @name Mail
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMjIgNy04Ljk5MSA1LjcyN2EyIDIgMCAwIDEtMi4wMDkgMEwyIDciIC8+CiAgPHJlY3QgeD0iMiIgeT0iNCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjE2IiByeD0iMiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/mail
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
function Monitor($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "rect",
      { "width": "20", "height": "14", "x": "2", "y": "3", "rx": "2" }
    ],
    ["line", { "x1": "8", "x2": "16", "y1": "21", "y2": "21" }],
    ["line", { "x1": "12", "x2": "12", "y1": "17", "y2": "21" }]
  ];
  Icon($$renderer, spread_props([
    { name: "monitor" },
    $$sanitized_props,
    {
      /**
       * @component @name Monitor
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMTQiIHg9IjIiIHk9IjMiIHJ4PSIyIiAvPgogIDxsaW5lIHgxPSI4IiB4Mj0iMTYiIHkxPSIyMSIgeTI9IjIxIiAvPgogIDxsaW5lIHgxPSIxMiIgeDI9IjEyIiB5MT0iMTciIHkyPSIyMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/monitor
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
    let statusClasses, statusDotClasses;
    let statusLevel = "loading";
    let statusText = "Checking system status…";
    let formName = "";
    let formEmail = "";
    let formCategory = "general";
    let formMessage = "";
    let formState = "idle";
    statusClasses = {
      loading: "bg-muted/50 border-border text-muted-foreground",
      operational: "bg-success/10 border-success/30 text-success",
      degraded: "bg-warning/10 border-warning/30 text-warning-foreground",
      outage: "bg-destructive/10 border-destructive/30 text-destructive"
    }[statusLevel];
    statusDotClasses = {
      loading: "bg-muted-foreground animate-pulse",
      operational: "bg-success animate-pulse",
      degraded: "bg-warning animate-pulse",
      outage: "bg-destructive"
    }[statusLevel];
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("a766rq", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>Support — AtlasIT</title>`);
        });
        $$renderer4.push(`<meta name="description" content="Get help with AtlasIT — AI-powered IT management for SMBs. Documentation, status, and direct support channels."/>`);
      });
      $$renderer3.push(`<div class="min-h-dvh bg-background text-foreground flex flex-col"><nav class="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md"><div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between"><a href="https://atlasit.pro" class="flex items-center gap-2.5 no-underline text-foreground hover:opacity-80 transition-opacity"><div class="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0"><span class="text-primary-foreground font-bold text-sm">A</span></div> <span class="font-semibold text-base tracking-tight">AtlasIT</span></a> <ul class="flex items-center gap-6 list-none m-0 p-0"><li><a href="https://docs.atlasit.pro" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors no-underline">Docs</a></li> <li><a href="/support" aria-current="page" class="text-sm font-medium text-foreground no-underline">Support</a></li> <li><a href="https://status.atlasit.pro" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors no-underline">Status</a></li> <li>`);
      Button($$renderer3, {
        href: "/console/login",
        size: "sm",
        children: ($$renderer4) => {
          $$renderer4.push(`<!---->Console Login`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></li></ul></div></nav> <section class="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center w-full"><h1 class="text-4xl font-bold tracking-tight leading-tight">How can we help?</h1> <p class="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">Documentation, system status, and direct access to the AtlasIT team.</p></section> <div class="max-w-5xl mx-auto px-6 pb-10 w-full"><div${attr_class(`rounded-xl border px-5 py-3.5 flex items-center gap-3 text-sm font-medium ${stringify(statusClasses)}`)}><span${attr_class(`w-2 h-2 rounded-full shrink-0 ${stringify(statusDotClasses)}`)}></span> <span>${escape_html(statusText)}</span> <a href="https://status.atlasit.pro" class="ml-auto text-xs font-semibold opacity-75 hover:opacity-100 transition-opacity no-underline text-inherit">View status page `);
      Arrow_right($$renderer3, { class: "inline h-3 w-3 ml-0.5" });
      $$renderer3.push(`<!----></a></div></div> <div class="max-w-5xl mx-auto px-6 pb-16 w-full"><div class="grid grid-cols-1 sm:grid-cols-3 gap-5"><a href="https://docs.atlasit.pro" class="no-underline text-inherit group">`);
      Card($$renderer3, {
        class: "h-full transition-colors hover:border-primary/40 cursor-pointer",
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "pt-7 pb-6 px-7 flex flex-col h-full",
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5 shrink-0">`);
              File_text($$renderer5, { class: "h-5 w-5 text-primary" });
              $$renderer5.push(`<!----></div> <h3 class="text-base font-semibold tracking-tight mb-1.5">Documentation</h3> <p class="text-sm text-muted-foreground leading-relaxed flex-1">Setup guides, API reference, connector configuration, and workflow authoring for the AtlasIT platform.</p> <div class="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">Browse docs `);
              Arrow_right($$renderer5, {
                class: "h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              });
              $$renderer5.push(`<!----></div>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></a> <a href="https://docs.atlasit.pro/integrations" class="no-underline text-inherit group">`);
      Card($$renderer3, {
        class: "h-full transition-colors hover:border-primary/40 cursor-pointer",
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "pt-7 pb-6 px-7 flex flex-col h-full",
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center mb-5 shrink-0">`);
              Puzzle($$renderer5, { class: "h-5 w-5 text-success" });
              $$renderer5.push(`<!----></div> <h3 class="text-base font-semibold tracking-tight mb-1.5">Integration guides</h3> <p class="text-sm text-muted-foreground leading-relaxed flex-1">Step-by-step setup for Okta, Google Workspace, Slack, AWS, and other supported connectors.</p> <div class="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">View integrations `);
              Arrow_right($$renderer5, {
                class: "h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              });
              $$renderer5.push(`<!----></div>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></a> <a href="https://status.atlasit.pro" class="no-underline text-inherit group">`);
      Card($$renderer3, {
        class: "h-full transition-colors hover:border-primary/40 cursor-pointer",
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "pt-7 pb-6 px-7 flex flex-col h-full",
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center mb-5 shrink-0">`);
              Activity($$renderer5, { class: "h-5 w-5 text-warning-foreground" });
              $$renderer5.push(`<!----></div> <h3 class="text-base font-semibold tracking-tight mb-1.5">System status</h3> <p class="text-sm text-muted-foreground leading-relaxed flex-1">Real-time availability for the AtlasIT control plane, connectors, and workflow execution engine.</p> <div class="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">Check status `);
              Arrow_right($$renderer5, {
                class: "h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              });
              $$renderer5.push(`<!----></div>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></a></div></div> <section class="max-w-5xl mx-auto px-6 pb-20 w-full">`);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "p-0",
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="grid grid-cols-1 md:grid-cols-2"><div class="p-10 border-b md:border-b-0 md:border-r"><h2 class="text-xl font-bold tracking-tight mb-3">Contact support</h2> <p class="text-sm text-muted-foreground mb-8 leading-relaxed">For account issues, integration troubleshooting, or anything the docs don't cover — reach us directly.</p> <div class="space-y-5"><div class="flex items-center gap-3"><div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">`);
              Mail($$renderer5, { class: "h-3.5 w-3.5 text-primary" });
              $$renderer5.push(`<!----></div> <div><div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Email</div> <a href="mailto:support@atlasit.pro" class="text-sm text-foreground hover:text-primary transition-colors no-underline">support@atlasit.pro</a></div></div> <div class="flex items-center gap-3"><div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">`);
              Clock($$renderer5, { class: "h-3.5 w-3.5 text-primary" });
              $$renderer5.push(`<!----></div> <div><div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Response time</div> <span class="text-sm text-foreground">Business-critical: &lt; 4 hours · General: &lt; 24 hours</span></div></div> <div class="flex items-center gap-3"><div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">`);
              Monitor($$renderer5, { class: "h-3.5 w-3.5 text-primary" });
              $$renderer5.push(`<!----></div> <div><div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Hours</div> <span class="text-sm text-foreground">Mon–Fri, 8 AM – 8 PM CT</span></div></div></div></div> <div class="p-10">`);
              {
                $$renderer5.push("<!--[-1-->");
                $$renderer5.push(`<form class="flex flex-col gap-4"><div class="grid grid-cols-2 gap-3"><div class="flex flex-col gap-1.5">`);
                Label($$renderer5, {
                  htmlFor: "name",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Name`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Input($$renderer5, {
                  id: "name",
                  type: "text",
                  placeholder: "Your name",
                  disabled: formState === "submitting",
                  get value() {
                    return formName;
                  },
                  set value($$value) {
                    formName = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----></div> <div class="flex flex-col gap-1.5">`);
                Label($$renderer5, {
                  htmlFor: "email",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Email`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Input($$renderer5, {
                  id: "email",
                  type: "email",
                  placeholder: "you@company.com",
                  disabled: formState === "submitting",
                  get value() {
                    return formEmail;
                  },
                  set value($$value) {
                    formEmail = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----></div></div> <div class="flex flex-col gap-1.5">`);
                Label($$renderer5, {
                  htmlFor: "category",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Category`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                $$renderer5.select(
                  {
                    id: "category",
                    value: formCategory,
                    disabled: formState === "submitting",
                    class: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  },
                  ($$renderer6) => {
                    $$renderer6.option({ value: "general" }, ($$renderer7) => {
                      $$renderer7.push(`General inquiry`);
                    });
                    $$renderer6.option({ value: "integration" }, ($$renderer7) => {
                      $$renderer7.push(`Integration setup`);
                    });
                    $$renderer6.option({ value: "account" }, ($$renderer7) => {
                      $$renderer7.push(`Account &amp; billing`);
                    });
                    $$renderer6.option({ value: "incident" }, ($$renderer7) => {
                      $$renderer7.push(`Incident / outage`);
                    });
                    $$renderer6.option({ value: "security" }, ($$renderer7) => {
                      $$renderer7.push(`Security concern`);
                    });
                    $$renderer6.option({ value: "feature" }, ($$renderer7) => {
                      $$renderer7.push(`Feature request`);
                    });
                  }
                );
                $$renderer5.push(`</div> <div class="flex flex-col gap-1.5">`);
                Label($$renderer5, {
                  htmlFor: "message",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Message`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> <textarea id="message" placeholder="Describe your issue or question…"${attr("disabled", formState === "submitting", true)} rows="5" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[100px]">`);
                const $$body = escape_html(formMessage);
                if ($$body) {
                  $$renderer5.push(`${$$body}`);
                }
                $$renderer5.push(`</textarea></div> `);
                {
                  $$renderer5.push("<!--[-1-->");
                }
                $$renderer5.push(`<!--]--> <div>`);
                Button($$renderer5, {
                  type: "submit",
                  disabled: formState === "submitting",
                  class: "gap-1.5",
                  children: ($$renderer6) => {
                    {
                      $$renderer6.push("<!--[-1-->");
                      $$renderer6.push(`Send message `);
                      Send($$renderer6, { class: "h-3.5 w-3.5" });
                      $$renderer6.push(`<!---->`);
                    }
                    $$renderer6.push(`<!--]-->`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----></div></form>`);
              }
              $$renderer5.push(`<!--]--></div></div>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></section> <footer class="mt-auto border-t py-6 px-6 text-center text-xs text-muted-foreground">© 2026 AtlasIT · <a href="/privacy" class="text-muted-foreground hover:text-foreground transition-colors no-underline">Privacy</a> · <a href="/privacy/dsar" class="text-muted-foreground hover:text-foreground transition-colors no-underline">Data requests</a> · <a href="/terms" class="text-muted-foreground hover:text-foreground transition-colors no-underline">Terms</a> · <a href="https://status.atlasit.pro" class="text-muted-foreground hover:text-foreground transition-colors no-underline">Status</a></footer></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BG6vcR-n.js.map
