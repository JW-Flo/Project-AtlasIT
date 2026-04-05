<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import { mark } from "$lib/instrumentation/ux-metrics";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { AlertTriangle, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-svelte";

  let mode: "login" | "register" = "login";
  let email = "";
  let password = "";
  let displayName = "";
  let orgName = "";
  let error = "";
  let loading = false;
  let inviteParam = "";

  // MFA state
  let mfaRequired = false;
  let mfaToken = "";
  let totpCode = "";
  let useRecoveryCode = false;
  let recoveryCode = "";

  async function trackGrowthEvent(event: string, inviteId: string) {
    if (!inviteId) return;
    mark(`growth:${event}`, { inviteId });
    try {
      await fetch("/api/analytics/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event, inviteId }),
      });
    } catch {}
  }

  async function login() {
    loading = true;
    error = "";
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await resp.json();
      if (data.mfaRequired) {
        mfaRequired = true;
        mfaToken = data.mfaToken;
        loading = false;
        return;
      }
      if (resp.ok) {
        await invalidateAll();
        goto("/console");
      } else {
        error = data.error || "Login failed";
      }
    } catch (e) {
      error = "Network error";
    }
    loading = false;
  }

  async function verifyMfa() {
    loading = true;
    error = "";
    try {
      const body: any = { mfaToken };
      if (useRecoveryCode) {
        body.recoveryCode = recoveryCode;
      } else {
        body.code = totpCode;
      }
      const resp = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (resp.ok) {
        await invalidateAll();
        goto("/console");
      } else {
        const data = await resp.json();
        error = data.error || "Verification failed";
      }
    } catch (e) {
      error = "Network error";
    }
    loading = false;
  }

  function backToLogin() {
    mfaRequired = false;
    mfaToken = "";
    totpCode = "";
    recoveryCode = "";
    useRecoveryCode = false;
    error = "";
  }

  async function register() {
    loading = true;
    error = "";
    try {
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ownerEmail: email, ownerPassword: password, ownerName: displayName, orgName }),
      });
      const data = await resp.json();
      if (resp.ok) {
        if (inviteParam) await trackGrowthEvent("invite_signup_completed", inviteParam);
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
    inviteParam = new URLSearchParams(window.location.search).get("invite")?.trim() || "";
    if (inviteParam) {
      void trackGrowthEvent("invite_link_opened", inviteParam);
      mode = "register";
    }

    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) goto("/console");
      });
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-background">
  <div class="max-w-md w-full space-y-6 px-4">
    <div class="text-center">
      <div class="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
        <span class="text-primary-foreground font-bold text-xl">A</span>
      </div>
      <h1 class="text-2xl font-bold tracking-tight">AtlasIT</h1>
      <p class="text-sm text-muted-foreground mt-1">
        {mode === "login" ? "Sign in to your account" : "Create your account"}
      </p>
    </div>

    {#if mfaRequired}
      <!-- MFA verification step -->
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck class="w-4 h-4" />
        <span>Two-factor authentication required</span>
      </div>

      <form class="space-y-4" on:submit|preventDefault={verifyMfa}>
        <Card>
          <CardContent class="pt-6 space-y-4">
            {#if useRecoveryCode}
              <div class="space-y-2">
                <Label htmlFor="recoveryCode">Recovery Code</Label>
                <Input
                  id="recoveryCode"
                  bind:value={recoveryCode}
                  placeholder="xxxx-xxxx"
                  autocomplete="off"
                />
                <p class="text-xs text-muted-foreground">
                  Enter one of your recovery codes.
                </p>
              </div>
            {:else}
              <div class="space-y-2">
                <Label htmlFor="totpCode">Authentication Code</Label>
                <Input
                  id="totpCode"
                  bind:value={totpCode}
                  placeholder="000000"
                  maxlength={6}
                  autocomplete="one-time-code"
                  inputmode="numeric"
                  class="text-center text-2xl tracking-[0.3em] font-mono"
                />
                <p class="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>
            {/if}
          </CardContent>
        </Card>

        {#if error}
          <Alert variant="destructive">
            <AlertTriangle class="h-4 w-4" />
            <p class="pl-7">{error}</p>
          </Alert>
        {/if}

        <Button type="submit" disabled={loading} class="w-full">
          {loading ? "Verifying..." : "Verify"}
          <ArrowRight class="h-4 w-4 ml-2" />
        </Button>

        <div class="flex items-center justify-between text-xs">
          <button
            type="button"
            class="text-primary hover:underline flex items-center gap-1"
            on:click={backToLogin}
          >
            <ArrowLeft class="w-3 h-3" /> Back to login
          </button>
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground"
            on:click={() => { useRecoveryCode = !useRecoveryCode; error = ""; }}
          >
            {useRecoveryCode ? "Use authenticator app" : "Use recovery code"}
          </button>
        </div>
      </form>
    {:else}
      <!-- Tab toggle -->
      <div class="flex rounded-lg overflow-hidden border">
        <button
          type="button"
          class="flex-1 py-2.5 text-sm font-medium transition-colors {mode === 'login'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background text-muted-foreground hover:text-foreground'}"
          on:click={() => { mode = "login"; error = ""; }}
        >
          Sign In
        </button>
        <button
          type="button"
          class="flex-1 py-2.5 text-sm font-medium transition-colors {mode === 'register'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background text-muted-foreground hover:text-foreground'}"
          on:click={() => { mode = "register"; error = ""; }}
        >
          Create Account
        </button>
      </div>

      <form class="space-y-4" on:submit|preventDefault={handleSubmit}>
        {#if inviteParam}
          <div class="text-xs rounded-lg p-3 bg-primary/10 border border-primary/20 text-foreground">
            You were invited to join tenant <strong>{inviteParam}</strong>. Create your account to continue.
          </div>
        {/if}

        <Card>
          <CardContent class="pt-6 space-y-4">
            {#if mode === "register"}
              <div class="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input id="orgName" bind:value={orgName} placeholder="Acme Corp" />
              </div>
              <div class="space-y-2">
                <Label htmlFor="displayName">Full Name</Label>
                <Input id="displayName" bind:value={displayName} placeholder="Jane Smith" />
              </div>
            {/if}

            <div class="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required bind:value={email} placeholder="you@company.com" />
            </div>

            <div class="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                bind:value={password}
                placeholder={mode === "register" ? "Min 8 characters" : "Enter password"}
              />
            </div>
          </CardContent>
        </Card>

        {#if error}
          <Alert variant="destructive">
            <AlertTriangle class="h-4 w-4" />
            <p class="pl-7">{error}</p>
          </Alert>
        {/if}

        <Button type="submit" disabled={loading} class="w-full">
          {#if loading}
            {mode === "login" ? "Signing in..." : "Creating account..."}
          {:else}
            {mode === "login" ? "Sign In" : "Create Account"}
          {/if}
          <ArrowRight class="h-4 w-4 ml-2" />
        </Button>

        <div class="text-center mt-2">
          <a href="/console/onboarding" class="text-xs text-primary hover:underline">
            New organization? Set up with guided wizard
          </a>
        </div>
      </form>
    {/if}
  </div>
</div>
