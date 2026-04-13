<script lang="ts">
  import { goto } from "$app/navigation";
  import { ShieldCheck, ArrowRight, AlertCircle } from "lucide-svelte";

  let email = $state("");
  let password = $state("");
  let error = $state("");
  let loading = $state(false);

  const API_BASE = import.meta.env?.VITE_API_URL ?? "";

  async function handleLogin() {
    error = "";
    loading = true;
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error = (data as { message?: string }).message ?? `Login failed (${res.status})`;
        return;
      }

      const data = (await res.json()) as {
        token?: string;
        userId?: string;
        tenantId?: string;
        role?: string;
      };

      if (data.token) {
        sessionStorage.setItem("atlasit_token", data.token);
        sessionStorage.setItem(
          "atlasit_user",
          JSON.stringify({
            userId: data.userId,
            email,
            tenantId: data.tenantId,
            role: data.role,
          }),
        );
        await goto("/console");
      } else {
        error = "No token received";
      }
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign in · AtlasIT</title>
  <meta name="description" content="Sign in to AtlasIT — IT automation and compliance for modern teams." />
</svelte:head>

<div class="min-h-dvh bg-background flex flex-col">
  <!-- Decorative gradient backdrop -->
  <div class="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
    <div class="absolute -top-40 -right-32 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl"></div>
    <div class="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-info/8 blur-3xl"></div>
  </div>

  <!-- Top brand bar -->
  <header class="container-page py-5 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 group">
      <div class="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
        <ShieldCheck class="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span class="font-semibold text-lg tracking-tight">AtlasIT</span>
    </a>
    <a href="/signup" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
      Don't have an account? <span class="text-primary font-medium ml-1">Sign up →</span>
    </a>
  </header>

  <!-- Centered card -->
  <main class="flex-1 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-[400px] animate-slide-up">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p class="mt-2 text-sm text-muted-foreground">Sign in to your AtlasIT workspace.</p>
      </div>

      <div class="surface p-6 sm:p-8 shadow-sm">
        {#if error}
          <div role="alert" class="mb-5 flex items-start gap-2.5 p-3 bg-destructive-muted border border-destructive/20 rounded-lg text-sm text-destructive">
            <AlertCircle class="h-4 w-4 mt-0.5 shrink-0" strokeWidth={2.25} />
            <span>{error}</span>
          </div>
        {/if}

        <form on:submit|preventDefault={handleLogin} class="space-y-4">
          <div>
            <label for="email" class="block text-xs font-medium text-foreground mb-1.5">
              Work email
            </label>
            <input
              id="email"
              type="email"
              bind:value={email}
              required
              autocomplete="email"
              autofocus
              placeholder="you@company.com"
              class="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="password" class="block text-xs font-medium text-foreground">Password</label>
              <a href="/login/forgot" class="text-2xs text-muted-foreground hover:text-primary transition-colors">Forgot?</a>
            </div>
            <input
              id="password"
              type="password"
              bind:value={password}
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            class="group w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium shadow-xs transition-all duration-fast focus-visible:outline-none focus-visible:shadow-ring-primary disabled:opacity-50 disabled:pointer-events-none"
          >
            {#if loading}
              <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
                <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
              Signing in…
            {:else}
              Sign in
              <ArrowRight class="h-3.5 w-3.5 transition-transform duration-fast group-hover:translate-x-0.5" strokeWidth={2.25} />
            {/if}
          </button>
        </form>

        <div class="my-5 flex items-center gap-3">
          <div class="flex-1 h-px bg-border"></div>
          <span class="text-2xs text-muted-foreground uppercase tracking-wider">or</span>
          <div class="flex-1 h-px bg-border"></div>
        </div>

        <p class="text-xs text-center text-muted-foreground">
          Need help signing in? <a href="/support" class="text-primary hover:underline font-medium">Contact support</a>
        </p>
      </div>

      <p class="mt-6 text-center text-xs text-muted-foreground/80">
        By signing in you agree to our
        <a href="/terms" class="hover:text-foreground underline">Terms</a>
        and
        <a href="/privacy" class="hover:text-foreground underline">Privacy Policy</a>.
      </p>
    </div>
  </main>
</div>
