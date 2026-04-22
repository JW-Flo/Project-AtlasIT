import { ac as head, al as attr, ag as bind_props, an as escape_html, ao as ensure_array_like, af as fallback, ak as stringify, am as attr_style } from './renderer-CwxN8JkH.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import { u as updateInstallConfig } from './marketplace-CZLQH-xI.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_header } from './card-header-DkXf0dG2.js';
import { C as Card_title } from './card-title-CntIWcKQ.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { B as Badge } from './badge-CdvwjGCK.js';
import { A as Alert } from './alert-CV56Qv_m.js';
import { A as Arrow_left } from './arrow-left-26Np_Hiw.js';
import { E as External_link } from './external-link-B8q-9MyH.js';
import './utils2-BgZmMgq3.js';
import './Icon-DQFqITWq.js';

function ConfigForm($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let configFields = fallback($$props["configFields"], () => [], true);
    let values = fallback($$props["values"], () => ({}), true);
    let onSubmit = fallback($$props["onSubmit"], void 0);
    let loading = fallback($$props["loading"], false);
    let submitLabel = fallback($$props["submitLabel"], "Save Configuration");
    let errors = {};
    function inputType(field) {
      switch (field.type) {
        case "number":
          return "number";
        case "url":
          return "url";
        case "email":
          return "email";
        case "secret":
          return "password";
        default:
          return "text";
      }
    }
    $$renderer2.push(`<form class="space-y-4"><!--[-->`);
    const each_array = ensure_array_like(configFields);
    for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
      let field = each_array[$$index_2];
      $$renderer2.push(`<div><label class="block text-sm mb-1.5 font-medium" style="color: var(--color-text);"${attr("for", `config-${stringify(field.key)}`)}>${escape_html(field.label)} `);
      if (field.required) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="text-red-400">*</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></label> `);
      if (field.description) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="text-[11px] mb-1.5" style="color: var(--color-text-dim);">${escape_html(field.description)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (field.type === "boolean") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<label class="relative inline-flex items-center cursor-pointer gap-2"${attr("for", `config-${stringify(field.key)}`)}><input type="checkbox"${attr("id", `config-${stringify(field.key)}`)}${attr("checked", !!values[field.key], true)} class="sr-only peer"/> <div class="w-9 h-5 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:rounded-full after:h-4 after:w-4 after:transition-all"${attr_style(`background: ${stringify(values[field.key] ? "var(--color-accent)" : "var(--color-border)")}; `)}><div class="absolute top-[2px] start-[2px] rounded-full h-4 w-4 transition-transform bg-white"${attr_style(`transform: translateX(${stringify(values[field.key] ? "16px" : "0")});`)}></div></div> <span class="text-xs" style="color: var(--color-text-dim);">${escape_html(values[field.key] ? "Enabled" : "Disabled")}</span></label>`);
      } else if (field.type === "select") {
        $$renderer2.push("<!--[1-->");
        $$renderer2.select(
          {
            id: `config-${stringify(field.key)}`,
            class: "w-full px-3 py-2 rounded text-sm appearance-none",
            style: `background: var(--color-bg); border: 1px solid ${stringify(errors[field.key] ? "#ef4444" : "var(--color-border)")}; color: var(--color-text);`,
            value: values[field.key]
          },
          ($$renderer3) => {
            $$renderer3.option({ value: "" }, ($$renderer4) => {
              $$renderer4.push(`Select...`);
            });
            $$renderer3.push(`<!--[-->`);
            const each_array_1 = ensure_array_like(field.options || []);
            for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
              let opt = each_array_1[$$index];
              $$renderer3.option({ value: opt.value }, ($$renderer4) => {
                $$renderer4.push(`${escape_html(opt.label)}`);
              });
            }
            $$renderer3.push(`<!--]-->`);
          }
        );
      } else if (field.type === "multiselect") {
        $$renderer2.push("<!--[2-->");
        $$renderer2.push(`<div class="space-y-1.5"><!--[-->`);
        const each_array_2 = ensure_array_like(field.options || []);
        for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
          let opt = each_array_2[$$index_1];
          $$renderer2.push(`<label class="flex items-center gap-2 cursor-pointer"><input type="checkbox"${attr("checked", (values[field.key] || []).includes(opt.value), true)} class="rounded" style="accent-color: var(--color-accent);"/> <span class="text-xs" style="color: var(--color-text);">${escape_html(opt.label)}</span></label>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<input${attr("id", `config-${stringify(field.key)}`)}${attr("type", inputType(field))}${attr("placeholder", field.placeholder || "")} class="w-full px-3 py-2 rounded text-sm"${attr_style(`background: var(--color-bg); border: 1px solid ${stringify(errors[field.key] ? "#ef4444" : "var(--color-border)")}; color: var(--color-text);`)}${attr("value", values[field.key])}${attr("min", field.validation?.min)}${attr("max", field.validation?.max)}/>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (errors[field.key]) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="text-[11px] mt-1 text-red-400">${escape_html(errors[field.key])}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (configFields.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button type="submit"${attr("disabled", loading, true)} class="w-full py-2.5 text-sm font-medium rounded text-white transition-colors disabled:opacity-50" style="background: var(--color-accent);">`);
      if (loading) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`Saving...`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`${escape_html(submitLabel)}`);
      }
      $$renderer2.push(`<!--]--></button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></form>`);
    bind_props($$props, { configFields, values, onSubmit, loading, submitLabel });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isInstalled, isActive, capabilities, configFields;
    let data = $$props["data"];
    let app = data.app;
    let install = data.install;
    let loading = false;
    let error = null;
    let configValues = install?.config ?? {};
    function parseJson(val) {
      if (!val) return null;
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return null;
        }
      }
      return val;
    }
    async function handleConfigSave(values) {
      if (!install) return;
      loading = true;
      error = null;
      try {
        install = await updateInstallConfig(install.id, values);
        configValues = install.config ?? {};
      } catch (e) {
        error = e instanceof Error ? e.message : "Config update failed";
      } finally {
        loading = false;
      }
    }
    isInstalled = install && install.status !== "uninstalled" ? true : false;
    isActive = install?.status === "active";
    capabilities = parseJson(app?.capabilities) ?? [];
    configFields = parseJson(app?.config_schema) ?? [];
    head("17axthb", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(app?.name ?? "App")} - Marketplace - AtlasIT</title>`);
      });
    });
    if (!app) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex items-center justify-center min-h-[400px]"><div class="text-center"><h2 class="text-xl font-semibold">App not found</h2> <p class="mt-2 text-muted-foreground">This app may have been removed from the marketplace.</p> `);
      Button($$renderer2, {
        class: "mt-4",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Back to Marketplace`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="max-w-4xl mx-auto"><button class="mb-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">`);
      Arrow_left($$renderer2, { class: "h-4 w-4" });
      $$renderer2.push(`<!----> Back to Marketplace</button> `);
      Card($$renderer2, {
        children: ($$renderer3) => {
          Card_content($$renderer3, {
            class: "pt-6",
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex items-start gap-6"><div class="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">`);
              if (app.logo_url) {
                $$renderer4.push("<!--[0-->");
                $$renderer4.push(`<img${attr("src", app.logo_url)}${attr("alt", app.name)} class="w-16 h-16 rounded-xl object-cover"/>`);
              } else {
                $$renderer4.push("<!--[-1-->");
                $$renderer4.push(`${escape_html(app.name.charAt(0))}`);
              }
              $$renderer4.push(`<!--]--></div> <div class="flex-1 min-w-0"><div class="flex items-center gap-3"><h1 class="text-2xl font-bold">${escape_html(app.name)}</h1> `);
              Badge($$renderer4, {
                variant: "secondary",
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->${escape_html(app.category)}`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----></div> <p class="mt-1 text-sm text-muted-foreground">by ${escape_html(app.provider)} · v${escape_html(app.version)}</p> <p class="mt-3 text-foreground">${escape_html(app.description ?? "No description available.")}</p></div> <div class="flex flex-col gap-2 shrink-0">`);
              if (!isInstalled) {
                $$renderer4.push("<!--[0-->");
                Button($$renderer4, {
                  disabled: loading || app.status !== "active",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->${escape_html(loading ? "Installing..." : "Install")}`);
                  },
                  $$slots: { default: true }
                });
              } else if (!isActive) {
                $$renderer4.push("<!--[1-->");
                Button($$renderer4, {
                  variant: "success",
                  disabled: loading,
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->${escape_html(loading ? "Activating..." : "Activate")}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----> `);
                Button($$renderer4, {
                  variant: "destructive",
                  disabled: loading,
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->Uninstall`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!---->`);
              } else {
                $$renderer4.push("<!--[-1-->");
                Badge($$renderer4, {
                  variant: "success",
                  class: "px-5 py-2 text-center",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->Active`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----> `);
                Button($$renderer4, {
                  variant: "destructive",
                  disabled: loading,
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->Uninstall`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!---->`);
              }
              $$renderer4.push(`<!--]--></div></div>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----> `);
      if (error) {
        $$renderer2.push("<!--[0-->");
        Alert($$renderer2, {
          variant: "destructive",
          class: "mt-4",
          children: ($$renderer3) => {
            $$renderer3.push(`<p>${escape_html(error)}</p>`);
          },
          $$slots: { default: true }
        });
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (capabilities.length > 0) {
        $$renderer2.push("<!--[0-->");
        Card($$renderer2, {
          class: "mt-6",
          children: ($$renderer3) => {
            Card_header($$renderer3, {
              children: ($$renderer4) => {
                Card_title($$renderer4, {
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->Capabilities`);
                  },
                  $$slots: { default: true }
                });
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!----> `);
            Card_content($$renderer3, {
              children: ($$renderer4) => {
                $$renderer4.push(`<div class="flex flex-wrap gap-2"><!--[-->`);
                const each_array = ensure_array_like(capabilities);
                for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                  let cap = each_array[$$index];
                  Badge($$renderer4, {
                    variant: "secondary",
                    children: ($$renderer5) => {
                      $$renderer5.push(`<!---->${escape_html(cap.replace(/-/g, " "))}`);
                    },
                    $$slots: { default: true }
                  });
                }
                $$renderer4.push(`<!--]--></div>`);
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!---->`);
          },
          $$slots: { default: true }
        });
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (isInstalled && configFields.length > 0) {
        $$renderer2.push("<!--[0-->");
        Card($$renderer2, {
          class: "mt-6",
          children: ($$renderer3) => {
            Card_header($$renderer3, {
              children: ($$renderer4) => {
                Card_title($$renderer4, {
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->Configuration`);
                  },
                  $$slots: { default: true }
                });
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!----> `);
            Card_content($$renderer3, {
              children: ($$renderer4) => {
                ConfigForm($$renderer4, {
                  fields: configFields,
                  values: configValues,
                  loading,
                  onSubmit: handleConfigSave
                });
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!---->`);
          },
          $$slots: { default: true }
        });
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (install) {
        $$renderer2.push("<!--[0-->");
        Card($$renderer2, {
          class: "mt-6",
          children: ($$renderer3) => {
            Card_header($$renderer3, {
              children: ($$renderer4) => {
                Card_title($$renderer4, {
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->Installation Details`);
                  },
                  $$slots: { default: true }
                });
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!----> `);
            Card_content($$renderer3, {
              children: ($$renderer4) => {
                $$renderer4.push(`<dl class="grid grid-cols-2 gap-4 text-sm"><div><dt class="text-muted-foreground">Status</dt> <dd class="font-medium capitalize">${escape_html(install.status)}</dd></div> <div><dt class="text-muted-foreground">Installed</dt> <dd class="font-medium">${escape_html(new Date(install.installed_at).toLocaleDateString())}</dd></div> `);
                if (install.activated_at) {
                  $$renderer4.push("<!--[0-->");
                  $$renderer4.push(`<div><dt class="text-muted-foreground">Activated</dt> <dd class="font-medium">${escape_html(new Date(install.activated_at).toLocaleDateString())}</dd></div>`);
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--> <div><dt class="text-muted-foreground">Auth Model</dt> <dd class="font-medium uppercase">${escape_html(app.auth_model)}</dd></div></dl>`);
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!---->`);
          },
          $$slots: { default: true }
        });
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (app.documentation_url) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mt-6 text-center"><a${attr("href", app.documentation_url)} target="_blank" rel="noopener noreferrer" class="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1">View Documentation `);
        External_link($$renderer2, { class: "h-3 w-3" });
        $$renderer2.push(`<!----></a></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { data });
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BsVB3nz_.js.map
