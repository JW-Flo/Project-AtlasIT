import { af as fallback, aj as attr_class, ap as clsx, an as escape_html, ad as slot, ag as bind_props } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';
import { o as onDestroy } from './index-server-C1ubzO3x.js';
import { X } from './x-BmTrGS3K.js';

function Dialog($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let open = fallback($$props["open"], false);
    let onClose = fallback($$props["onClose"], () => {
    });
    let title = fallback($$props["title"], "");
    let className = fallback($$props["class"], "");
    onDestroy(() => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    });
    if (typeof document !== "undefined") {
      if (open) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    if (open) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" tabindex="-1"><div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div> <div${attr_class(clsx(cn("relative z-50 w-full max-w-lg mx-3 sm:mx-4 rounded-lg border bg-card p-4 sm:p-6 shadow-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto", className)))}>`);
      if (title) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="flex items-center justify-between mb-4"><h3 class="text-lg font-semibold">${escape_html(title)}</h3> <button type="button" class="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Close">`);
        X($$renderer2, { class: "h-4 w-4" });
        $$renderer2.push(`<!----></button></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { open, onClose, title, class: className });
  });
}

export { Dialog as D };
//# sourceMappingURL=dialog-Cs6T-I4e.js.map
