import {
  F as store_get,
  I as unsubscribe_stores,
} from "../../../../../chunks/index2.js";
import { p as page } from "../../../../../chunks/stores.js";
import { e as escape_html } from "../../../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let id;
    id = store_get(($$store_subs ??= {}), "$page", page).params.id;
    $$renderer2.push(
      `<h1>Workflow Execution</h1> <p>Execution ID: <code>${escape_html(id)}</code></p> <p>Detail view placeholder – show steps, status timeline, metrics.</p>`,
    );
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export { _page as default };
//# sourceMappingURL=_page.svelte.js.map
