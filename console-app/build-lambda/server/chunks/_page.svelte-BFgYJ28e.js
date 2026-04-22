import { ac as head, al as attr, ak as stringify } from './renderer-CwxN8JkH.js';
import { S as Shield_check } from './shield-check-DC5MZnbP.js';
import { R as Refresh_cw } from './refresh-cw-Bn83BloP.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let loading = true;
    head("3alowf", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>System Status · AtlasIT</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Real-time status of AtlasIT platform services."/>`);
    });
    $$renderer2.push(`<div class="min-h-screen bg-slate-50 text-slate-900"><div class="bg-white border-b border-slate-200"><div class="mx-auto max-w-3xl px-4 py-5 flex items-center justify-between"><a href="/" class="flex items-center gap-2.5"><div class="h-8 w-8 rounded-lg bg-[hsl(252,87%,58%)] flex items-center justify-center">`);
    Shield_check($$renderer2, { class: "h-4 w-4 text-white", strokeWidth: 2.5 });
    $$renderer2.push(`<!----></div> <span class="font-semibold text-slate-900">AtlasIT</span> <span class="text-slate-400">/</span> <span class="text-slate-600 text-sm">Status</span></a> <button class="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"${attr("disabled", loading, true)}>`);
    Refresh_cw($$renderer2, {
      class: `h-3.5 w-3.5 ${stringify("animate-spin")}`
    });
    $$renderer2.push(`<!----> Refresh</button></div></div> <div class="mx-auto max-w-3xl px-4 py-8">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="rounded-xl bg-white border border-slate-200 p-8 text-center shadow-sm">`);
      Refresh_cw($$renderer2, { class: "mx-auto h-6 w-6 animate-spin text-slate-400 mb-3" });
      $$renderer2.push(`<!----> <p class="text-sm text-slate-500">Checking service health…</p></div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BFgYJ28e.js.map
