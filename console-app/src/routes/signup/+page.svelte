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
      window.location.href = "/console";
    } catch (e) {
      globalError = (e as Error).message ?? "An unexpected error occurred";
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
  <div class="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <h1 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
      Create your AtlasIT account
    </h1>
    <p class="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
      Start your free trial — no credit card required
    </p>

    {#if globalError}
      <div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
        {globalError}
      </div>
    {/if}

    <form on:submit|preventDefault={handleSignup} class="space-y-4">
      <!-- Full name -->
      <div>
        <label for="fullName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          bind:value={fullName}
          autocomplete="name"
          placeholder="Jane Smith"
          class="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent {fieldErrors.fullName ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}"
        />
        {#if fieldErrors.fullName}
          <p class="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.fullName}</p>
        {/if}
      </div>

      <!-- Company name -->
      <div>
        <label for="companyName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Company name
        </label>
        <input
          id="companyName"
          type="text"
          bind:value={companyName}
          autocomplete="organization"
          placeholder="Acme Corp"
          class="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent {fieldErrors.companyName ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}"
        />
        {#if fieldErrors.companyName}
          <p class="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.companyName}</p>
        {/if}
      </div>

      <!-- Work email -->
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Work email
        </label>
        <input
          id="email"
          type="email"
          bind:value={email}
          autocomplete="email"
          placeholder="you@company.com"
          class="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent {fieldErrors.email ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}"
        />
        {#if fieldErrors.email}
          <p class="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
        {/if}
      </div>

      <!-- Password with visibility toggle -->
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <div class="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            bind:value={password}
            autocomplete="new-password"
            placeholder="At least 8 characters"
            class="w-full px-3 py-2 pr-10 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent {fieldErrors.password ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}"
          />
          <button
            type="button"
            on:click={() => (showPassword = !showPassword)}
            class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {#if showPassword}
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
              </svg>
            {:else}
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            {/if}
          </button>
        </div>
        {#if fieldErrors.password}
          <p class="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>
        {/if}
      </div>

      <!-- Confirm password -->
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          bind:value={confirmPassword}
          autocomplete="new-password"
          placeholder="Re-enter your password"
          class="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent {fieldErrors.confirmPassword ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}"
        />
        {#if fieldErrors.confirmPassword}
          <p class="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.confirmPassword}</p>
        {/if}
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors mt-2"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
      Already have an account?
      <a href="/login" class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
        Sign in
      </a>
    </p>
  </div>
</div>
