import { an as escape_html, ao as ensure_array_like, aj as attr_class, ak as stringify } from './renderer-CwxN8JkH.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let totalActive, totalRevoked;
    let items = [];
    let facets = [];
    let frameworkFilter = "all";
    let statusFilter = "all";
    const FRAMEWORKS = ["SOC2", "ISO27001", "NIST_CSF", "HIPAA", "GDPR"];
    totalActive = facets.filter((f) => f.status === "active").reduce((s, f) => s + parseInt(f.cnt, 10), 0);
    totalRevoked = facets.filter((f) => f.status === "revoked").reduce((s, f) => s + parseInt(f.cnt, 10), 0);
    $$renderer2.push(`<div class="animate-fade-in"><div class="mb-6 flex items-start justify-between gap-4 flex-wrap"><div><h1 class="text-3xl font-bold text-foreground">Attestations</h1> <p class="mt-1 text-sm text-muted-foreground">Formal signed statements that a control is working. Each attestation generates
        compliance evidence. Revoking one generates negative evidence — your score reflects reality.</p></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3"><div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-muted-foreground">Total</div> <div class="mt-1 text-2xl font-bold text-foreground">${escape_html(items.length)}</div></div> <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-muted-foreground">Active</div> <div class="mt-1 text-2xl font-bold text-success">${escape_html(totalActive)}</div></div> <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-muted-foreground">Revoked</div> <div class="mt-1 text-2xl font-bold text-destructive">${escape_html(totalRevoked)}</div></div> <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-muted-foreground">Frameworks covered</div> <div class="mt-1 text-2xl font-bold text-foreground">${escape_html(new Set(facets.filter((f) => f.status === "active").map((f) => f.framework)).size)}</div></div></div> <div class="mb-5 flex flex-wrap items-center gap-3">`);
    $$renderer2.select(
      {
        value: frameworkFilter,
        class: "px-3 py-1.5 text-xs border border-input rounded-md bg-card text-foreground/80"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "all" }, ($$renderer4) => {
          $$renderer4.push(`All frameworks`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(FRAMEWORKS);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let fw = each_array[$$index];
          $$renderer3.option({ value: fw }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(fw)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(` <div class="flex gap-1"><!--[-->`);
    const each_array_1 = ensure_array_like(["all", "active", "expired", "revoked"]);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let s = each_array_1[$$index_1];
      $$renderer2.push(`<button type="button"${attr_class(`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${stringify(statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-card text-foreground/80 border-input hover:border-primary")}`)}>${escape_html(s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1))}</button>`);
    }
    $$renderer2.push(`<!--]--></div></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-2"><!--[-->`);
      const each_array_3 = ensure_array_like([1, 2, 3]);
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        each_array_3[$$index_3];
        $$renderer2.push(`<div class="h-16 bg-muted rounded animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BuSIlHA5.js.map
