import { B as ensure_array_like } from "../../../../../chunks/index2.js";
import { C as ComplianceAPI } from "../../../../../chunks/client.js";
import { e as escape_html } from "../../../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let templates = [];
    let error = null;
    let loading = true;
    (async () => {
      try {
        templates = (await ComplianceAPI.listPolicyTemplates()).items || [];
      } catch (e) {
        error = e?.body?.error || "Failed to load templates";
      } finally {
        loading = false;
      }
    })();
    $$renderer2.push(`<h1>Policy Templates</h1> `);
    if (loading) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p>Loading...</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (error) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<p class="error svelte-ci0obv">${escape_html(error)}</p>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
        if (templates.length === 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p>No templates.</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<ul class="list svelte-ci0obv"><!--[-->`);
          const each_array = ensure_array_like(templates);
          for (
            let $$index = 0, $$length = each_array.length;
            $$index < $$length;
            $$index++
          ) {
            let t = each_array[$$index];
            $$renderer2.push(
              `<li class="svelte-ci0obv"><strong>${escape_html(t.key)}</strong> — ${escape_html(t.name || t.title)}</li>`,
            );
          }
          $$renderer2.push(`<!--]--></ul>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export { _page as default };
//# sourceMappingURL=_page.svelte.js.map
