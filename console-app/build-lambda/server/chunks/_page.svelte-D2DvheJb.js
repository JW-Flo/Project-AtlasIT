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
    const JUSTIFICATION_OPTIONS = [
      "Business need",
      "Temporary access for project",
      "Compliance requirement",
      "Incident response",
      "Role change / promotion",
      "Other"
    ];
    let form = {
      subjectRef: "",
      resource: "",
      justification: "",
      roleRequested: ""
    };
    let submitting = false;
    let connectedApps = [];
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="space-y-6"><h1 class="text-2xl font-semibold tracking-tight">Access Requests</h1> `);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Card_header($$renderer4, {
            children: ($$renderer5) => {
              Card_title($$renderer5, {
                class: "text-base",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->New Access Request`);
                },
                $$slots: { default: true }
              });
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          Card_content($$renderer4, {
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-end"><div class="flex flex-col gap-1.5">`);
              Label($$renderer5, {
                htmlFor: "ar-subject",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Subject Ref *`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Input($$renderer5, {
                id: "ar-subject",
                placeholder: "user@company.com",
                get value() {
                  return form.subjectRef;
                },
                set value($$value) {
                  form.subjectRef = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!----></div> <div class="flex flex-col gap-1.5">`);
              Label($$renderer5, {
                htmlFor: "ar-resource",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Application *`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              $$renderer5.select(
                {
                  id: "ar-resource",
                  value: form.resource,
                  class: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                },
                ($$renderer6) => {
                  $$renderer6.option({ value: "" }, ($$renderer7) => {
                    $$renderer7.push(`Select application...`);
                  });
                  $$renderer6.push(`<!--[-->`);
                  const each_array = ensure_array_like(connectedApps);
                  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                    let app = each_array[$$index];
                    $$renderer6.option({ value: app.id }, ($$renderer7) => {
                      $$renderer7.push(`${escape_html(app.id)}`);
                    });
                  }
                  $$renderer6.push(`<!--]-->`);
                }
              );
              $$renderer5.push(`</div> <div class="flex flex-col gap-1.5">`);
              Label($$renderer5, {
                htmlFor: "ar-role",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Role Requested`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Input($$renderer5, {
                id: "ar-role",
                placeholder: "e.g. Admin, Viewer, Editor",
                get value() {
                  return form.roleRequested;
                },
                set value($$value) {
                  form.roleRequested = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!----></div> <div class="flex flex-col gap-1.5">`);
              Label($$renderer5, {
                htmlFor: "ar-justification",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Justification`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              $$renderer5.select(
                {
                  id: "ar-justification",
                  value: form.justification,
                  class: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                },
                ($$renderer6) => {
                  $$renderer6.option({ value: "" }, ($$renderer7) => {
                    $$renderer7.push(`Select justification...`);
                  });
                  $$renderer6.push(`<!--[-->`);
                  const each_array_1 = ensure_array_like(JUSTIFICATION_OPTIONS);
                  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                    let option = each_array_1[$$index_1];
                    $$renderer6.option({ value: option }, ($$renderer7) => {
                      $$renderer7.push(`${escape_html(option)}`);
                    });
                  }
                  $$renderer6.push(`<!--]-->`);
                }
              );
              $$renderer5.push(`</div> `);
              Button($$renderer5, {
                disabled: submitting,
                children: ($$renderer6) => {
                  Plus($$renderer6, { class: "h-4 w-4 mr-1" });
                  $$renderer6.push(`<!----> ${escape_html("+ Create")}`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----></div> `);
              {
                $$renderer5.push("<!--[-1-->");
              }
              $$renderer5.push(`<!--]-->`);
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
        const each_array_2 = ensure_array_like([1, 2, 3]);
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          each_array_2[$$index_2];
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
//# sourceMappingURL=_page.svelte-D2DvheJb.js.map
