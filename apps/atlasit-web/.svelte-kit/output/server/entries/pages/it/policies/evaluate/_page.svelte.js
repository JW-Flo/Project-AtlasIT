import {
  e as escape_html,
  a as attr,
} from "../../../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let policyText = "";
    $$renderer2.push(
      `<h1>Evaluate Policy</h1> <form class="form svelte-1mfxj0f"><textarea placeholder="Paste policy body" class="svelte-1mfxj0f">`,
    );
    const $$body = escape_html(policyText);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(
      `</textarea> <button${attr("disabled", !policyText, true)} class="svelte-1mfxj0f">Evaluate</button></form> `,
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
