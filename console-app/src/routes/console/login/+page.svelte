<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let mode: "login" | "register" = "login";
  let email = "";
  let password = "";
  let displayName = "";
  let orgName = "";
  let error = "";
  let loading = false;

  async function login() {
    loading = true;
    error = "";
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (resp.ok) {
        goto("/console");
      } else {
        const data = await resp.json();
        error = data.error || "Login failed";
      }
    } catch (e) {
      error = "Network error";
    }
    loading = false;
  }

  async function register() {
    loading = true;
    error = "";
    try {
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, displayName, orgName }),
      });
      const data = await resp.json();
      if (resp.ok) {
        // Auto-login after registration
        await login();
      } else {
        error = data.error || "Registration failed";
      }
    } catch (e) {
      error = "Network error";
    }
    loading = false;
  }

  function handleSubmit() {
    if (mode === "login") login();
    else register();
  }

  onMount(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) goto("/console");
      });
  });
</script>

<div class="min-h-screen flex items-center justify-center" style="background: var(--color-bg, #0f1923);">
  <div class="max-w-md w-full space-y-6 px-4">
    <div class="text-center">
      <div class="text-4xl font-bold mb-2" style="color: var(--color-accent, #3b82f6);">AtlasIT</div>
      <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.6;">
        {mode === "login" ? "Sign in to your account" : "Create your account"}
      </p>
    </div>

    <!-- Tab toggle -->
    <div class="flex rounded-lg overflow-hidden border" style="border-color: var(--color-border, rgba(255,255,255,0.1));">
      <button
        type="button"
        class="flex-1 py-2.5 text-sm font-medium transition-colors"
        style="background: {mode === 'login' ? 'var(--color-accent, #3b82f6)' : 'transparent'}; color: {mode === 'login' ? '#fff' : 'var(--color-text, #fff)'}; opacity: {mode === 'login' ? 1 : 0.5};"
        on:click={() => { mode = "login"; error = ""; }}
      >
        Sign In
      </button>
      <button
        type="button"
        class="flex-1 py-2.5 text-sm font-medium transition-colors"
        style="background: {mode === 'register' ? 'var(--color-accent, #3b82f6)' : 'transparent'}; color: {mode === 'register' ? '#fff' : 'var(--color-text, #fff)'}; opacity: {mode === 'register' ? 1 : 0.5};"
        on:click={() => { mode = "register"; error = ""; }}
      >
        Create Account
      </button>
    </div>

    <form class="space-y-4" on:submit|preventDefault={handleSubmit}>
      <div class="rounded-lg p-6 space-y-4" style="background: var(--color-surface, #1a2332);">
        {#if mode === "register"}
          <div>
            <label for="orgName" class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Organization Name</label>
            <input
              id="orgName"
              type="text"
              bind:value={orgName}
              placeholder="Acme Corp"
              class="w-full px-3 py-2 rounded text-sm focus:outline-none"
              style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
            />
          </div>
          <div>
            <label for="displayName" class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Full Name</label>
            <input
              id="displayName"
              type="text"
              bind:value={displayName}
              placeholder="Jane Smith"
              class="w-full px-3 py-2 rounded text-sm focus:outline-none"
              style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
            />
          </div>
        {/if}

        <div>
          <label for="email" class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Email</label>
          <input
            id="email"
            type="email"
            required
            bind:value={email}
            placeholder="you@company.com"
            class="w-full px-3 py-2 rounded text-sm focus:outline-none"
            style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
          />
        </div>

        <div>
          <label for="password" class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Password</label>
          <input
            id="password"
            type="password"
            required
            bind:value={password}
            placeholder={mode === "register" ? "Min 8 characters" : "Enter password"}
            class="w-full px-3 py-2 rounded text-sm focus:outline-none"
            style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
          />
        </div>
      </div>

      {#if error}
        <div class="text-sm text-red-400 bg-red-900/20 rounded-lg p-3">{error}</div>
      {/if}

      <button
        type="submit"
        disabled={loading}
        class="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
        style="background: var(--color-accent, #3b82f6);"
      >
        {#if loading}
          {mode === "login" ? "Signing in..." : "Creating account..."}
        {:else}
          {mode === "login" ? "Sign In" : "Create Account"}
        {/if}
      </button>

      <div class="text-center mt-2">
        <a href="/console/onboarding" class="text-xs" style="color: var(--color-accent, #3b82f6);">
          New organization? Set up with guided wizard
        </a>
      </div>
    </form>
  </div>
</div>
