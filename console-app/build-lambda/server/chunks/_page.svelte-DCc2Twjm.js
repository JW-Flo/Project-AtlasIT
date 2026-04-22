import { ao as ensure_array_like } from './renderer-CwxN8JkH.js';
import 'marked';

/* empty css                                                            */
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let allControls = [];
    let searchText = "";
    let sortKey = "controlId";
    allControls.filter((c) => c.state === "pass").length;
    allControls.filter((c) => c.state === "fail").length;
    allControls.filter((c) => c.state === "unknown").length;
    allControls.filter((c) => {
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        if (!c.controlId.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      let av = a[sortKey] ?? "";
      let bv = b[sortKey] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return cmp;
    });
    $$renderer2.push(`<div class="animate-fade-in"><div class="mb-6"><h1 class="text-3xl font-bold text-foreground">Compliance Controls</h1> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3"><!--[-->`);
      const each_array = ensure_array_like([1, 2, 3, 4]);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        $$renderer2.push(`<div class="h-20 bg-muted rounded-lg animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="space-y-2"><!--[-->`);
      const each_array_1 = ensure_array_like([1, 2, 3, 4, 5]);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        each_array_1[$$index_1];
        $$renderer2.push(`<div class="h-12 bg-muted rounded-lg animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DCc2Twjm.js.map
