import { ac as head, ao as ensure_array_like, aj as attr_class, ak as stringify, al as attr, an as escape_html } from './renderer-CwxN8JkH.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { I as Input } from './input-JvKuIRs1.js';
import { L as Label } from './label-C8HvX4HJ.js';
import { A as Arrow_left } from './arrow-left-26Np_Hiw.js';
import { S as Shield_check } from './shield-check-DC5MZnbP.js';
import { S as Send } from './send-BSqYoF4I.js';
import './utils2-BgZmMgq3.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let formName = "";
    let formEmail = "";
    let formOrganization = "";
    let formRequestType = "access";
    let formDetails = "";
    let formState = "idle";
    const requestTypes = [
      {
        value: "access",
        label: "Access my personal data",
        desc: "Receive a copy of all personal data we hold about you"
      },
      {
        value: "deletion",
        label: "Delete my personal data",
        desc: "Request permanent deletion of your data from our systems"
      },
      {
        value: "correction",
        label: "Correct inaccurate data",
        desc: "Update or correct personal information we hold"
      },
      {
        value: "portability",
        label: "Export / transfer my data",
        desc: "Receive your data in a portable, machine-readable format"
      },
      {
        value: "restriction",
        label: "Restrict processing",
        desc: "Limit how we process your personal data"
      },
      {
        value: "objection",
        label: "Object to processing",
        desc: "Object to specific types of data processing"
      }
    ];
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("y5s2l2", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>Data Privacy Request — AtlasIT</title>`);
        });
        $$renderer4.push(`<meta name="description" content="Submit a data subject access request (DSAR) to exercise your privacy rights under GDPR, CCPA, and other regulations."/>`);
      });
      $$renderer3.push(`<div class="min-h-screen bg-background text-foreground"><div class="max-w-3xl mx-auto px-4 py-12"><a href="/privacy" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">`);
      Arrow_left($$renderer3, { class: "h-4 w-4" });
      $$renderer3.push(`<!----> Privacy Policy</a> <div class="flex items-center gap-3 mb-2"><div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">`);
      Shield_check($$renderer3, { class: "h-5 w-5 text-primary" });
      $$renderer3.push(`<!----></div> <h1 class="text-3xl font-bold">Data Privacy Request</h1></div> <p class="text-sm text-muted-foreground mb-10 ml-[52px]">Exercise your data privacy rights under GDPR, CCPA, and other applicable regulations.
      We will respond within 30 days of receiving your request.</p> `);
      {
        $$renderer3.push("<!--[-1-->");
        Card($$renderer3, {
          children: ($$renderer4) => {
            Card_content($$renderer4, {
              class: "p-8",
              children: ($$renderer5) => {
                $$renderer5.push(`<form class="space-y-6"><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="flex flex-col gap-1.5">`);
                Label($$renderer5, {
                  htmlFor: "dsar-name",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Full name *`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Input($$renderer5, {
                  id: "dsar-name",
                  type: "text",
                  placeholder: "Your legal name",
                  disabled: formState === "submitting",
                  required: true,
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
                  htmlFor: "dsar-email",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Email address *`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Input($$renderer5, {
                  id: "dsar-email",
                  type: "email",
                  placeholder: "you@example.com",
                  disabled: formState === "submitting",
                  required: true,
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
                  htmlFor: "dsar-org",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Organization (optional)`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Input($$renderer5, {
                  id: "dsar-org",
                  type: "text",
                  placeholder: "Company or tenant name",
                  disabled: formState === "submitting",
                  get value() {
                    return formOrganization;
                  },
                  set value($$value) {
                    formOrganization = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----></div> <div class="flex flex-col gap-2">`);
                Label($$renderer5, {
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Request type *`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> <div class="grid grid-cols-1 sm:grid-cols-2 gap-2"><!--[-->`);
                const each_array = ensure_array_like(requestTypes);
                for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                  let rt = each_array[$$index];
                  $$renderer5.push(`<label${attr_class(`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${stringify(formRequestType === rt.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30")}`)}><input type="radio" name="requestType"${attr("value", rt.value)}${attr("checked", formRequestType === rt.value, true)}${attr("disabled", formState === "submitting", true)} class="mt-0.5"/> <div><div class="text-sm font-medium">${escape_html(rt.label)}</div> <div class="text-xs text-muted-foreground mt-0.5">${escape_html(rt.desc)}</div></div></label>`);
                }
                $$renderer5.push(`<!--]--></div></div> <div class="flex flex-col gap-1.5">`);
                Label($$renderer5, {
                  htmlFor: "dsar-details",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Additional details (optional)`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> <textarea id="dsar-details" placeholder="Provide any additional context that may help us process your request..."${attr("disabled", formState === "submitting", true)} rows="4" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[80px]">`);
                const $$body = escape_html(formDetails);
                if ($$body) {
                  $$renderer5.push(`${$$body}`);
                }
                $$renderer5.push(`</textarea></div> `);
                {
                  $$renderer5.push("<!--[-1-->");
                }
                $$renderer5.push(`<!--]--> <div class="flex items-center justify-between pt-2"><p class="text-xs text-muted-foreground max-w-sm">We verify your identity before processing requests. You may be asked to provide additional verification.</p> `);
                Button($$renderer5, {
                  type: "submit",
                  disabled: formState === "submitting",
                  class: "gap-1.5",
                  children: ($$renderer6) => {
                    {
                      $$renderer6.push("<!--[-1-->");
                      $$renderer6.push(`Submit request `);
                      Send($$renderer6, { class: "h-3.5 w-3.5" });
                      $$renderer6.push(`<!---->`);
                    }
                    $$renderer6.push(`<!--]-->`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----></div></form>`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
      }
      $$renderer3.push(`<!--]--> <div class="mt-10 space-y-6 text-sm text-muted-foreground"><div><h3 class="font-semibold text-foreground mb-1">What happens next?</h3> <ol class="list-decimal pl-5 space-y-1"><li>We acknowledge your request within 3 business days</li> <li>We verify your identity to protect your privacy</li> <li>We process your request and respond within 30 days</li> <li>If we need more time, we'll notify you of the extension (up to 60 additional days)</li></ol></div> <div><h3 class="font-semibold text-foreground mb-1">Your rights</h3> <p>Under GDPR, CCPA, and similar regulations, you have the right to access, correct, delete, restrict, port, and object to the processing of your personal data. For more information, see our <a href="/privacy" class="text-primary hover:underline">Privacy Policy</a>.</p></div> <p>You can also contact us directly at <a href="mailto:privacy@atlasit.pro" class="text-primary hover:underline">privacy@atlasit.pro</a>.</p></div></div></div>`);
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
//# sourceMappingURL=_page.svelte-CUA39QHH.js.map
