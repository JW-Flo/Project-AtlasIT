import { ao as ensure_array_like, an as escape_html } from './renderer-CwxN8JkH.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_header } from './card-header-DkXf0dG2.js';
import { C as Card_title } from './card-title-CntIWcKQ.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { I as Input } from './input-JvKuIRs1.js';
import { L as Label } from './label-C8HvX4HJ.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import { P as Plus } from './plus-DyzDQ7SN.js';
import './utils2-BgZmMgq3.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let form = { title: "", severity: "medium", source: "" };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="space-y-6"><h1 class="text-2xl font-semibold tracking-tight">Incidents</h1> `);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Card_header($$renderer4, {
            children: ($$renderer5) => {
              Card_title($$renderer5, {
                class: "text-base",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Create Incident`);
                },
                $$slots: { default: true }
              });
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          Card_content($$renderer4, {
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="flex gap-3 flex-wrap items-end"><div class="flex flex-col gap-1.5">`);
              Label($$renderer5, {
                htmlFor: "inc-title",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Title *`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Input($$renderer5, {
                id: "inc-title",
                placeholder: "Incident title",
                get value() {
                  return form.title;
                },
                set value($$value) {
                  form.title = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!----> `);
              {
                $$renderer5.push("<!--[-1-->");
              }
              $$renderer5.push(`<!--]--></div> <div class="flex flex-col gap-1.5">`);
              Label($$renderer5, {
                htmlFor: "inc-severity",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Severity`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              $$renderer5.select(
                {
                  id: "inc-severity",
                  class: "flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  value: form.severity
                },
                ($$renderer6) => {
                  $$renderer6.option({ value: "low" }, ($$renderer7) => {
                    $$renderer7.push(`Low`);
                  });
                  $$renderer6.option({ value: "medium" }, ($$renderer7) => {
                    $$renderer7.push(`Medium`);
                  });
                  $$renderer6.option({ value: "high" }, ($$renderer7) => {
                    $$renderer7.push(`High`);
                  });
                  $$renderer6.option({ value: "critical" }, ($$renderer7) => {
                    $$renderer7.push(`Critical`);
                  });
                }
              );
              $$renderer5.push(`</div> <div class="flex flex-col gap-1.5">`);
              Label($$renderer5, {
                htmlFor: "inc-source",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Source`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Input($$renderer5, {
                id: "inc-source",
                placeholder: "Optional",
                get value() {
                  return form.source;
                },
                set value($$value) {
                  form.source = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!----></div> `);
              Button($$renderer5, {
                disabled: !form.title,
                children: ($$renderer6) => {
                  Plus($$renderer6, { class: "h-4 w-4 mr-1" });
                  $$renderer6.push(`<!----> ${escape_html("Create")}`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----></div>`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="space-y-3"><!--[-->`);
        const each_array = ensure_array_like([1, 2, 3]);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          each_array[$$index];
          Skeleton($$renderer3, { class: "h-12 rounded-lg" });
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
//# sourceMappingURL=_page.svelte-CRs5lgby.js.map
