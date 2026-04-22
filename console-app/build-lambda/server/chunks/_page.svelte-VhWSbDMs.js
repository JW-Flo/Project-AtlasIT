import { ac as head, ao as ensure_array_like, an as escape_html, al as attr, aj as attr_class, ak as stringify } from './renderer-CwxN8JkH.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let fullName = "";
    let companyName = "";
    let email = "";
    let password = "";
    let confirmPassword = "";
    let loading = false;
    let fieldErrors = {};
    head("7bul3h", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Create account · AtlasIT</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Start your free trial of AtlasIT — IT automation and compliance for modern teams. No credit card required."/>`);
    });
    $$renderer2.push(`<div class="min-h-dvh bg-background flex flex-col"><div class="absolute inset-0 -z-10 overflow-hidden pointer-events-none"><div class="absolute -top-40 -right-32 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl"></div> <div class="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-info/8 blur-3xl"></div></div> <header class="container-page py-5 flex items-center justify-between gap-4 flex-wrap"><a href="/" class="flex items-center gap-2 group shrink-0"><div class="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow"><svg viewBox="0 0 24 24" fill="none" class="h-4.5 w-4.5 text-primary-foreground" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div> <span class="font-semibold text-lg tracking-tight">AtlasIT</span></a> <a href="/login" class="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"><span class="hidden sm:inline">Already have an account?</span><span class="text-primary font-medium sm:ml-1">Sign in →</span></a></header> <main class="flex-1 grid lg:grid-cols-[1fr,440px] gap-12 container-page py-8 lg:py-12 max-w-6xl items-start"><aside class="hidden lg:block pt-12 pr-4"><h1 class="text-4xl font-semibold tracking-tight text-foreground leading-tight">Compliance is a <span class="text-primary">byproduct</span> of running IT operations — not a separate tool.</h1> <p class="mt-4 text-md text-muted-foreground leading-relaxed">Connect your apps, run JML automation, and generate audit-ready evidence automatically across SOC 2, ISO 27001, NIST CSF, HIPAA, and GDPR.</p> <ul class="mt-8 space-y-3 text-sm text-foreground"><!--[-->`);
    const each_array = ensure_array_like([
      {
        title: "35+ adapters",
        body: "Okta, Google Workspace, M365, Slack, GitHub, Stripe, AWS, Azure, GCP and more."
      },
      {
        title: "Evidence-grounded scoring",
        body: "Real operations data, not checkboxes — credible enough for actual auditors."
      },
      {
        title: "Trust center + auditor PDFs",
        body: "Embeddable badges, public score pages, and signed reports out of the box."
      }
    ]);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$renderer2.push(`<li class="flex gap-3"><div class="shrink-0 mt-1 w-5 h-5 rounded-full bg-success-muted text-success flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="w-3 h-3"><path d="M5 13l4 4L19 7"></path></svg></div> <div><div class="font-medium">${escape_html(item.title)}</div> <p class="text-muted-foreground text-sm">${escape_html(item.body)}</p></div></li>`);
    }
    $$renderer2.push(`<!--]--></ul> <div class="mt-10 pt-8 border-t border-border"><p class="text-2xs uppercase tracking-wider text-muted-foreground/80 font-semibold mb-3">Why teams switch</p> <blockquote class="text-sm text-foreground leading-relaxed border-l-2 border-primary/40 pl-4 italic">"We replaced JumpCloud + Vanta with AtlasIT. Half the cost, one platform, and the compliance evidence is actually credible because it comes from our real operations."</blockquote></div></aside> <div class="w-full animate-slide-up"><div class="text-center mb-6 lg:hidden"><h1 class="text-2xl font-semibold tracking-tight text-foreground">Create your account</h1> <p class="mt-1.5 text-sm text-muted-foreground">Free trial, no credit card.</p></div> <div class="surface p-6 sm:p-7 shadow-sm"><div class="hidden lg:block mb-6"><h2 class="text-xl font-semibold tracking-tight text-foreground">Create your account</h2> <p class="mt-1 text-sm text-muted-foreground">Free trial — no credit card required.</p></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <form class="space-y-4"><div class="grid sm:grid-cols-2 gap-4"><div><label for="fullName" class="block text-xs font-medium text-foreground mb-1.5">Full name</label> <input id="fullName" type="text"${attr("value", fullName)} autocomplete="name" placeholder="Jane Smith"${attr("aria-invalid", Boolean(fieldErrors.fullName))}${attr_class(`w-full h-10 px-3 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary ${stringify(fieldErrors.fullName ? "border-destructive" : "border-input")}`)}/> `);
    if (fieldErrors.fullName) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="mt-1 text-2xs text-destructive">${escape_html(fieldErrors.fullName)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div><label for="companyName" class="block text-xs font-medium text-foreground mb-1.5">Company name</label> <input id="companyName" type="text"${attr("value", companyName)} autocomplete="organization" placeholder="Acme Corp"${attr("aria-invalid", Boolean(fieldErrors.companyName))}${attr_class(`w-full h-10 px-3 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary ${stringify(fieldErrors.companyName ? "border-destructive" : "border-input")}`)}/> `);
    if (fieldErrors.companyName) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="mt-1 text-2xs text-destructive">${escape_html(fieldErrors.companyName)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div> <div><label for="email" class="block text-xs font-medium text-foreground mb-1.5">Work email</label> <input id="email" type="email"${attr("value", email)} autocomplete="email" placeholder="you@company.com"${attr("aria-invalid", Boolean(fieldErrors.email))}${attr_class(`w-full h-10 px-3 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary ${stringify(fieldErrors.email ? "border-destructive" : "border-input")}`)}/> `);
    if (fieldErrors.email) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="mt-1 text-2xs text-destructive">${escape_html(fieldErrors.email)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div><label for="password" class="block text-xs font-medium text-foreground mb-1.5">Password</label> <div class="relative"><input id="password"${attr("type", "password")}${attr("value", password)} autocomplete="new-password" placeholder="At least 8 characters"${attr("aria-invalid", Boolean(fieldErrors.password))}${attr_class(`w-full h-10 px-3 pr-10 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary ${stringify(fieldErrors.password ? "border-destructive" : "border-input")}`)}/> <button type="button" class="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"${attr("aria-label", "Show password")}>`);
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`);
    }
    $$renderer2.push(`<!--]--></button></div> `);
    if (fieldErrors.password) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="mt-1 text-2xs text-destructive">${escape_html(fieldErrors.password)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div><label for="confirmPassword" class="block text-xs font-medium text-foreground mb-1.5">Confirm password</label> <input id="confirmPassword"${attr("type", "password")}${attr("value", confirmPassword)} autocomplete="new-password" placeholder="Re-enter your password"${attr("aria-invalid", Boolean(fieldErrors.confirmPassword))}${attr_class(`w-full h-10 px-3 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary ${stringify(fieldErrors.confirmPassword ? "border-destructive" : "border-input")}`)}/> `);
    if (fieldErrors.confirmPassword) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="mt-1 text-2xs text-destructive">${escape_html(fieldErrors.confirmPassword)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <button type="submit"${attr("disabled", loading, true)} class="group w-full h-10 mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium shadow-xs transition-all duration-fast focus-visible:outline-none focus-visible:shadow-ring-primary disabled:opacity-50 disabled:pointer-events-none">`);
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`Create account`);
    }
    $$renderer2.push(`<!--]--></button></form> <p class="mt-5 text-center text-xs text-muted-foreground">Already have an account? <a href="/login" class="text-primary hover:underline font-medium">Sign in</a></p></div> <p class="mt-6 text-center text-xs text-muted-foreground/80">By creating an account you agree to our <a href="/terms" class="hover:text-foreground underline">Terms</a> and <a href="/privacy" class="hover:text-foreground underline">Privacy Policy</a>.</p></div></main></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-VhWSbDMs.js.map
