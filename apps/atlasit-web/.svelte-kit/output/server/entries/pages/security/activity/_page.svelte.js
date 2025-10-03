import {
  B as ensure_array_like,
  N as bind_props,
} from "../../../../chunks/index2.js";
import { e as escape_html } from "../../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let items = data.activity?.items || [];
    $$renderer2.push(`<h1 class="svelte-n3q11l">Activity Feed</h1> `);
    if (data.error) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<p class="error svelte-n3q11l">${escape_html(data.error)}</p>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<ul class="feed svelte-n3q11l"><!--[-->`);
      const each_array = ensure_array_like(items);
      for (
        let $$index = 0, $$length = each_array.length;
        $$index < $$length;
        $$index++
      ) {
        let ev = each_array[$$index];
        $$renderer2.push(
          `<li class="svelte-n3q11l"><code class="svelte-n3q11l">${escape_html(ev.type)}</code> <span>${escape_html(ev.message || ev.summary || ev.detail)}</span> <time class="svelte-n3q11l">${escape_html(ev.createdAt?.slice(0, 19).replace("T", " "))}</time></li>`,
        );
      }
      $$renderer2.push(`<!--]--></ul>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { data });
  });
}
export { _page as default };
//# sourceMappingURL=_page.svelte.js.map
