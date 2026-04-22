import { an as escape_html } from './renderer-CwxN8JkH.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { C as Card_header } from './card-header-DkXf0dG2.js';
import { C as Card_title } from './card-title-CntIWcKQ.js';
import { B as Button } from './button-BXPyX210.js';
import './toastStore-X6rW096m.js';
import { S as Sparkles } from './sparkles-DZDSQuPW.js';
import './utils2-BgZmMgq3.js';
import './index-C1X1AO8K.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let prompt = "";
    $$renderer2.push(`<div class="space-y-6"><div><h1 class="text-2xl font-semibold tracking-tight">NL Automation Builder</h1> <p class="text-sm text-muted-foreground">Describe your lifecycle policy in plain English and generate an automation rule with compliance mapping.</p></div> `);
    Card($$renderer2, {
      children: ($$renderer3) => {
        Card_header($$renderer3, {
          children: ($$renderer4) => {
            Card_title($$renderer4, {
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->Policy Prompt`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> `);
        Card_content($$renderer3, {
          class: "space-y-4",
          children: ($$renderer4) => {
            $$renderer4.push(`<textarea rows="5" placeholder="Describe your policy in plain English... e.g. When someone leaves engineering, revoke GitHub and Jira access immediately." class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring">`);
            const $$body = escape_html(prompt);
            if ($$body) {
              $$renderer4.push(`${$$body}`);
            }
            $$renderer4.push(`</textarea> <div class="flex items-center gap-2">`);
            Button($$renderer4, {
              disabled: !prompt.trim(),
              children: ($$renderer5) => {
                Sparkles($$renderer5, { class: "h-4 w-4 mr-1.5" });
                $$renderer5.push(`<!----> Generate Rule`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----></div> `);
            {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--> `);
            {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]-->`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!---->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-QRtr-asN.js.map
