<script lang="ts">
  let fullName = $state("");
  let companyName = $state("");
  let email = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let showPassword = $state(false);
  let loading = $state(false);

  let fieldErrors = $state<Record<string, string>>({});
  let globalError = $state("");

  const API_BASE = import.meta.env?.VITE_API_URL ?? "";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = "Full name must be at least 2 characters";
    }
    if (!companyName.trim() || companyName.trim().length < 2) {
      errs.companyName = "Company name must be at least 2 characters";
    }
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = "Please enter a valid work email address";
    }
    if (!password || password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    fieldErrors = errs;
    return Object.keys(errs).length === 0;
  }

  async function handleSignup() {
    globalError = "";
    fieldErrors = {};

    if (!validate()) return;

    loading = true;
    try {
      // Step 1: Create tenant + admin user
      const signupRes = await fetch(`${API_BASE}/api/onboarding/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          companyName: companyName.trim(),
          fullName: fullName.trim(),
        }),
      });

      const signupData = (await signupRes.json()) as {
        status?: string;
        message?: string;
        code?: string;
        data?: { tenantId?: string; userId?: string };
      };

      if (!signupRes.ok) {
        if (signupRes.status === 409 || signupData.code === "EMAIL_EXISTS") {
          fieldErrors = { email: signupData.message ?? "An account with this email already exists" };
        } else if (signupData.code === "VALIDATION_FAILED") {
          const msg = signupData.message ?? "Please check your inputs";
          if (msg.toLowerCase().includes("email")) fieldErrors = { email: msg };
          else if (msg.toLowerCase().includes("password")) fieldErrors = { password: msg };
          else if (msg.toLowerCase().includes("company")) fieldErrors = { companyName: msg };
          else if (msg.toLowerCase().includes("full name")) fieldErrors = { fullName: msg };
          else globalError = msg;
        } else {
          globalError = signupData.message ?? `Signup failed (${signupRes.status})`;
        }
        return;
      }

      // Step 2: Auto-login with the new credentials
      const tokenRes = await fetch(`${API_BASE}/api/v1/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const tokenData = (await tokenRes.json()) as {
        token?: string;
        userId?: string;
        tenantId?: string;
        role?: string;
        message?: string;
      };

      if (!tokenRes.ok || !tokenData.token) {
        // Signup worked but auto-login failed — redirect to login page
        window.location.href = "/login";
        return;
      }

      sessionStorage.setItem("atlasit_token", tokenData.token);
      sessionStorage.setItem(
        "atlasit_user",
        JSON.stringify({
          userId: tokenData.userId ?? signupData.data?.userId,
          email: email.trim().toLowerCase(),
          tenantId: tokenData.tenantId ?? signupData.data?.tenantId,
          role: tokenData.role ?? "admin",
        }),
      );
      window.location.href = "/console/onboarding";
    } catch (e) {
      globalError = (e as Error).message ?? "An unexpected error occurred";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Create account · AtlasIT</title>
  <meta name="description" content="Start your free trial of AtlasIT — IT automation and compliance for modern teams. No credit card required." />
</svelte:head>

<div class="min-h-dvh bg-background flex flex-col">
  <!-- Decorative gradient backdrop -->
  <div class="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
    <div class="absolute -top-40 -right-32 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl"></div>
    <div class="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-info/8 blur-3xl"></div>
  </div>

  <!-- Top brand bar -->
  <header class="container-page py-5 flex items-center justify-between gap-4 flex-wrap">
    <a href="/" class="flex items-center gap-2 group shrink-0">
      <div class="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
        <svg viewBox="0 0 24 24" fill="none" class="h-4.5 w-4.5 text-primary-foreground" stroke="currentColor" stroke-width="2.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <span class="font-semibold text-lg tracking-tight">AtlasIT</span>
    </a>
    <a href="/login" class="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
      <span class="hidden sm:inline">Already have an account? </span><span class="text-primary font-medium sm:ml-1">Sign in →</span>
    </a>
  </header>

  <main class="flex-1 grid lg:grid-cols-[1fr,440px] gap-12 container-page py-8 lg:py-12 max-w-6xl items-start">
    <!-- Left: value props (hidden on small) -->
    <aside class="hidden lg:block pt-12 pr-4">
      <h1 class="text-4xl font-semibold tracking-tight text-foreground leading-tight">
        Compliance is a <span class="text-primary">byproduct</span> of running IT operations — not a separate tool.
      </h1>
      <p class="mt-4 text-md text-muted-foreground leading-relaxed">
        Connect your apps, run JML automation, and generate audit-ready evidence automatically across SOC 2, ISO 27001, NIST CSF, HIPAA, and GDPR.
      </p>
      <ul class="mt-8 space-y-3 text-sm text-foreground">
        {#each [
          { title: '35+ adapters', body: 'Okta, Google Workspace, M365, Slack, GitHub, Stripe, AWS, Azure, GCP and more.' },
          { title: 'Evidence-grounded scoring', body: 'Real operations data, not checkboxes — credible enough for actual auditors.' },
          { title: 'Trust center + auditor PDFs', body: 'Embeddable badges, public score pages, and signed reports out of the box.' },
        ] as item}
          <li class="flex gap-3">
            <div class="shrink-0 mt-1 w-5 h-5 rounded-full bg-success-muted text-success flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="w-3 h-3">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div class="font-medium">{item.title}</div>
              <p class="text-muted-foreground text-sm">{item.body}</p>
            </div>
          </li>
        {/each}
      </ul>
      <div class="mt-10 pt-8 border-t border-border">
        <p class="text-2xs uppercase tracking-wider text-muted-foreground/80 font-semibold mb-3">Why teams switch</p>
        <blockquote class="text-sm text-foreground leading-relaxed border-l-2 border-primary/40 pl-4 italic">
          "We replaced JumpCloud + Vanta with AtlasIT. Half the cost, one platform, and the compliance evidence is actually credible because it comes from our real operations."
        </blockquote>
      </div>
    </aside>

    <!-- Right: signup card -->
    <div class="w-full animate-slide-up">
      <div class="text-center mb-6 lg:hidden">
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">Create your account</h1>
        <p class="mt-1.5 text-sm text-muted-foreground">Free trial, no credit card.</p>
      </div>

      <div class="surface p-6 sm:p-7 shadow-sm">
        <div class="hidden lg:block mb-6">
          <h2 class="text-xl font-semibold tracking-tight text-foreground">Create your account</h2>
          <p class="mt-1 text-sm text-muted-foreground">Free trial — no credit card required.</p>
        </div>

        {#if globalError}
          <div role="alert" class="mb-5 flex items-start gap-2.5 p-3 bg-destructive-muted border border-destructive/20 rounded-lg text-sm text-destructive">
            <svg class="h-4 w-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span>{globalError}</span>
          </div>
        {/if}

        <form on:submit|preventDefault={handleSignup} class="space-y-4">
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label for="fullName" class="block text-xs font-medium text-foreground mb-1.5">Full name</label>
              <input
                id="fullName"
                type="text"
                bind:value={fullName}
                autocomplete="name"
                placeholder="Jane Smith"
                aria-invalid={Boolean(fieldErrors.fullName)}
                class="w-full h-10 px-3 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary {fieldErrors.fullName ? 'border-destructive' : 'border-input'}"
              />
              {#if fieldErrors.fullName}
                <p class="mt-1 text-2xs text-destructive">{fieldErrors.fullName}</p>
              {/if}
            </div>
            <div>
              <label for="companyName" class="block text-xs font-medium text-foreground mb-1.5">Company name</label>
              <input
                id="companyName"
                type="text"
                bind:value={companyName}
                autocomplete="organization"
                placeholder="Acme Corp"
                aria-invalid={Boolean(fieldErrors.companyName)}
                class="w-full h-10 px-3 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary {fieldErrors.companyName ? 'border-destructive' : 'border-input'}"
              />
              {#if fieldErrors.companyName}
                <p class="mt-1 text-2xs text-destructive">{fieldErrors.companyName}</p>
              {/if}
            </div>
          </div>

          <div>
            <label for="email" class="block text-xs font-medium text-foreground mb-1.5">Work email</label>
            <input
              id="email"
              type="email"
              bind:value={email}
              autocomplete="email"
              placeholder="you@company.com"
              aria-invalid={Boolean(fieldErrors.email)}
              class="w-full h-10 px-3 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary {fieldErrors.email ? 'border-destructive' : 'border-input'}"
            />
            {#if fieldErrors.email}
              <p class="mt-1 text-2xs text-destructive">{fieldErrors.email}</p>
            {/if}
          </div>

          <div>
            <label for="password" class="block text-xs font-medium text-foreground mb-1.5">Password</label>
            <div class="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                bind:value={password}
                autocomplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={Boolean(fieldErrors.password)}
                class="w-full h-10 px-3 pr-10 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary {fieldErrors.password ? 'border-destructive' : 'border-input'}"
              />
              <button
                type="button"
                on:click={() => (showPassword = !showPassword)}
                class="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {#if showPassword}
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                {:else}
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {/if}
              </button>
            </div>
            {#if fieldErrors.password}
              <p class="mt-1 text-2xs text-destructive">{fieldErrors.password}</p>
            {/if}
          </div>

          <div>
            <label for="confirmPassword" class="block text-xs font-medium text-foreground mb-1.5">Confirm password</label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              bind:value={confirmPassword}
              autocomplete="new-password"
              placeholder="Re-enter your password"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              class="w-full h-10 px-3 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary {fieldErrors.confirmPassword ? 'border-destructive' : 'border-input'}"
            />
            {#if fieldErrors.confirmPassword}
              <p class="mt-1 text-2xs text-destructive">{fieldErrors.confirmPassword}</p>
            {/if}
          </div>

          <button
            type="submit"
            disabled={loading}
            class="group w-full h-10 mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium shadow-xs transition-all duration-fast focus-visible:outline-none focus-visible:shadow-ring-primary disabled:opacity-50 disabled:pointer-events-none"
          >
            {#if loading}
              <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
                <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
              Creating account…
            {:else}
              Create account
            {/if}
          </button>
        </form>

        <p class="mt-5 text-center text-xs text-muted-foreground">
          Already have an account?
          <a href="/login" class="text-primary hover:underline font-medium">Sign in</a>
        </p>
      </div>

      <p class="mt-6 text-center text-xs text-muted-foreground/80">
        By creating an account you agree to our
        <a href="/terms" class="hover:text-foreground underline">Terms</a>
        and
        <a href="/privacy" class="hover:text-foreground underline">Privacy Policy</a>.
      </p>
    </div>
  </main>
</div>
