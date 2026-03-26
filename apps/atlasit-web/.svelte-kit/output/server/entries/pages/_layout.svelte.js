import {
  A as current_component,
  B as ensure_array_like,
  D as attr_class,
  E as stringify,
  F as store_get,
  G as slot,
  I as unsubscribe_stores,
} from "../../chunks/index2.js";
import { p as page } from "../../chunks/stores.js";
import { w as writable } from "../../chunks/index.js";
import { e as escape_html } from "../../chunks/attributes.js";
import "clsx";
function onDestroy(fn) {
  var context =
    /** @type {Component} */
    current_component;
  (context.d ??= []).push(fn);
}
function createStore() {
  const { subscribe, update, set } = writable([]);
  function push(t) {
    const toast2 = {
      id: crypto.randomUUID(),
      variant: "info",
      timeout: 4e3,
      dismissible: true,
      ...t,
    };
    update((list) => [...list, toast2]);
    if (toast2.timeout && toast2.timeout > 0) {
      setTimeout(() => dismiss(toast2.id), toast2.timeout);
    }
    return toast2.id;
  }
  function dismiss(id) {
    update((list) => list.filter((t) => t.id !== id));
  }
  function clear() {
    set([]);
  }
  return { subscribe, push, dismiss, clear };
}
const toasts = createStore();
function ToastHost($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let list = [];
    const unsub = toasts.subscribe((v) => (list = v));
    onDestroy(unsub);
    $$renderer2.push(
      `<div class="toast-region svelte-53xc05" aria-live="polite" aria-atomic="false"><!--[-->`,
    );
    const each_array = ensure_array_like(list);
    for (
      let $$index = 0, $$length = each_array.length;
      $$index < $$length;
      $$index++
    ) {
      let t = each_array[$$index];
      $$renderer2.push(
        `<div${attr_class(`toast ${stringify(t.variant)}`, "svelte-53xc05")} role="status"><div class="msg svelte-53xc05">${escape_html(t.message)}</div> `,
      );
      if (t.dismissible !== false) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<button class="close svelte-53xc05" aria-label="Dismiss">×</button>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function OfflineBanner($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let current;
    let mobileOpen = false;
    const isActive = (p) =>
      current === p || (p !== "/" && current.startsWith(p + "/"));
    current = store_get(($$store_subs ??= {}), "$page", page).url.pathname;
    $$renderer2.push(
      `<header class="shell svelte-12qhfyh"><nav class="nav-bar svelte-12qhfyh"><div class="left svelte-12qhfyh"><a href="/" class="logo svelte-12qhfyh"><span class="badge svelte-12qhfyh">AI</span> <span class="name svelte-12qhfyh">AtlasIT</span></a> <div class="desktop-links svelte-12qhfyh"><a href="/governance/compliance"${attr_class("nav-link svelte-12qhfyh", void 0, { active: isActive("/governance/compliance") })}>Dashboard</a> <a href="/onboarding"${attr_class("nav-link svelte-12qhfyh", void 0, { active: isActive("/onboarding") })}>Onboarding</a> <a href="/marketplace/slack"${attr_class("nav-link svelte-12qhfyh", void 0, { active: isActive("/marketplace") })}>Marketplace</a> <a href="/orchestrator"${attr_class("nav-link svelte-12qhfyh", void 0, { active: isActive("/orchestrator") })}>Orchestrator</a> <a href="/api-manager"${attr_class("nav-link svelte-12qhfyh", void 0, { active: isActive("/api-manager") })}>API Manager</a> <a href="/workflows"${attr_class("nav-link gradient svelte-12qhfyh", void 0, { active: isActive("/workflows") })}>JML Demo</a> <div class="dd svelte-12qhfyh" data-label="IT"><button class="nav-link dd-btn svelte-12qhfyh">IT <svg viewBox="0 0 24 24" class="svelte-12qhfyh"><path d="M19 9l-7 7-7-7"></path></svg></button> <div class="dd-menu svelte-12qhfyh"><a href="/it/policies/templates"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/it/policies/templates") })}>Policies</a> <a href="/it/backup"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/it/backup") })}>Backup &amp; Recovery</a></div></div> <div class="dd svelte-12qhfyh" data-label="Security"><button class="nav-link dd-btn svelte-12qhfyh">Security <svg viewBox="0 0 24 24" class="svelte-12qhfyh"><path d="M19 9l-7 7-7-7"></path></svg></button> <div class="dd-menu svelte-12qhfyh"><a href="/security/incidents"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/security/incidents") })}>Security Center</a> <a href="/security/activity"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/security/activity") })}>Scanner</a></div></div> <div class="dd svelte-12qhfyh" data-label="Governance"><button class="nav-link dd-btn svelte-12qhfyh">Governance <svg viewBox="0 0 24 24" class="svelte-12qhfyh"><path d="M19 9l-7 7-7-7"></path></svg></button> <div class="dd-menu svelte-12qhfyh"><a href="/governance/compliance"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/governance/compliance") })}>Compliance</a> <a href="/governance/evidence"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/governance/evidence") })}>Evidence</a></div></div></div></div> <div class="right svelte-12qhfyh"><div class="divider svelte-12qhfyh"></div> <a href="/login" class="btn blue svelte-12qhfyh">Login</a> <a href="/register" class="btn purple svelte-12qhfyh">Register</a> <button class="mobile-toggle svelte-12qhfyh" aria-label="Menu"><svg viewBox="0 0 24 24" class="svelte-12qhfyh"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg></button></div></nav> <div${attr_class("mobile-menu svelte-12qhfyh", void 0, { open: mobileOpen })}><a href="/governance/compliance"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/governance/compliance") })}>Dashboard</a> <a href="/onboarding"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/onboarding") })}>Onboarding</a> <a href="/marketplace/slack"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/marketplace") })}>Marketplace</a> <a href="/orchestrator"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/orchestrator") })}>Orchestrator</a> <a href="/api-manager"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/api-manager") })}>API Manager</a> <a href="/it/policies/templates"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/it/policies/templates") })}>IT Policies</a> <a href="/it/backup"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/it/backup") })}>Backup &amp; Recovery</a> <a href="/security/incidents"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/security/incidents") })}>Security Center</a> <a href="/security/activity"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/security/activity") })}>Scanner</a> <a href="/governance/compliance"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/governance/compliance") })}>Compliance</a> <a href="/governance/evidence"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/governance/evidence") })}>Evidence</a> <div class="mobile-auth svelte-12qhfyh"><a href="/login" class="btn blue block svelte-12qhfyh">Login</a> <a href="/register" class="btn purple block svelte-12qhfyh">Register</a></div></div> <div class="demo-banner svelte-12qhfyh">DEMO MODE · SAMPLE DATA RESETS REGULARLY AND IS NOT PRODUCTION</div></header> <main class="main-container svelte-12qhfyh"><!--[-->`,
    );
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></main> `);
    ToastHost($$renderer2);
    $$renderer2.push(`<!----> `);
    OfflineBanner($$renderer2);
    $$renderer2.push(`<!---->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export { _layout as default };
//# sourceMappingURL=_layout.svelte.js.map
