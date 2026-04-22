import { aj as attr_class, ao as ensure_array_like, an as escape_html, al as attr, ak as stringify } from './renderer-CwxN8JkH.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import 'marked';

/* empty css                                                            */
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const FRAMEWORKS = ["SOC2", "ISO27001", "NIST_CSF", "HIPAA", "GDPR"];
    const SOURCES = ["okta", "platform", "adapter", "manual"];
    const IMPACTS = ["positive", "neutral", "negative"];
    let allItems = [];
    let frameworkFilter = "all";
    let sourceFilter = "all";
    let impactFilter = "all";
    let controlSearch = "";
    allItems.filter((item) => {
      if (controlSearch.trim()) {
        const q = controlSearch.trim().toLowerCase();
        const inId = (item.controlId ?? "").toLowerCase().includes(q);
        const inName = (item.controlName ?? "").toLowerCase().includes(q);
        if (!inId && !inName) return false;
      }
      return true;
    });
    $$renderer2.push(`<div class="animate-fade-in"><div class="mb-6"><h1 class="text-3xl font-bold text-foreground">Compliance Evidence</h1> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="mb-5 flex flex-wrap items-center gap-3"><div class="flex gap-1 flex-wrap"><button${attr_class(`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${stringify(
      "bg-blue-600 text-white border-blue-600"
    )}`)}>All frameworks</button> <!--[-->`);
    const each_array = ensure_array_like(FRAMEWORKS);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let fw = each_array[$$index];
      $$renderer2.push(`<button${attr_class(`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${stringify(frameworkFilter === fw ? "bg-blue-600 text-white border-blue-600" : "bg-card text-foreground/80 border-input hover:border-primary")}`)}>${escape_html(fw)}</button>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    $$renderer2.select(
      {
        value: sourceFilter,
        class: "px-3 py-1 text-xs border border-input rounded-md bg-card text-foreground/80"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "all" }, ($$renderer4) => {
          $$renderer4.push(`All sources`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(SOURCES);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let s = each_array_1[$$index_1];
          $$renderer3.option({ value: s }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(s)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(` `);
    $$renderer2.select(
      {
        value: impactFilter,
        class: "px-3 py-1 text-xs border border-input rounded-md bg-card text-foreground/80"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "all" }, ($$renderer4) => {
          $$renderer4.push(`All impacts`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array_2 = ensure_array_like(IMPACTS);
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let imp = each_array_2[$$index_2];
          $$renderer3.option({ value: imp }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(imp)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(` <input type="text"${attr("value", controlSearch)} placeholder="Search control ID…" class="px-3 py-1 text-xs border border-input rounded-md bg-card text-foreground/80 w-44 focus:outline-none focus:ring-2 focus:ring-primary"/></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-2"><!--[-->`);
      const each_array_3 = ensure_array_like([1, 2, 3, 4, 5, 6]);
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        each_array_3[$$index_3];
        $$renderer2.push(`<div class="h-12 bg-muted rounded-lg animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-QMYY3Die.js.map
