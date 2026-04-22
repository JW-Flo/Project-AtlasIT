import { aj as attr_class, ak as stringify, an as escape_html } from './renderer-CwxN8JkH.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let banner = null;
    let requests = [];
    let requestsFilter = "pending";
    async function loadRequests() {
      try {
        const res = await fetch(`/api/compliance/api/v1/trust/access-requests?status=${requestsFilter}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        requests = json.requests ?? [];
      } catch (e) {
        banner = {
          type: "error",
          msg: `Failed to load access requests: ${e.message}`
        };
      } finally {
      }
    }
    loadRequests();
    $$renderer2.push(`<div class="p-8 max-w-4xl mx-auto"><div class="mb-6"><a href="/console/settings" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Settings</a> <h1 class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Trust Center</h1> <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Publish a live public page showing your continuous compliance posture. Prospects and auditors can
      see your real score, framework coverage, and operational cadence — without logging in.</p></div> `);
    if (banner) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div${attr_class(`mb-5 rounded-lg p-4 text-sm border ${stringify(banner.type === "error" ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300" : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300")}`)}>${escape_html(banner.msg)}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DTeGqRyx.js.map
