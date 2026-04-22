import { ac as head, an as escape_html } from './renderer-CwxN8JkH.js';
import { B as Button } from './button-BXPyX210.js';
import { I as Input } from './input-JvKuIRs1.js';
import { L as Label } from './label-C8HvX4HJ.js';
import './utils2-BgZmMgq3.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let email = "";
    let loading = false;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("1vzfae4", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>Forgot Password - AtlasIT</title>`);
        });
      });
      $$renderer3.push(`<div class="min-h-screen flex items-center justify-center bg-background p-4"><div class="w-full max-w-md"><div class="bg-card border border-border rounded-xl p-8 shadow-lg"><div class="text-center mb-8"><h1 class="text-3xl font-bold text-foreground mb-2">Reset Password</h1> <p class="text-sm text-muted-foreground">`);
      {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`Enter your email to receive a password reset link`);
      }
      $$renderer3.push(`<!--]--></p></div> `);
      {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<form class="space-y-4"><div>`);
        Label($$renderer3, {
          for: "email",
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->Email Address`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> `);
        Input($$renderer3, {
          id: "email",
          type: "email",
          placeholder: "you@company.com",
          required: true,
          disabled: loading,
          autocomplete: "email",
          get value() {
            return email;
          },
          set value($$value) {
            email = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----></div> `);
        {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        Button($$renderer3, {
          type: "submit",
          class: "w-full",
          disabled: loading,
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->${escape_html("Send Reset Link")}`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> <div class="text-center"><a href="/login" class="text-sm text-muted-foreground hover:text-primary transition-colors">Back to Login</a></div></form>`);
      }
      $$renderer3.push(`<!--]--></div> <p class="text-center text-xs text-muted-foreground mt-6">Need help? Contact <a href="mailto:support@atlasit.pro" class="text-primary hover:underline">support@atlasit.pro</a></p></div></div>`);
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
//# sourceMappingURL=_page.svelte-kZ8aU_Cp.js.map
