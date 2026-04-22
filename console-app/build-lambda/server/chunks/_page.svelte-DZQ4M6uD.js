import { ao as ensure_array_like, an as escape_html, al as attr } from './renderer-CwxN8JkH.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { I as Input } from './input-JvKuIRs1.js';
import { L as Label } from './label-C8HvX4HJ.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import './utils2-BgZmMgq3.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let summary = {
      totalEvidence: 0,
      frameworksCovered: 0,
      controlsCovered: 0,
      positiveCount: 0,
      detrimentalCount: 0
    };
    let FRAMEWORKS = [];
    const CATEGORIES = [
      "access_grant",
      "access_revoke",
      "onboarding",
      "offboarding",
      "policy_change",
      "config_change",
      "adapter_pull",
      "incident",
      "review_complete",
      "mfa_enforcement",
      "sso_enforcement"
    ];
    let framework = "";
    let controlId = "";
    let category = "";
    let impact = "all";
    let since = "";
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="space-y-6"><div><a href="/console/compliance" class="text-sm text-primary hover:underline">← Back to Compliance</a> <h1 class="text-2xl font-semibold tracking-tight">Evidence Activity Feed</h1> <p class="text-sm text-muted-foreground">Lifecycle operations mapped to compliance controls with evidence impact.</p></div> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">`);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "pt-5",
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="text-sm text-muted-foreground">Total Evidence</div><div class="text-2xl font-bold mt-1">${escape_html(summary.totalEvidence)}</div>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "pt-5",
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="text-sm text-muted-foreground">Frameworks Covered</div><div class="text-2xl font-bold mt-1">${escape_html(summary.frameworksCovered)}</div>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "pt-5",
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="text-sm text-muted-foreground">Controls Covered</div><div class="text-2xl font-bold mt-1">${escape_html(summary.controlsCovered)}</div>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "pt-5",
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="text-sm text-muted-foreground">Positive Events</div><div class="text-2xl font-bold mt-1 text-success">${escape_html(summary.positiveCount)}</div>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "pt-5",
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="text-sm text-muted-foreground">Detrimental Events</div><div class="text-2xl font-bold mt-1 text-destructive">${escape_html(summary.detrimentalCount)}</div>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></div> `);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "pt-5",
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="grid gap-3 md:grid-cols-3 lg:grid-cols-6"><div class="space-y-1.5">`);
              Label($$renderer5, {
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Framework`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              $$renderer5.select(
                {
                  value: framework,
                  class: "h-10 rounded-md border border-input bg-background px-3 text-sm w-full"
                },
                ($$renderer6) => {
                  $$renderer6.option({ value: "" }, ($$renderer7) => {
                    $$renderer7.push(`All Frameworks`);
                  });
                  $$renderer6.push(`<!--[-->`);
                  const each_array = ensure_array_like(FRAMEWORKS);
                  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                    let fw = each_array[$$index];
                    $$renderer6.option({ value: fw }, ($$renderer7) => {
                      $$renderer7.push(`${escape_html(fw)}`);
                    });
                  }
                  $$renderer6.push(`<!--]-->`);
                }
              );
              $$renderer5.push(`</div> <div class="space-y-1.5">`);
              Label($$renderer5, {
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Control ID`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Input($$renderer5, {
                placeholder: "e.g. CC6.1",
                get value() {
                  return controlId;
                },
                set value($$value) {
                  controlId = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!----></div> <div class="space-y-1.5">`);
              Label($$renderer5, {
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Category`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              $$renderer5.select(
                {
                  value: category,
                  class: "h-10 rounded-md border border-input bg-background px-3 text-sm w-full"
                },
                ($$renderer6) => {
                  $$renderer6.option({ value: "" }, ($$renderer7) => {
                    $$renderer7.push(`All Categories`);
                  });
                  $$renderer6.push(`<!--[-->`);
                  const each_array_1 = ensure_array_like(CATEGORIES);
                  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                    let cat = each_array_1[$$index_1];
                    $$renderer6.option({ value: cat }, ($$renderer7) => {
                      $$renderer7.push(`${escape_html(cat.replace(/_/g, " "))}`);
                    });
                  }
                  $$renderer6.push(`<!--]-->`);
                }
              );
              $$renderer5.push(`</div> <div class="space-y-1.5">`);
              Label($$renderer5, {
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Impact`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              $$renderer5.select(
                {
                  value: impact,
                  class: "h-10 rounded-md border border-input bg-background px-3 text-sm w-full"
                },
                ($$renderer6) => {
                  $$renderer6.option({ value: "all" }, ($$renderer7) => {
                    $$renderer7.push(`All`);
                  });
                  $$renderer6.option({ value: "positive" }, ($$renderer7) => {
                    $$renderer7.push(`Positive`);
                  });
                  $$renderer6.option({ value: "detrimental" }, ($$renderer7) => {
                    $$renderer7.push(`Detrimental`);
                  });
                  $$renderer6.option({ value: "neutral" }, ($$renderer7) => {
                    $$renderer7.push(`Neutral`);
                  });
                }
              );
              $$renderer5.push(`</div> <div class="space-y-1.5">`);
              Label($$renderer5, {
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Since`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> <input type="date"${attr("value", since)} class="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"/></div> <div class="flex items-end gap-2">`);
              Button($$renderer5, {
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Apply`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Button($$renderer5, {
                variant: "outline",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Reset`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----></div></div>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="space-y-3"><!--[-->`);
        const each_array_2 = ensure_array_like([1, 2, 3]);
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          each_array_2[$$index_2];
          Skeleton($$renderer3, { class: "h-16 rounded-lg" });
        }
        $$renderer3.push(`<!--]--></div>`);
      }
      $$renderer3.push(`<!--]--></div>`);
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
//# sourceMappingURL=_page.svelte-DZQ4M6uD.js.map
