import { a as attr } from "../../../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let templateKey = "";
    let subject = "";
    $$renderer2.push(
      `<h1>Generate Policy</h1> <form class="form svelte-1xycszf"><input placeholder="Template key"${attr("value", templateKey)} class="svelte-1xycszf"/> <input placeholder="Subject / system"${attr("value", subject)} class="svelte-1xycszf"/> <button${attr("disabled", !templateKey, true)} class="svelte-1xycszf">Generate</button></form> `,
    );
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export { _page as default };
//# sourceMappingURL=_page.svelte.js.map
