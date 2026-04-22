import { al as attr, ao as ensure_array_like, ak as stringify, an as escape_html } from './renderer-CwxN8JkH.js';
import { B as Button } from './button-BXPyX210.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import './toastStore-X6rW096m.js';
import 'marked';
import { S as Search } from './search-BqxOHk0I.js';
import { R as Refresh_cw } from './refresh-cw-Bn83BloP.js';
import './utils2-BgZmMgq3.js';
import './index-C1X1AO8K.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let scanning = false;
    let filterStatus = "";
    let filterType = "";
    let filterProvider = "";
    let searchQuery = "";
    $$renderer2.push(`<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-semibold tracking-tight">Non-Human Identities</h1> <p class="text-sm text-muted-foreground">Service accounts, API keys, OAuth apps, and bot credentials across connected adapters.</p></div> `);
    Button($$renderer2, {
      disabled: (
        /* silent */
        scanning
      ),
      size: "sm",
      children: ($$renderer3) => {
        Refresh_cw($$renderer3, {
          class: `h-4 w-4 mr-1.5 ${stringify("")}`
        });
        $$renderer3.push(`<!----> ${escape_html("Discover NHIs")}`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="flex flex-wrap gap-3 items-center"><div class="relative flex-1 min-w-[200px] max-w-sm">`);
    Search($$renderer2, {
      class: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
    });
    $$renderer2.push(`<!----> <input type="text" placeholder="Search by name, owner, or provider..."${attr("value", searchQuery)} class="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm"/></div> `);
    $$renderer2.select(
      {
        value: filterStatus,
        class: "h-9 rounded-md border border-input bg-background px-3 text-sm"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "" }, ($$renderer4) => {
          $$renderer4.push(`All Statuses`);
        });
        $$renderer3.option({ value: "active" }, ($$renderer4) => {
          $$renderer4.push(`Active`);
        });
        $$renderer3.option({ value: "revoked" }, ($$renderer4) => {
          $$renderer4.push(`Revoked`);
        });
        $$renderer3.option({ value: "rotation_pending" }, ($$renderer4) => {
          $$renderer4.push(`Rotation Pending`);
        });
      }
    );
    $$renderer2.push(` `);
    $$renderer2.select(
      {
        value: filterType,
        class: "h-9 rounded-md border border-input bg-background px-3 text-sm"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "" }, ($$renderer4) => {
          $$renderer4.push(`All Types`);
        });
        $$renderer3.option({ value: "service_account" }, ($$renderer4) => {
          $$renderer4.push(`Service Account`);
        });
        $$renderer3.option({ value: "oauth_app" }, ($$renderer4) => {
          $$renderer4.push(`OAuth App`);
        });
        $$renderer3.option({ value: "access_key" }, ($$renderer4) => {
          $$renderer4.push(`Access Key`);
        });
        $$renderer3.option({ value: "api_key" }, ($$renderer4) => {
          $$renderer4.push(`API Key`);
        });
        $$renderer3.option({ value: "bot_token" }, ($$renderer4) => {
          $$renderer4.push(`Bot Token`);
        });
        $$renderer3.option({ value: "deploy_key" }, ($$renderer4) => {
          $$renderer4.push(`Deploy Key`);
        });
        $$renderer3.option({ value: "oauth_grant" }, ($$renderer4) => {
          $$renderer4.push(`OAuth Grant`);
        });
      }
    );
    $$renderer2.push(` `);
    $$renderer2.select(
      {
        value: filterProvider,
        class: "h-9 rounded-md border border-input bg-background px-3 text-sm"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "" }, ($$renderer4) => {
          $$renderer4.push(`All Providers`);
        });
        $$renderer3.option({ value: "google_workspace" }, ($$renderer4) => {
          $$renderer4.push(`Google Workspace`);
        });
        $$renderer3.option({ value: "microsoft_365" }, ($$renderer4) => {
          $$renderer4.push(`Microsoft 365`);
        });
        $$renderer3.option({ value: "aws" }, ($$renderer4) => {
          $$renderer4.push(`AWS`);
        });
        $$renderer3.option({ value: "github" }, ($$renderer4) => {
          $$renderer4.push(`GitHub`);
        });
        $$renderer3.option({ value: "okta" }, ($$renderer4) => {
          $$renderer4.push(`Okta`);
        });
        $$renderer3.option({ value: "slack" }, ($$renderer4) => {
          $$renderer4.push(`Slack`);
        });
      }
    );
    $$renderer2.push(`</div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-3"><!--[-->`);
      const each_array = ensure_array_like([1, 2, 3, 4]);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        Skeleton($$renderer2, { class: "h-14 rounded-lg" });
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-x6cbW7Ai.js.map
