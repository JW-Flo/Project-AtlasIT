<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  const API_BASE = import.meta.env?.VITE_API_URL ?? "";

  // Invite metadata fetched from token
  let inviteEmail = $state("");
  let inviteTenant = $state("");
  let inviteRole = $state("");
  let inviteDisplayName = $state("");

  // Form fields
  let displayName = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let showPassword = $state(false);

  // Page state
  type Phase = "loading" | "invalid" | "expired" | "accepted" | "form" | "submitting" | "done";
  let phase = $state<Phase>("loading");
  let errorMsg = $state("");
  let rawToken = $state("");

  onMount(async () => {
    rawToken = $page.url.searchParams.get("token") ?? "";
    if (!rawToken) {
      phase = "invalid";
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/auth/invite/${encodeURIComponent(rawToken)}`,
      );
      const data = (await res.json()) as {
        status?: string;
        code?: string;
        message?: string;
        data?: {
          email?: string;
          tenantName?: string;
          role?: string;
          displayName?: string;
          expiresAt?: string;
        };
      };
      if (res.status === 410) {
        phase = data.code === "ACCEPTED" ? "accepted" : "expired";
        return;
      }
      if (!res.ok) {
        phase = "invalid";
        return;
      }
      inviteEmail = data.data?.email ?? "";
      inviteTenant = data.data?.tenantName ?? "";
      inviteRole = data.data?.role ?? "member";
      inviteDisplayName = data.data?.displayName ?? "";
      displayName = inviteDisplayName;
      phase = "form";
    } catch {
      phase = "invalid";
    }
  });

  async function handleAccept() {
    errorMsg = "";
    if (password.length < 8) {
      errorMsg = "Password must be at least 8 characters";
      return;
    }
    if (password !== confirmPassword) {
      errorMsg = "Passwords do not match";
      return;
    }
    phase = "submitting";
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/accept-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: rawToken,
          password,
          displayName: displayName.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        token?: string;
        userId?: string;
        tenantId?: string;
        email?: string;
        role?: string;
        message?: string;
      };
      if (!res.ok) {
        errorMsg = data.message ?? `Failed to accept invite (${res.status})`;
        phase = "form";
        return;
      }
      if (!data.token) {
        errorMsg = "No session token received";
        phase = "form";
        return;
      }
      sessionStorage.setItem("atlasit_token", data.token);
      sessionStorage.setItem(
        "atlasit_user",
        JSON.stringify({
          userId: data.userId,
          email: data.email ?? inviteEmail,
          tenantId: data.tenantId,
          role: data.role ?? inviteRole,
        }),
      );
      phase = "done";
      await goto("/console");
    } catch (e) {
      errorMsg = (e as Error).message ?? "An unexpected error occurred";
      phase = "form";
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-background py-12 px-4">
  <div class="w-full max-w-md p-8 bg-card rounded-lg shadow-md">

    {#if phase === "loading"}
      <div class="flex flex-col items-center gap-4 py-8">
        <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-muted-foreground text-sm">Validating invite…</p>
      </div>

    {:else if phase === "invalid"}
      <div class="text-center py-8">
        <div class="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 class="text-xl font-semibold text-foreground mb-2">Invalid Invitation</h1>
        <p class="text-sm text-muted-foreground">This invitation link is invalid or has been revoked. Contact your admin for a new invite.</p>
        <a href="/login" class="mt-6 inline-block text-primary hover:text-primary-hover dark:text-primary text-sm font-medium">Go to Login</a>
      </div>

    {:else if phase === "expired"}
      <div class="text-center py-8">
        <div class="w-12 h-12 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-xl font-semibold text-foreground mb-2">Invitation Expired</h1>
        <p class="text-sm text-muted-foreground">This invitation link has expired (invites are valid for 7 days). Ask your admin to send a new one.</p>
        <a href="/login" class="mt-6 inline-block text-primary hover:text-primary-hover dark:text-primary text-sm font-medium">Go to Login</a>
      </div>

    {:else if phase === "accepted"}
      <div class="text-center py-8">
        <div class="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-xl font-semibold text-foreground mb-2">Already Accepted</h1>
        <p class="text-sm text-muted-foreground">This invitation has already been used. Log in with your credentials.</p>
        <a href="/login" class="mt-6 inline-block text-primary hover:text-primary-hover dark:text-primary text-sm font-medium">Go to Login</a>
      </div>

    {:else if phase === "form" || phase === "submitting"}
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-foreground mb-1">You're invited!</h1>
        <p class="text-sm text-muted-foreground">
          Join <span class="font-medium text-foreground/80">{inviteTenant}</span> as a <span class="font-medium text-foreground/80">{inviteRole}</span>.
        </p>
      </div>

      {#if errorMsg}
        <div class="mb-4 p-3 bg-destructive-muted border border-destructive/20 rounded text-destructive text-sm">
          {errorMsg}
        </div>
      {/if}

      <form on:submit|preventDefault={handleAccept} class="space-y-4">
        <!-- Email (readonly, pre-filled) -->
        <div>
          <label for="email" class="block text-sm font-medium text-foreground/80 mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={inviteEmail}
            readonly
            class="w-full px-3 py-2 border border-input rounded-md bg-gray-50 dark:bg-gray-700 text-muted-foreground cursor-not-allowed"
          />
        </div>

        <!-- Display name -->
        <div>
          <label for="displayName" class="block text-sm font-medium text-foreground/80 mb-1">
            Full Name <span class="text-muted-foreground/70 text-xs font-normal">(optional)</span>
          </label>
          <input
            id="displayName"
            type="text"
            bind:value={displayName}
            placeholder="Jane Smith"
            autocomplete="name"
            class="w-full px-3 py-2 border border-input rounded-md bg-white dark:bg-gray-700 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-foreground/80 mb-1">
            Set Password <span class="text-destructive">*</span>
          </label>
          <div class="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              bind:value={password}
              placeholder="At least 8 characters"
              autocomplete="new-password"
              class="w-full px-3 py-2 pr-10 border border-input rounded-md bg-white dark:bg-gray-700 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              on:click={() => (showPassword = !showPassword)}
              class="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground/70 hover:text-gray-600 dark:hover:text-gray-200"
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
        </div>

        <!-- Confirm password -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-foreground/80 mb-1">
            Confirm Password <span class="text-destructive">*</span>
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            bind:value={confirmPassword}
            placeholder="Re-enter your password"
            autocomplete="new-password"
            class="w-full px-3 py-2 border border-input rounded-md bg-white dark:bg-gray-700 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={phase === "submitting"}
          class="w-full py-2 px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium rounded-md transition-colors"
        >
          {phase === "submitting" ? "Setting up your account…" : "Accept Invitation"}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?
        <a href="/login" class="text-primary hover:text-primary-hover dark:text-primary font-medium">Sign in</a>
      </p>

    {:else if phase === "done"}
      <div class="flex flex-col items-center gap-4 py-8">
        <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-muted-foreground text-sm">Signing you in…</p>
      </div>
    {/if}

  </div>
</div>
