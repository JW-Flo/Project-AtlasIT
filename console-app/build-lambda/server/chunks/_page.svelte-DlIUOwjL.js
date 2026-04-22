import { ac as head, al as attr } from './renderer-CwxN8JkH.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import { S as Shield_check } from './shield-check-DC5MZnbP.js';
import { A as Arrow_right } from './arrow-right-QFdd_4wx.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let email = "";
    let password = "";
    let loading = false;
    head("s0gs84", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Sign in · AtlasIT</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Sign in to AtlasIT — IT automation and compliance for modern teams."/>`);
    });
    $$renderer2.push(`<div class="min-h-dvh bg-background flex flex-col"><div class="absolute inset-0 -z-10 overflow-hidden pointer-events-none"><div class="absolute -top-40 -right-32 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl"></div> <div class="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-info/8 blur-3xl"></div></div> <header class="container-page py-5 flex items-center justify-between gap-4 flex-wrap"><a href="/" class="flex items-center gap-2 group shrink-0"><div class="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">`);
    Shield_check($$renderer2, {
      class: "h-4.5 w-4.5 text-primary-foreground",
      strokeWidth: 2.5
    });
    $$renderer2.push(`<!----></div> <span class="font-semibold text-lg tracking-tight">AtlasIT</span></a> <a href="/signup" class="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"><span class="hidden sm:inline">Don't have an account?</span><span class="text-primary font-medium sm:ml-1">Sign up →</span></a></header> <main class="flex-1 flex items-center justify-center px-4 py-12"><div class="w-full max-w-[400px] animate-slide-up"><div class="text-center mb-8"><h1 class="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1> <p class="mt-2 text-sm text-muted-foreground">Sign in to your AtlasIT workspace.</p></div> <div class="surface p-6 sm:p-8 shadow-sm">`);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <form class="space-y-4"><div><label for="email" class="block text-xs font-medium text-foreground mb-1.5">Work email</label> <input id="email" type="email"${attr("value", email)} required="" autocomplete="email" autofocus="" placeholder="you@company.com" class="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary"/></div> <div><div class="flex items-center justify-between mb-1.5"><label for="password" class="block text-xs font-medium text-foreground">Password</label> <a href="/login/forgot" class="text-2xs text-muted-foreground hover:text-primary transition-colors">Forgot?</a></div> <input id="password" type="password"${attr("value", password)} required="" autocomplete="current-password" placeholder="••••••••" class="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary"/></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button type="submit"${attr("disabled", loading, true)} class="group w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium shadow-xs transition-all duration-fast focus-visible:outline-none focus-visible:shadow-ring-primary disabled:opacity-50 disabled:pointer-events-none">`);
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`Sign in `);
      Arrow_right($$renderer2, {
        class: "h-3.5 w-3.5 transition-transform duration-fast group-hover:translate-x-0.5",
        strokeWidth: 2.25
      });
      $$renderer2.push(`<!---->`);
    }
    $$renderer2.push(`<!--]--></button></form> <div class="my-5 flex items-center gap-3"><div class="flex-1 h-px bg-border"></div> <span class="text-2xs text-muted-foreground uppercase tracking-wider">or</span> <div class="flex-1 h-px bg-border"></div></div> <a href="/demo" class="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors">Try interactive demo</a> <p class="text-xs text-center text-muted-foreground">Need help signing in? <a href="/support" class="text-primary hover:underline font-medium">Contact support</a></p></div> <p class="mt-6 text-center text-xs text-muted-foreground/80">By signing in you agree to our <a href="/terms" class="hover:text-foreground underline">Terms</a> and <a href="/privacy" class="hover:text-foreground underline">Privacy Policy</a>.</p></div></main></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DlIUOwjL.js.map
