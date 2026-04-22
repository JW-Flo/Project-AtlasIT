import { al as attr, ao as ensure_array_like } from './renderer-CwxN8JkH.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isAdmin;
    let userRole = "";
    let sinceDate = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
    isAdmin = userRole === "owner";
    $$renderer2.push(`<div class="animate-fade-in max-w-5xl mx-auto"><div class="mb-6"><h1 class="text-3xl font-bold text-foreground">Audit Package Export</h1> <p class="mt-1 text-sm text-muted-foreground">Generate an auditor-ready report bundling live compliance score, control state,
      evidence sample, attestations, policies, incidents, and audit trail for a chosen
      framework. HTML opens in a new tab — save as PDF via your browser's print dialog.
      JSON format includes a SHA-256 content hash for tamper verification.</p></div> `);
    if (!isAdmin) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="bg-warning-muted border border-warning/20 rounded-lg p-4 mb-5"><p class="text-sm text-amber-800 dark:text-amber-300">Admin or owner role required to download audit packages. Sign in as an admin or
        ask a tenant admin to generate the report.</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="mb-5 bg-card border border-border rounded-lg p-4"><label class="block text-sm font-medium text-foreground/80 mb-1" for="since">Evidence window start</label> <input id="since" type="date"${attr("value", sinceDate)} class="px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground"/> <p class="mt-1 text-xs text-muted-foreground">Only evidence, incidents, and audit-log entries after this date will be included.
      Defaults to last 90 days. Attestations, policies, and control state are always full.</p></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-2"><!--[-->`);
      const each_array = ensure_array_like([1, 2, 3]);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        $$renderer2.push(`<div class="h-24 bg-muted rounded animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="mt-8 text-xs text-muted-foreground max-w-3xl"><h3 class="font-medium text-foreground/80 mb-1 text-sm">What's in the package?</h3> <ul class="space-y-1 list-disc pl-5"><li>Cover page: tenant, framework, score, evidence window, generation timestamp</li> <li>Per-control status (pass/fail/unknown) with rationale</li> <li>Active + revoked attestations (with statements and revocation reasons)</li> <li>Policies matching the framework with version, status, acknowledgement counts</li> <li>Evidence sample (up to 150 recent records, JSON has all up to 500)</li> <li>Incidents opened in the window</li> <li>Audit log: recent tenant actions</li> <li>SHA-256 content hash for tamper-evident verification</li></ul></div></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-uUhe0rMl.js.map
