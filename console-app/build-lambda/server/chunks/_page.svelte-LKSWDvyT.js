import { ao as ensure_array_like, ah as sanitize_props, ai as spread_props, ad as slot, al as attr, an as escape_html, af as fallback, aj as attr_class, ap as clsx, ag as bind_props } from './renderer-CwxN8JkH.js';
import './toastStore-X6rW096m.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_header } from './card-header-DkXf0dG2.js';
import { C as Card_title } from './card-title-CntIWcKQ.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { D as Dialog } from './dialog-Cs6T-I4e.js';
import { c as cn } from './utils2-BgZmMgq3.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import { S as Shield } from './shield-DkMnJ1a-.js';
import { K as Key_round } from './key-round-BRAhoWZh.js';
import './index-C1X1AO8K.js';
import './index-server-C1ubzO3x.js';
import './x-BmTrGS3K.js';

function Eye($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
      }
    ],
    ["circle", { "cx": "12", "cy": "12", "r": "3" }]
  ];
  Icon($$renderer, spread_props([
    { name: "eye" },
    $$sanitized_props,
    {
      /**
       * @component @name Eye
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMi4wNjIgMTIuMzQ4YTEgMSAwIDAgMSAwLS42OTYgMTAuNzUgMTAuNzUgMCAwIDEgMTkuODc2IDAgMSAxIDAgMCAxIDAgLjY5NiAxMC43NSAxMC43NSAwIDAgMS0xOS44NzYgMCIgLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/eye
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Dialog_header($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let className = fallback($$props["class"], "");
    $$renderer2.push(`<div${attr_class(clsx(cn("flex flex-col space-y-1.5 text-center sm:text-left", className)))}><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { class: className });
  });
}
function Dialog_title($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let className = fallback($$props["class"], "");
    $$renderer2.push(`<h2${attr_class(clsx(cn("text-lg font-semibold leading-none tracking-tight", className)))}><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></h2>`);
    bind_props($$props, { class: className });
  });
}
function Dialog_footer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let className = fallback($$props["class"], "");
    $$renderer2.push(`<div${attr_class(clsx(cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)))}><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { class: className });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isImpersonating;
    let deleteModalOpen = false;
    let tenantToDelete = null;
    let disableModalOpen = false;
    let tenantToToggle = null;
    let impersonateModalOpen = false;
    let tenantToImpersonate = null;
    function closeDisableModal() {
      disableModalOpen = false;
      tenantToToggle = null;
    }
    function closeDeleteModal() {
      deleteModalOpen = false;
      tenantToDelete = null;
    }
    function closeImpersonateModal() {
      impersonateModalOpen = false;
      tenantToImpersonate = null;
    }
    let resetEmail = "";
    let resetLoading = false;
    isImpersonating = typeof window !== "undefined" && !!sessionStorage.getItem("atlasit_original_token");
    $$renderer2.push(`<div class="space-y-6">`);
    if (isImpersonating) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"><div class="flex items-center gap-2 text-sm text-amber-800">`);
      Eye($$renderer2, { class: "h-4 w-4 shrink-0" });
      $$renderer2.push(`<!----> <span>You are impersonating a tenant. Actions taken here affect their account.</span></div> `);
      Button($$renderer2, {
        size: "sm",
        variant: "outline",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Exit impersonation`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="flex items-center justify-between gap-3"><div><h1 class="text-2xl font-semibold tracking-tight">Platform Administration</h1> <p class="text-sm text-muted-foreground">Manage tenants across the platform</p></div> <div class="flex items-center gap-2 shrink-0">`);
    Shield($$renderer2, { class: "h-5 w-5 text-primary" });
    $$renderer2.push(`<!----></div></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-3"><!--[-->`);
      const each_array = ensure_array_like([1, 2, 3]);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        Skeleton($$renderer2, { class: "h-16 rounded-lg" });
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    Card($$renderer2, {
      children: ($$renderer3) => {
        Card_header($$renderer3, {
          children: ($$renderer4) => {
            Card_title($$renderer4, {
              children: ($$renderer5) => {
                $$renderer5.push(`<div class="flex items-center gap-2">`);
                Key_round($$renderer5, { class: "h-4 w-4 text-primary" });
                $$renderer5.push(`<!----> Reset User Password</div>`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> `);
        Card_content($$renderer3, {
          children: ($$renderer4) => {
            $$renderer4.push(`<p class="text-sm text-muted-foreground mb-4">Generate a new temporary password for any platform user. Share it securely — the user should change it immediately after logging in.</p> <form class="flex gap-2 max-w-md"><input type="email"${attr("value", resetEmail)} placeholder="user@example.com" required="" class="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"/> `);
            Button($$renderer4, {
              type: "submit",
              disabled: resetLoading,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->${escape_html("Reset")}`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----></form> `);
            {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--> `);
            {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]-->`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!---->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> `);
    Dialog($$renderer2, {
      open: deleteModalOpen,
      onClose: closeDeleteModal,
      children: ($$renderer3) => {
        Dialog_header($$renderer3, {
          children: ($$renderer4) => {
            Dialog_title($$renderer4, {
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->Delete Tenant`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> <p class="text-sm text-muted-foreground">Are you sure you want to delete tenant <strong class="text-foreground">${escape_html(tenantToDelete?.name)}</strong>? This cannot be undone.</p> `);
        Dialog_footer($$renderer3, {
          children: ($$renderer4) => {
            Button($$renderer4, {
              variant: "outline",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->Cancel`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              variant: "destructive",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->Delete`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!---->`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!---->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> `);
    Dialog($$renderer2, {
      open: disableModalOpen,
      onClose: closeDisableModal,
      children: ($$renderer3) => {
        Dialog_header($$renderer3, {
          children: ($$renderer4) => {
            Dialog_title($$renderer4, {
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->${escape_html(tenantToToggle?.status === "active" ? "Disable" : "Enable")} Tenant`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> <p class="text-sm text-muted-foreground">Are you sure you want to ${escape_html(tenantToToggle?.status === "active" ? "disable" : "enable")} tenant <strong class="text-foreground">${escape_html(tenantToToggle?.name)}</strong>? `);
        if (tenantToToggle?.status === "active") {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`All users will lose access immediately.`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></p> `);
        Dialog_footer($$renderer3, {
          children: ($$renderer4) => {
            Button($$renderer4, {
              variant: "outline",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->Cancel`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              variant: tenantToToggle?.status === "active" ? "destructive" : "default",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->${escape_html(tenantToToggle?.status === "active" ? "Disable" : "Enable")}`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!---->`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!---->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> `);
    Dialog($$renderer2, {
      open: impersonateModalOpen,
      onClose: closeImpersonateModal,
      children: ($$renderer3) => {
        Dialog_header($$renderer3, {
          children: ($$renderer4) => {
            Dialog_title($$renderer4, {
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->Impersonate Tenant`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> <div class="space-y-2"><p class="text-sm text-muted-foreground">You are about to impersonate <strong class="text-foreground">${escape_html(tenantToImpersonate?.name)}</strong>.</p> <p class="text-sm text-muted-foreground">Your session will switch to this tenant's context and all actions you take will be performed as that tenant. This session change is logged in the audit trail.</p></div> `);
        Dialog_footer($$renderer3, {
          children: ($$renderer4) => {
            Button($$renderer4, {
              variant: "outline",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->Cancel`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              variant: "secondary",
              children: ($$renderer5) => {
                Eye($$renderer5, { class: "h-3 w-3 mr-1" });
                $$renderer5.push(`<!----> Impersonate`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!---->`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!---->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!---->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-LKSWDvyT.js.map
