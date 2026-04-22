import { an as escape_html, ao as ensure_array_like } from './renderer-CwxN8JkH.js';
import { s as session } from './session-B8MDMP-a.js';
import './index-C1X1AO8K.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isAdmin = false;
    session.subscribe((s) => {
      if (s) {
        s.email ?? null;
        isAdmin = s.roles?.includes("admin") || s.roles?.includes("owner") || false;
      }
    });
    $$renderer2.push(`<div class="animate-fade-in max-w-5xl mx-auto"><div class="mb-6 flex items-center justify-between"><div><h1 class="text-3xl font-bold text-foreground">Users &amp; Roles</h1> <p class="mt-1 text-sm text-muted-foreground">Manage who has access to your organization.</p></div> `);
    if (isAdmin) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors">${escape_html("Invite User")}</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-3"><!--[-->`);
      const each_array = ensure_array_like(Array(4));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        $$renderer2.push(`<div class="h-14 bg-muted rounded-lg animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CZV9LCLw.js.map
