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
  import { ShieldCheck, Copy, AlertTriangle, Settings, Globe, ExternalLink, Trash2, CheckCircle } from "lucide-svelte";
  import { session } from "$lib/stores/session";

  // SSO state
  let ssoLoading = false;
  let ssoConfigured = false;
  let ssoConfig: any = null;
  let ssoTierBlocked = false;
  let ssoTierMessage = "";
  let ssoError = "";
  let ssoSaving = false;
  let ssoProtocol: "saml" | "oidc" = "oidc";
  let ssoTestResult: { success: boolean; message: string } | null = null;

  // SSO form fields
  let ssoDisplayName = "";
  let ssoIdpName = "";
  let ssoEnabled = false;
  let ssoJitProvisioning = true;
  let ssoForceSso = false;
  let ssoBypassMfa = false;
  let ssoDefaultRoles = '["member"]';

  // SAML fields
  let samlEntityId = "";
  let samlSsoUrl = "";
  let samlCertificate = "";
  let samlMetadataUrl = "";

  // OIDC fields
  let oidcIssuer = "";
  let oidcClientId = "";
  let oidcClientSecret = "";
  let oidcScopes = "openid email profile";

  async function loadSsoConfig() {
    ssoLoading = true;
    ssoError = "";
    try {
      const res = await fetch("/api/tenant/sso");
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        ssoTierBlocked = true;
        ssoTierMessage = data.error || "SSO requires a Professional or Enterprise plan";
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        ssoError = data.error || `Failed to load SSO configuration (${res.status})`;
        return;
      }
      const data = await res.json();
      ssoConfigured = data.configured;
      if (data.config) {
        ssoConfig = data.config;
        ssoProtocol = data.config.protocol;
        ssoDisplayName = data.config.displayName || "";
        ssoIdpName = data.config.idpName || "";
        ssoEnabled = data.config.enabled;
        ssoJitProvisioning = data.config.jitProvisioning;
        ssoForceSso = data.config.forceSso;
        ssoBypassMfa = data.config.ssoBypassMfa;
        ssoDefaultRoles = JSON.stringify(data.config.defaultRoles || ["member"]);

        // SAML
        samlEntityId = data.config.samlEntityId || "";
        samlSsoUrl = data.config.samlSsoUrl || "";
        samlCertificate = data.config.samlCertificate || "";
        samlMetadataUrl = data.config.samlMetadataUrl || "";

        // OIDC
        oidcIssuer = data.config.oidcIssuer || "";
        oidcClientId = data.config.oidcClientId || "";
        oidcClientSecret = "";
        oidcScopes = data.config.oidcScopes || "openid email profile";
      }
    } catch (e) {
      ssoError = "Failed to load SSO configuration";
    } finally {
      ssoLoading = false;
    }
  }

  async function saveSsoConfig() {
    ssoSaving = true;
    ssoTestResult = null;
    try {
      let defaultRoles: string[];
      try { defaultRoles = JSON.parse(ssoDefaultRoles); } catch { defaultRoles = ["member"]; }

      const payload: Record<string, any> = {
        protocol: ssoProtocol,
        enabled: ssoEnabled,
        displayName: ssoDisplayName || undefined,
        idpName: ssoIdpName || undefined,
        jitProvisioning: ssoJitProvisioning,
        defaultRoles,
        forceSso: ssoForceSso,
        ssoBypassMfa: ssoBypassMfa,
      };

      if (ssoProtocol === "saml") {
        payload.samlEntityId = samlEntityId;
        payload.samlSsoUrl = samlSsoUrl;
        payload.samlCertificate = samlCertificate;
        payload.samlMetadataUrl = samlMetadataUrl;
      } else {
        payload.oidcIssuer = oidcIssuer;
        payload.oidcClientId = oidcClientId;
        if (oidcClientSecret) payload.oidcClientSecret = oidcClientSecret;
        payload.oidcScopes = oidcScopes;
      }

      const res = await fetch("/api/tenant/sso", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        pushToast({ message: "SSO configuration saved", variant: "success" });
        ssoConfigured = true;
        await loadSsoConfig();
      } else {
        pushToast({ message: data.error || "Failed to save", variant: "error" });
      }
    } catch {
      pushToast({ message: "Failed to save SSO configuration", variant: "error" });
    }
    ssoSaving = false;
  }

  async function deleteSsoConfig() {
    try {
      const res = await fetch("/api/tenant/sso", { method: "DELETE" });
      if (res.ok) {
        pushToast({ message: "SSO configuration removed", variant: "success" });
        ssoConfigured = false;
        ssoConfig = null;
        ssoEnabled = false;
      } else {
        pushToast({ message: "Failed to remove SSO", variant: "error" });
      }
    } catch {
      pushToast({ message: "Failed to remove SSO", variant: "error" });
    }
  }

  function testSsoConnection() {
    const tenantId = $session?.tenantId;
    if (!tenantId) {
      ssoTestResult = { success: false, message: "No tenant ID" };
      return;
    }
    // Open SSO init in a new window for testing
    window.open(`/api/auth/sso/init?tenant=${tenantId}`, "_blank", "width=600,height=700");
    ssoTestResult = { success: true, message: "SSO test initiated in a new window. Complete the IdP login to verify." };
  }

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

  // Tenant security policy (owner only)
  let policyLoading = false;
  let policy: any = null;
  let savingPolicy = false;

  $: isOwner = $session?.roles?.includes("owner") || $session?.roles?.includes("super-admin") || $session?.superAdmin;

  let ownerDataLoaded = false;
  $: if (isOwner && !ownerDataLoaded) {
    ownerDataLoaded = true;
    loadPolicy();
  }

  // Always load SSO config for any authenticated user — the API enforces tier gating
  let ssoDataLoaded = false;
  $: if ($session?.authenticated && !ssoDataLoaded) {
    ssoDataLoaded = true;
    loadSsoConfig();
  }

  onMount(async () => {
    await loadStatus();
  });

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

  async function loadPolicy() {
    policyLoading = true;
    try {
      const res = await fetch("/api/tenant/security");
      if (res.ok) {
        const data = await res.json();
        policy = data.policy;
      } else {
        console.error("Failed to load security policy:", res.status);
        // Still show the card with defaults so the user can configure
        policy = {
          mfaRequired: false,
          sessionTtlSeconds: 604800,
          mfaSessionTtlSeconds: 604800,
          maxSessionTtlSeconds: 2592000,
          idleTimeoutSeconds: 86400,
          passwordRotationDays: 0,
          minPasswordLength: 8,
          mfaRequiredRoles: [],
        };
      }
    } catch {
      policy = {
        mfaRequired: false,
        sessionTtlSeconds: 604800,
        mfaSessionTtlSeconds: 604800,
        maxSessionTtlSeconds: 2592000,
        idleTimeoutSeconds: 86400,
        passwordRotationDays: 0,
        minPasswordLength: 8,
        mfaRequiredRoles: [],
      };
    }
    policyLoading = false;
  }

  async function savePolicy() {
    savingPolicy = true;
    try {
      const res = await fetch("/api/tenant/security", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(policy),
      });
      const data = await res.json();
      if (res.ok) {
        policy = data.policy;
        pushToast({ message: "Security policy updated", variant: "success" });
      } else {
        pushToast({ message: data.error || "Failed to save", variant: "error" });
      }
    } catch {
      pushToast({ message: "Failed to save policy", variant: "error" });
    }
    savingPolicy = false;
  }

  function formatDuration(seconds: number): string {
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    return `${Math.round(seconds / 86400)} days`;
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

  <!-- SSO Configuration -->
  <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Globe class="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Single Sign-On (SSO)</CardTitle>
              <p class="text-sm text-muted-foreground mt-1">
                Configure SAML 2.0 or OIDC for centralized authentication via your identity provider.
              </p>
            </div>
          </div>
          {#if ssoEnabled && ssoConfigured}
            <Badge variant="success">Enabled</Badge>
          {:else if ssoConfigured}
            <Badge variant="secondary">Configured</Badge>
          {:else if ssoTierBlocked}
            <Badge variant="warning">Upgrade Required</Badge>
          {:else}
            <Badge variant="secondary">Not Configured</Badge>
          {/if}
        </div>
      </CardHeader>
      <CardContent>
        {#if ssoLoading}
          <p class="text-sm text-muted-foreground">Loading SSO configuration...</p>
        {:else if ssoError}
          <div class="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
            <div class="flex items-start gap-2">
              <AlertTriangle class="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-destructive">{ssoError}</p>
                <p class="text-xs text-muted-foreground mt-1">Try refreshing the page. If this persists, contact support.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" on:click={loadSsoConfig}>Retry</Button>
          </div>
        {:else if ssoTierBlocked}
          <div class="rounded-lg border border-warning/20 bg-warning/5 p-4 space-y-3">
            <div class="flex items-start gap-2">
              <AlertTriangle class="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium">{ssoTierMessage}</p>
                <p class="text-xs text-muted-foreground mt-1">
                  SSO enables centralized authentication via your identity provider (Okta, Azure AD, Google Workspace, etc.)
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" on:click={() => window.location.href = '/console/settings/billing'}>
              View Plans
              <ExternalLink class="ml-1 h-3 w-3" />
            </Button>
          </div>
        {:else}
          <div class="space-y-6">
            <!-- Protocol selector -->
            <div class="space-y-2">
              <Label>Protocol</Label>
              <div class="flex gap-2">
                <button
                  class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors {ssoProtocol === 'oidc' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-foreground'}"
                  on:click={() => ssoProtocol = 'oidc'}
                >OpenID Connect</button>
                <button
                  class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors {ssoProtocol === 'saml' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-foreground'}"
                  on:click={() => ssoProtocol = 'saml'}
                >SAML 2.0</button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Display Name</Label>
                <Input bind:value={ssoDisplayName} placeholder="e.g. Corporate SSO" />
              </div>
              <div class="space-y-2">
                <Label>Identity Provider</Label>
                <select class="w-full rounded-md border bg-background px-3 py-2 text-sm" bind:value={ssoIdpName}>
                  <option value="">Select IdP...</option>
                  <option value="okta">Okta</option>
                  <option value="azure-ad">Azure AD / Entra ID</option>
                  <option value="google">Google Workspace</option>
                  <option value="onelogin">OneLogin</option>
                  <option value="ping">PingFederate</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {#if ssoProtocol === "oidc"}
              <!-- OIDC Configuration -->
              <div class="space-y-4 border-t pt-4">
                <h3 class="text-sm font-medium">OIDC Configuration</h3>
                <div class="space-y-2">
                  <Label>Issuer URL</Label>
                  <Input bind:value={oidcIssuer} placeholder="https://accounts.google.com or https://login.microsoftonline.com/{tenant}/v2.0" />
                  <p class="text-xs text-muted-foreground">The OIDC issuer URL. Endpoints will be auto-discovered from .well-known/openid-configuration.</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <Label>Client ID</Label>
                    <Input bind:value={oidcClientId} placeholder="your-client-id" />
                  </div>
                  <div class="space-y-2">
                    <Label>Client Secret</Label>
                    <Input type="password" bind:value={oidcClientSecret} placeholder={ssoConfigured ? '••••••••' : 'your-client-secret'} />
                  </div>
                </div>
                <div class="space-y-2">
                  <Label>Scopes</Label>
                  <Input bind:value={oidcScopes} placeholder="openid email profile" />
                </div>
              </div>
            {:else}
              <!-- SAML Configuration -->
              <div class="space-y-4 border-t pt-4">
                <h3 class="text-sm font-medium">SAML 2.0 Configuration</h3>
                <div class="space-y-2">
                  <Label>IdP Entity ID</Label>
                  <Input bind:value={samlEntityId} placeholder="https://idp.example.com/saml/metadata" />
                </div>
                <div class="space-y-2">
                  <Label>IdP SSO URL</Label>
                  <Input bind:value={samlSsoUrl} placeholder="https://idp.example.com/saml/sso" />
                </div>
                <div class="space-y-2">
                  <Label>IdP Metadata URL (optional)</Label>
                  <Input bind:value={samlMetadataUrl} placeholder="https://idp.example.com/saml/metadata" />
                </div>
                <div class="space-y-2">
                  <Label>X.509 Signing Certificate (PEM)</Label>
                  <textarea
                    class="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono min-h-[120px] resize-y"
                    bind:value={samlCertificate}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  ></textarea>
                </div>

                <!-- SP Metadata for IdP setup -->
                <div class="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p class="text-xs font-medium text-muted-foreground">Your SP Metadata (provide to your IdP)</p>
                  <div class="flex items-center gap-2">
                    <code class="text-xs">{typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/sso/metadata</code>
                    <Button variant="ghost" size="sm" on:click={() => copyToClipboard(`${window.location.origin}/api/auth/sso/metadata`)}>
                      <Copy class="h-3 w-3" />
                    </Button>
                  </div>
                  <p class="text-xs text-muted-foreground">ACS URL: <code>{typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/sso/callback</code></p>
                </div>
              </div>
            {/if}

            <!-- Behavior settings -->
            <div class="space-y-4 border-t pt-4">
              <h3 class="text-sm font-medium">Behavior</h3>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm">Enable SSO</p>
                  <p class="text-xs text-muted-foreground">Allow users to sign in via this identity provider.</p>
                </div>
                <button
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {ssoEnabled ? 'bg-primary' : 'bg-muted'}"
                  on:click={() => ssoEnabled = !ssoEnabled}
                >
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {ssoEnabled ? 'translate-x-6' : 'translate-x-1'}" />
                </button>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm">Just-in-Time Provisioning</p>
                  <p class="text-xs text-muted-foreground">Auto-create user accounts on first SSO login.</p>
                </div>
                <button
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {ssoJitProvisioning ? 'bg-primary' : 'bg-muted'}"
                  on:click={() => ssoJitProvisioning = !ssoJitProvisioning}
                >
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {ssoJitProvisioning ? 'translate-x-6' : 'translate-x-1'}" />
                </button>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm">Force SSO</p>
                  <p class="text-xs text-muted-foreground">Block password login; require SSO for all users.</p>
                </div>
                <button
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {ssoForceSso ? 'bg-primary' : 'bg-muted'}"
                  on:click={() => ssoForceSso = !ssoForceSso}
                >
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {ssoForceSso ? 'translate-x-6' : 'translate-x-1'}" />
                </button>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm">Bypass MFA for SSO Users</p>
                  <p class="text-xs text-muted-foreground">Skip TOTP challenge when authenticating via IdP.</p>
                </div>
                <button
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {ssoBypassMfa ? 'bg-primary' : 'bg-muted'}"
                  on:click={() => ssoBypassMfa = !ssoBypassMfa}
                >
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {ssoBypassMfa ? 'translate-x-6' : 'translate-x-1'}" />
                </button>
              </div>

              <div class="space-y-2">
                <Label>Default Roles for New SSO Users</Label>
                <Input bind:value={ssoDefaultRoles} placeholder='["member"]' class="font-mono text-sm" />
                <p class="text-xs text-muted-foreground">JSON array of roles assigned to JIT-provisioned users.</p>
              </div>
            </div>

            <!-- Test & Actions -->
            {#if ssoTestResult}
              <div class="rounded-md p-3 text-sm {ssoTestResult.success ? 'bg-green-500/10 text-green-700' : 'bg-destructive/10 text-destructive'}">
                {ssoTestResult.message}
              </div>
            {/if}

            <div class="flex items-center gap-2 border-t pt-4">
              <Button on:click={saveSsoConfig} disabled={ssoSaving}>
                {ssoSaving ? "Saving..." : "Save SSO Configuration"}
              </Button>
              {#if ssoConfigured && ssoEnabled}
                <Button variant="outline" on:click={testSsoConnection}>
                  <ExternalLink class="h-4 w-4 mr-1" />
                  Test Connection
                </Button>
              {/if}
              {#if ssoConfigured}
                <Button variant="outline" class="text-destructive" on:click={deleteSsoConfig}>
                  <Trash2 class="h-4 w-4 mr-1" />
                  Remove
                </Button>
              {/if}
            </div>
          </div>
        {/if}
      </CardContent>
    </Card>

  <!-- Tenant Security Policy (owner only) -->
  {#if isOwner && policy}
    <Card>
      <CardHeader>
        <div class="flex items-center gap-3">
          <Settings class="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Organization Security Policy</CardTitle>
            <p class="text-sm text-muted-foreground mt-1">
              Configure security requirements for all users in your organization.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="space-y-6">
          <!-- MFA Requirement -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium">Require MFA for all users</p>
                <p class="text-xs text-muted-foreground">Users without MFA will be forced to enroll on next login.</p>
              </div>
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {policy.mfaRequired ? 'bg-primary' : 'bg-muted'}"
                on:click={() => policy.mfaRequired = !policy.mfaRequired}
              >
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {policy.mfaRequired ? 'translate-x-6' : 'translate-x-1'}" />
              </button>
            </div>

            {#if !policy.mfaRequired}
              <div class="space-y-2">
                <Label>Require MFA for specific roles</Label>
                <div class="flex flex-wrap gap-2">
                  {#each ["owner", "admin", "member"] as role}
                    <button
                      class="px-3 py-1 rounded-full text-xs font-medium border transition-colors {policy.mfaRequiredRoles.includes(role) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-foreground'}"
                      on:click={() => {
                        if (policy.mfaRequiredRoles.includes(role)) {
                          policy.mfaRequiredRoles = policy.mfaRequiredRoles.filter((r: string) => r !== role);
                        } else {
                          policy.mfaRequiredRoles = [...policy.mfaRequiredRoles, role];
                        }
                      }}
                    >{role}</button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <!-- Session Duration -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Session duration</Label>
              <select
                class="w-full rounded-md border bg-background px-3 py-2 text-sm"
                bind:value={policy.sessionTtlSeconds}
              >
                <option value={3600}>1 hour</option>
                <option value={14400}>4 hours</option>
                <option value={28800}>8 hours</option>
                <option value={86400}>1 day</option>
                <option value={259200}>3 days</option>
                <option value={604800}>7 days</option>
                <option value={2592000}>30 days</option>
              </select>
              <p class="text-xs text-muted-foreground">How long sessions last without MFA.</p>
            </div>

            <div class="space-y-2">
              <Label>MFA session duration</Label>
              <select
                class="w-full rounded-md border bg-background px-3 py-2 text-sm"
                bind:value={policy.mfaSessionTtlSeconds}
              >
                <option value={3600}>1 hour</option>
                <option value={14400}>4 hours</option>
                <option value={28800}>8 hours</option>
                <option value={86400}>1 day</option>
                <option value={259200}>3 days</option>
                <option value={604800}>7 days</option>
                <option value={2592000}>30 days</option>
                <option value={7776000}>90 days</option>
              </select>
              <p class="text-xs text-muted-foreground">Longer sessions for MFA-verified users.</p>
            </div>
          </div>

          <!-- Idle Timeout -->
          <div class="space-y-2">
            <Label>Idle timeout</Label>
            <select
              class="w-full rounded-md border bg-background px-3 py-2 text-sm max-w-xs"
              bind:value={policy.idleTimeoutSeconds}
            >
              <option value={900}>15 minutes</option>
              <option value={1800}>30 minutes</option>
              <option value={3600}>1 hour</option>
              <option value={14400}>4 hours</option>
              <option value={86400}>1 day</option>
              <option value={604800}>7 days</option>
            </select>
            <p class="text-xs text-muted-foreground">Sessions expire after this much inactivity.</p>
          </div>

          <!-- Min Password Length -->
          <div class="space-y-2">
            <Label>Minimum password length</Label>
            <Input
              type="number"
              min={8}
              max={128}
              bind:value={policy.minPasswordLength}
              class="max-w-[120px]"
            />
          </div>

          <Button on:click={savePolicy} disabled={savingPolicy}>
            {savingPolicy ? "Saving..." : "Save Security Policy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
