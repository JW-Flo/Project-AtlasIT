import { B as ensure_array_like } from "../../../../chunks/index2.js";
import { a as attr, e as escape_html } from "../../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let tenantId = "";
    let pack = "";
    let subject = "";
    let limit = 25;
    let loading = false;
    let results = [];
    let verifyHash = "";
    $$renderer2.push(
      `<h1 class="svelte-16ukkkz">Evidence</h1> <form class="search svelte-16ukkkz"><input placeholder="Tenant"${attr("value", tenantId)} class="svelte-16ukkkz"/> <input placeholder="Pack"${attr("value", pack)} class="svelte-16ukkkz"/> <input placeholder="Subject"${attr("value", subject)} class="svelte-16ukkkz"/> <input type="number" min="1" max="200"${attr("value", limit)} class="svelte-16ukkkz"/> <button${attr("disabled", loading, true)} class="svelte-16ukkkz">Search</button></form> `,
    );
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
      if (results.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p>No results.</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(
          `<table class="results svelte-16ukkkz"><thead><tr><th class="svelte-16ukkkz">Hash</th><th class="svelte-16ukkkz">Pack</th><th class="svelte-16ukkkz">Subject</th><th class="svelte-16ukkkz">Created</th></tr></thead><tbody><!--[-->`,
        );
        const each_array = ensure_array_like(results);
        for (
          let $$index = 0, $$length = each_array.length;
          $$index < $$length;
          $$index++
        ) {
          let ev = each_array[$$index];
          $$renderer2.push(
            `<tr><td class="mono svelte-16ukkkz">${escape_html(ev.hash?.slice(0, 12))}…</td><td class="svelte-16ukkkz">${escape_html(ev.pack)}</td><td class="svelte-16ukkkz">${escape_html(ev.subject)}</td><td class="svelte-16ukkkz">${escape_html(ev.createdAt?.slice(0, 19).replace("T", " "))}</td></tr>`,
          );
        }
        $$renderer2.push(`<!--]--></tbody></table>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(
      `<!--]--> <h2>Verify Evidence Hash</h2> <form class="verify svelte-16ukkkz"><input placeholder="Hash"${attr("value", verifyHash)} class="wide svelte-16ukkkz"/> <button class="svelte-16ukkkz">Verify</button></form> `,
    );
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export { _page as default };
//# sourceMappingURL=_page.svelte.js.map
