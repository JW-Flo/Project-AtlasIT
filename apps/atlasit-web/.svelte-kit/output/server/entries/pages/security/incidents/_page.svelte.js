import {
  B as ensure_array_like,
  N as bind_props,
} from "../../../../chunks/index2.js";
import { e as escape_html, a as attr } from "../../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let title = "";
    let severity = "low";
    let items = data.incidents?.items || [];
    $$renderer2.push(`<h1 class="svelte-k4yj4f">Security Incidents</h1> `);
    if (data.error) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<p class="error svelte-k4yj4f">${escape_html(data.error)}</p>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(
      `<!--]--> <form class="create svelte-k4yj4f"><input placeholder="Title"${attr("value", title)} class="svelte-k4yj4f"/> `,
    );
    $$renderer2.select(
      { value: severity, class: "" },
      ($$renderer3) => {
        $$renderer3.option({ value: "low" }, ($$renderer4) => {
          $$renderer4.push(`Low`);
        });
        $$renderer3.option({ value: "medium" }, ($$renderer4) => {
          $$renderer4.push(`Medium`);
        });
        $$renderer3.option({ value: "high" }, ($$renderer4) => {
          $$renderer4.push(`High`);
        });
        $$renderer3.option({ value: "critical" }, ($$renderer4) => {
          $$renderer4.push(`Critical`);
        });
      },
      "svelte-k4yj4f",
    );
    $$renderer2.push(
      ` <button${attr("disabled", !title, true)} class="svelte-k4yj4f">Create</button></form> `,
    );
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(
      `<!--]--> <table class="list svelte-k4yj4f"><thead><tr><th class="svelte-k4yj4f">Title</th><th class="svelte-k4yj4f">Severity</th><th class="svelte-k4yj4f">Status</th><th class="svelte-k4yj4f">Created</th></tr></thead><tbody><!--[-->`,
    );
    const each_array = ensure_array_like(items);
    for (
      let $$index = 0, $$length = each_array.length;
      $$index < $$length;
      $$index++
    ) {
      let inc = each_array[$$index];
      $$renderer2.push(
        `<tr><td class="svelte-k4yj4f">${escape_html(inc.title)}</td><td class="svelte-k4yj4f">${escape_html(inc.severity)}</td><td class="svelte-k4yj4f">${escape_html(inc.status)}</td><td class="svelte-k4yj4f">${escape_html(inc.createdAt?.slice(0, 19).replace("T", " "))}</td></tr>`,
      );
    }
    $$renderer2.push(`<!--]--></tbody></table>`);
    bind_props($$props, { data });
  });
}
export { _page as default };
//# sourceMappingURL=_page.svelte.js.map
