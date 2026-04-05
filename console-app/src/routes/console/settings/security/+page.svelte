<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import { ShieldCheck, Copy, AlertTriangle } from "lucide-svelte";

  const settingsTabs = [
    { href: "/console/settings", label: "General" },
    { href: "/console/settings/users", label: "Users" },
    { href: "/console/settings/audit-log", label: "Audit Log" },
    { href: "/console/settings/billing", label: "Billing" },
    { href: "/console/settings/trust", label: "Trust Center" },
    { href: "/console/settings/incidents", label: "Incidents" },
    { href: "/console/settings/security", label: "Security" },
  ];
  $: current = $page.url.pathname;

  let loading = true;
  let totpEnabled = false;
  let recoveryCodesRemaining = 0;
  let enabledAt: string | null = null;

  // Setup flow
  let setupStep: "idle" | "qr" | "verify" | "done" = "idle";
  let setupSecret = "";
  let setupUri = "";
  let setupRecoveryCodes: string[] = [];
  let verifyCode = "";
  let verifying = false;

  // Disable flow
  let showDisable = false;
  let disablePassword = "";
  let disabling = false;

  onMount(loadStatus);

  async function loadStatus() {
    loading = true;
    try {
      const res = await fetch("/api/auth/mfa/status");
      if (res.ok) {
        const data = await res.json();
        totpEnabled = data.totpEnabled;
        recoveryCodesRemaining = data.recoveryCodesRemaining;
        enabledAt = data.enabledAt;
      }
    } catch {}
    loading = false;
  }

  async function startSetup() {
    verifying = true;
    try {
      const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setupSecret = data.secret;
        setupUri = data.uri;
        setupRecoveryCodes = data.recoveryCodes;
        setupStep = "qr";
      } else {
        pushToast({ message: data.error || "Failed to start setup", variant: "error" });
      }
    } catch {
      pushToast({ message: "Failed to start setup", variant: "error" });
    }
    verifying = false;
  }

  async function confirmSetup() {
    verifying = true;
    try {
      const res = await fetch("/api/auth/mfa/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setupStep = "done";
        pushToast({ message: "Two-factor authentication enabled!", variant: "success" });
        await loadStatus();
      } else {
        pushToast({ message: data.error || "Invalid code", variant: "error" });
      }
    } catch {
      pushToast({ message: "Verification failed", variant: "error" });
    }
    verifying = false;
  }

  async function disableTotp() {
    disabling = true;
    try {
      const res = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (res.ok) {
        pushToast({ message: "Two-factor authentication disabled", variant: "success" });
        showDisable = false;
        disablePassword = "";
        setupStep = "idle";
        await loadStatus();
      } else {
        pushToast({ message: data.error || "Failed to disable", variant: "error" });
      }
    } catch {
      pushToast({ message: "Failed to disable MFA", variant: "error" });
    }
    disabling = false;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    pushToast({ message: "Copied to clipboard", variant: "success" });
  }

  function finishSetup() {
    setupStep = "idle";
    setupSecret = "";
    setupUri = "";
    setupRecoveryCodes = [];
    verifyCode = "";
  }
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-semibold tracking-tight">Security</h1>

  <div class="flex gap-1 border-b">
    {#each settingsTabs as tab}
      <a
        href={tab.href}
        class="px-4 py-2.5 text-sm font-medium transition-colors -mb-px {current === tab.href
          ? 'text-foreground border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground'}"
      >{tab.label}</a>
    {/each}
  </div>

  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <ShieldCheck class="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Two-Factor Authentication (TOTP)</CardTitle>
            <p class="text-sm text-muted-foreground mt-1">
              Add an extra layer of security with an authenticator app.
            </p>
          </div>
        </div>
        {#if totpEnabled}
          <Badge variant="success">Enabled</Badge>
        {:else}
          <Badge variant="secondary">Disabled</Badge>
        {/if}
      </div>
    </CardHeader>
    <CardContent>
      {#if loading}
        <p class="text-sm text-muted-foreground">Loading...</p>
      {:else if setupStep === "qr"}
        <!-- Step 1: Show QR code / manual entry -->
        <div class="space-y-4">
          <p class="text-sm">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
          </p>

          <div class="flex justify-center p-4 bg-white rounded-lg border">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encodeURIComponent(setupUri)}"
              alt="TOTP QR Code"
              class="w-48 h-48"
            />
          </div>

          <div class="space-y-2">
            <p class="text-xs text-muted-foreground">Or enter this key manually:</p>
            <div class="flex items-center gap-2">
              <code class="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono break-all">
                {setupSecret}
              </code>
              <Button variant="outline" size="sm" on:click={() => copyToClipboard(setupSecret)}>
                <Copy class="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div class="border-t pt-4 space-y-2">
            <Label htmlFor="verifyCode">Enter the code from your app to verify</Label>
            <div class="flex gap-2">
              <Input
                id="verifyCode"
                bind:value={verifyCode}
                placeholder="000000"
                maxlength={6}
                autocomplete="one-time-code"
                inputmode="numeric"
                class="font-mono text-center text-lg tracking-widest max-w-[180px]"
              />
              <Button on:click={confirmSetup} disabled={verifying || verifyCode.length !== 6}>
                {verifying ? "Verifying..." : "Verify & Enable"}
              </Button>
            </div>
          </div>
        </div>
      {:else if setupStep === "done"}
        <!-- Step 2: Show recovery codes -->
        <div class="space-y-4">
          <div class="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle class="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div class="text-sm">
              <p class="font-medium text-warning">Save your recovery codes</p>
              <p class="text-muted-foreground">
                These codes can be used to access your account if you lose your authenticator device.
                Each code can only be used once. Store them securely.
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
            {#each setupRecoveryCodes as code}
              <code class="text-sm font-mono text-center py-1">{code}</code>
            {/each}
          </div>

          <div class="flex gap-2">
            <Button
              variant="outline"
              on:click={() => copyToClipboard(setupRecoveryCodes.join("\n"))}
            >
              <Copy class="w-4 h-4 mr-1" /> Copy all codes
            </Button>
            <Button on:click={finishSetup}>
              I've saved my codes
            </Button>
          </div>
        </div>
      {:else if totpEnabled}
        <!-- Enabled state -->
        <div class="space-y-4">
          <p class="text-sm text-muted-foreground">
            Two-factor authentication is active.
            {#if recoveryCodesRemaining > 0}
              You have <strong>{recoveryCodesRemaining}</strong> recovery code{recoveryCodesRemaining !== 1 ? "s" : ""} remaining.
            {:else}
              <span class="text-warning font-medium">No recovery codes remaining. Consider re-enrolling.</span>
            {/if}
          </p>

          {#if showDisable}
            <div class="border rounded-lg p-4 space-y-3">
              <p class="text-sm font-medium">Confirm your password to disable MFA</p>
              <Input
                type="password"
                bind:value={disablePassword}
                placeholder="Current password"
              />
              <div class="flex gap-2">
                <Button variant="destructive" on:click={disableTotp} disabled={disabling || !disablePassword}>
                  {disabling ? "Disabling..." : "Disable MFA"}
                </Button>
                <Button variant="outline" on:click={() => { showDisable = false; disablePassword = ""; }}>
                  Cancel
                </Button>
              </div>
            </div>
          {:else}
            <div class="flex gap-2">
              <Button variant="outline" on:click={startSetup}>
                Re-enroll (new device)
              </Button>
              <Button variant="outline" on:click={() => showDisable = true}>
                Disable MFA
              </Button>
            </div>
          {/if}
        </div>
      {:else}
        <!-- Disabled state -->
        <div class="space-y-3">
          <p class="text-sm text-muted-foreground">
            Protect your account with a time-based one-time password (TOTP) from an authenticator app.
          </p>
          <Button on:click={startSetup} disabled={verifying}>
            <ShieldCheck class="w-4 h-4 mr-1" />
            {verifying ? "Setting up..." : "Enable Two-Factor Authentication"}
          </Button>
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
