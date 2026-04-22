import { ab as store_get, ae as unsubscribe_stores, ao as ensure_array_like, al as attr, aj as attr_class, ak as stringify, an as escape_html, ah as sanitize_props, ai as spread_props, ad as slot } from './renderer-CwxN8JkH.js';
import { p as page } from './stores-emli2svW.js';
import './toastStore-X6rW096m.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_header } from './card-header-DkXf0dG2.js';
import { C as Card_title } from './card-title-CntIWcKQ.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { B as Badge } from './badge-CdvwjGCK.js';
import { I as Input } from './input-JvKuIRs1.js';
import { L as Label } from './label-C8HvX4HJ.js';
import { s as session } from './session-B8MDMP-a.js';
import 'qrcode';
import { S as Shield_check } from './shield-check-DC5MZnbP.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import './index-C1X1AO8K.js';
import './utils2-BgZmMgq3.js';

function Globe($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    [
      "path",
      { "d": "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }
    ],
    ["path", { "d": "M2 12h20" }]
  ];
  Icon($$renderer, spread_props([
    { name: "globe" },
    $$sanitized_props,
    {
      /**
       * @component @name Globe
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJNMTIgMmExNC41IDE0LjUgMCAwIDAgMCAyMCAxNC41IDE0LjUgMCAwIDAgMC0yMCIgLz4KICA8cGF0aCBkPSJNMiAxMmgyMCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/globe
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
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let current;
    let ssoSaving = false;
    let ssoDisplayName = "";
    let ssoIdpName = "";
    let ssoDefaultRoles = '["member"]';
    let oidcIssuer = "";
    let oidcClientId = "";
    let oidcClientSecret = "";
    let oidcScopes = "openid email profile";
    const settingsTabs = [
      { href: "/console/settings", label: "General" },
      { href: "/console/settings/users", label: "Users" },
      { href: "/console/settings/audit-log", label: "Audit Log" },
      { href: "/console/settings/billing", label: "Billing" },
      { href: "/console/settings/trust", label: "Trust Center" },
      { href: "/console/settings/incidents", label: "Incidents" },
      { href: "/console/settings/security", label: "Security" },
      {
        href: "/console/settings/notifications",
        label: "Notifications"
      }
    ];
    current = store_get($$store_subs ??= {}, "$page", page).url.pathname;
    store_get($$store_subs ??= {}, "$session", session)?.roles?.includes("owner") || store_get($$store_subs ??= {}, "$session", session)?.roles?.includes("super-admin") || store_get($$store_subs ??= {}, "$session", session)?.superAdmin;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="space-y-6"><h1 class="text-2xl font-semibold tracking-tight">Security</h1> <div class="flex gap-1 border-b"><!--[-->`);
      const each_array = ensure_array_like(settingsTabs);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let tab = each_array[$$index];
        $$renderer3.push(`<a${attr("href", tab.href)}${attr_class(`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${stringify(current === tab.href ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}`)}>${escape_html(tab.label)}</a>`);
      }
      $$renderer3.push(`<!--]--></div> `);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Card_header($$renderer4, {
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="flex items-center justify-between"><div class="flex items-center gap-3">`);
              Shield_check($$renderer5, { class: "h-5 w-5 text-muted-foreground" });
              $$renderer5.push(`<!----> <div>`);
              Card_title($$renderer5, {
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Two-Factor Authentication (TOTP)`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> <p class="text-sm text-muted-foreground mt-1">Add an extra layer of security with an authenticator app.</p></div></div> `);
              {
                $$renderer5.push("<!--[-1-->");
                Badge($$renderer5, {
                  variant: "secondary",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Disabled`);
                  },
                  $$slots: { default: true }
                });
              }
              $$renderer5.push(`<!--]--></div>`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          Card_content($$renderer4, {
            children: ($$renderer5) => {
              {
                $$renderer5.push("<!--[0-->");
                $$renderer5.push(`<p class="text-sm text-muted-foreground">Loading...</p>`);
              }
              $$renderer5.push(`<!--]-->`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Card_header($$renderer4, {
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="flex items-center justify-between"><div class="flex items-center gap-3">`);
              Globe($$renderer5, { class: "h-5 w-5 text-muted-foreground" });
              $$renderer5.push(`<!----> <div>`);
              Card_title($$renderer5, {
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Single Sign-On (SSO)`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> <p class="text-sm text-muted-foreground mt-1">Configure SAML 2.0 or OIDC for centralized authentication via your identity provider.</p></div></div> `);
              {
                $$renderer5.push("<!--[-1-->");
                Badge($$renderer5, {
                  variant: "secondary",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Not Configured`);
                  },
                  $$slots: { default: true }
                });
              }
              $$renderer5.push(`<!--]--></div>`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          Card_content($$renderer4, {
            children: ($$renderer5) => {
              {
                $$renderer5.push("<!--[-1-->");
                $$renderer5.push(`<div class="space-y-6"><div class="space-y-2">`);
                Label($$renderer5, {
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Protocol`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> <div class="flex gap-2"><button${attr_class(`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${stringify(
                  "bg-primary text-primary-foreground border-primary"
                )}`)}>OpenID Connect</button> <button${attr_class(`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${stringify("bg-background text-muted-foreground border-border hover:border-foreground")}`)}>SAML 2.0</button></div></div> <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="space-y-2">`);
                Label($$renderer5, {
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Display Name`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Input($$renderer5, {
                  placeholder: "e.g. Corporate SSO",
                  get value() {
                    return ssoDisplayName;
                  },
                  set value($$value) {
                    ssoDisplayName = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----></div> <div class="space-y-2">`);
                Label($$renderer5, {
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Identity Provider`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                $$renderer5.select(
                  {
                    class: "w-full rounded-md border bg-background px-3 py-2 text-sm",
                    value: ssoIdpName
                  },
                  ($$renderer6) => {
                    $$renderer6.option({ value: "" }, ($$renderer7) => {
                      $$renderer7.push(`Select IdP...`);
                    });
                    $$renderer6.option({ value: "okta" }, ($$renderer7) => {
                      $$renderer7.push(`Okta`);
                    });
                    $$renderer6.option({ value: "azure-ad" }, ($$renderer7) => {
                      $$renderer7.push(`Azure AD / Entra ID`);
                    });
                    $$renderer6.option({ value: "google" }, ($$renderer7) => {
                      $$renderer7.push(`Google Workspace`);
                    });
                    $$renderer6.option({ value: "onelogin" }, ($$renderer7) => {
                      $$renderer7.push(`OneLogin`);
                    });
                    $$renderer6.option({ value: "ping" }, ($$renderer7) => {
                      $$renderer7.push(`PingFederate`);
                    });
                    $$renderer6.option({ value: "other" }, ($$renderer7) => {
                      $$renderer7.push(`Other`);
                    });
                  }
                );
                $$renderer5.push(`</div></div> `);
                {
                  $$renderer5.push("<!--[0-->");
                  $$renderer5.push(`<div class="space-y-4 border-t pt-4"><h3 class="text-sm font-medium">OIDC Configuration</h3> <div class="space-y-2">`);
                  Label($$renderer5, {
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Issuer URL`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----> `);
                  Input($$renderer5, {
                    placeholder: "https://accounts.google.com or https://login.microsoftonline.com/{tenant}/v2.0",
                    get value() {
                      return oidcIssuer;
                    },
                    set value($$value) {
                      oidcIssuer = $$value;
                      $$settled = false;
                    }
                  });
                  $$renderer5.push(`<!----> <p class="text-xs text-muted-foreground">The OIDC issuer URL. Endpoints will be auto-discovered from .well-known/openid-configuration.</p></div> <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="space-y-2">`);
                  Label($$renderer5, {
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Client ID`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----> `);
                  Input($$renderer5, {
                    placeholder: "your-client-id",
                    get value() {
                      return oidcClientId;
                    },
                    set value($$value) {
                      oidcClientId = $$value;
                      $$settled = false;
                    }
                  });
                  $$renderer5.push(`<!----></div> <div class="space-y-2">`);
                  Label($$renderer5, {
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Client Secret`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----> `);
                  Input($$renderer5, {
                    type: "password",
                    placeholder: "your-client-secret",
                    get value() {
                      return oidcClientSecret;
                    },
                    set value($$value) {
                      oidcClientSecret = $$value;
                      $$settled = false;
                    }
                  });
                  $$renderer5.push(`<!----></div></div> <div class="space-y-2">`);
                  Label($$renderer5, {
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Scopes`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----> `);
                  Input($$renderer5, {
                    placeholder: "openid email profile",
                    get value() {
                      return oidcScopes;
                    },
                    set value($$value) {
                      oidcScopes = $$value;
                      $$settled = false;
                    }
                  });
                  $$renderer5.push(`<!----></div></div>`);
                }
                $$renderer5.push(`<!--]--> <div class="space-y-4 border-t pt-4"><h3 class="text-sm font-medium">Behavior</h3> <div class="flex items-center justify-between"><div><p class="text-sm">Enable SSO</p> <p class="text-xs text-muted-foreground">Allow users to sign in via this identity provider.</p></div> <button${attr_class(`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${stringify("bg-muted")}`)}><span${attr_class(`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stringify("translate-x-1")}`)}></span></button></div> <div class="flex items-center justify-between"><div><p class="text-sm">Just-in-Time Provisioning</p> <p class="text-xs text-muted-foreground">Auto-create user accounts on first SSO login.</p></div> <button${attr_class(`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${stringify("bg-primary")}`)}><span${attr_class(`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stringify("translate-x-6")}`)}></span></button></div> <div class="flex items-center justify-between"><div><p class="text-sm">Force SSO</p> <p class="text-xs text-muted-foreground">Block password login; require SSO for all users.</p></div> <button${attr_class(`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${stringify("bg-muted")}`)}><span${attr_class(`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stringify("translate-x-1")}`)}></span></button></div> <div class="flex items-center justify-between"><div><p class="text-sm">Bypass MFA for SSO Users</p> <p class="text-xs text-muted-foreground">Skip TOTP challenge when authenticating via IdP.</p></div> <button${attr_class(`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${stringify("bg-muted")}`)}><span${attr_class(`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stringify("translate-x-1")}`)}></span></button></div> <div class="space-y-2">`);
                Label($$renderer5, {
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Default Roles for New SSO Users`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Input($$renderer5, {
                  placeholder: '["member"]',
                  class: "font-mono text-sm",
                  get value() {
                    return ssoDefaultRoles;
                  },
                  set value($$value) {
                    ssoDefaultRoles = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----> <p class="text-xs text-muted-foreground">JSON array of roles assigned to JIT-provisioned users.</p></div></div> `);
                {
                  $$renderer5.push("<!--[-1-->");
                }
                $$renderer5.push(`<!--]--> <div class="flex items-center gap-2 border-t pt-4">`);
                Button($$renderer5, {
                  disabled: ssoSaving,
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->${escape_html("Save SSO Configuration")}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                {
                  $$renderer5.push("<!--[-1-->");
                }
                $$renderer5.push(`<!--]--> `);
                {
                  $$renderer5.push("<!--[-1-->");
                }
                $$renderer5.push(`<!--]--></div></div>`);
              }
              $$renderer5.push(`<!--]-->`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-bPgBMQYL.js.map
