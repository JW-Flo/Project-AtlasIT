<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import {
    integrations as allIntegrations,
    categories,
    iconMap,
    type Integration,
    type CredentialField,
  } from "$lib/data/integrations";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import DialogFooter from "$lib/components/ui/dialog-footer.svelte";
  import { Search, X, Check, ArrowRight, ArrowLeft, ExternalLink } from "lucide-svelte";

  let apps: Integration[] = allIntegrations.map((i) => ({ ...i }));
  let activeCategory = "all";
  let searchQuery = "";

  // Config wizard state
  let wizardOpen = false;
  let wizardApp: Integration | null = null;
  let wizardStep = 1;
  let wizardLoading = false;

  // Dynamic credential values -- keyed by field.key
  let credValues: Record<string, string> = {};

  $: filtered = apps.filter((i) => {
    if (activeCategory !== "all" && i.category !== activeCategory) return false;
    if (
      searchQuery &&
      !i.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  $: connectedCount = apps.filter((a) => a.connected).length;

  // Check whether all required credential fields are filled
  $: requiredFilled = wizardApp
    ? wizardApp.credentialFields
        .filter((f) => f.required)
        .every((f) => credValues[f.key]?.trim())
    : false;

  onMount(async () => {
    try {
      const res = await fetch("/api/apps/status");
      if (res.ok) {
        const data: any = await res.json();
        const statusApps: any[] = data.applications || [];
        const connected: Record<string, boolean> = {};
        const healthy: Record<string, boolean> = {};
        for (const sa of statusApps) {
          connected[sa.id] = !!sa.connected;
          if (sa.healthy !== undefined) healthy[sa.id] = sa.healthy;
        }
        apps = apps.map((a) => ({ ...a, connected: !!connected[a.id], healthy: healthy[a.id] }));
      }
    } catch {
      // Status fetch failed -- apps show as not connected
    }

    const oauthError = $page.url.searchParams.get("error");
    if (oauthError) {
      pushToast({ title: "Connection Failed", description: decodeURIComponent(oauthError), variant: "destructive" });
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("appId");
      window.history.replaceState({}, "", url.toString());
    }
  });

  function openWizard(app: Integration) {
    wizardApp = app;
    wizardStep = 1;
    wizardLoading = false;
    credValues = {};
    wizardOpen = true;
  }

  async function connectApp() {
    if (!wizardApp) return;
    wizardLoading = true;

    // AWS-adapter path: for providers we've ported to dedicated Lambda adapters
    // (github, okta), route to /console/apps which has the real working UI.
    const NEW_ADAPTERS: Record<string, string> = {
      github: "/console/apps?connect=github",
      okta: "/console/apps?connect=okta",
    };
    if (NEW_ADAPTERS[wizardApp.id]) {
      window.location.href = NEW_ADAPTERS[wizardApp.id];
      return;
    }

    try {
      // For platform_oauth: redirect straight to provider (no creds needed)
      if (wizardApp.auth === "platform_oauth") {
        pushToast({
          message: `Redirecting to ${wizardApp.name} for authorization...`,
          variant: "info",
        });
        window.location.href = `/api/apps/oauth/start?appId=${wizardApp.id}`;
        return;
      }

      // For tenant_oauth / api_key / service_account: save credentials first
      const payload: Record<string, any> = {
        appId: wizardApp.id,
        credentials: { ...credValues },
      };

      const res = await fetch("/api/apps/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data: any = await res.json().catch(() => ({}));
        pushToast({
          message: data.error || "Failed to save credentials",
          variant: "error",
        });
        wizardLoading = false;
        return;
      }

      // For tenant_oauth: save creds then redirect to OAuth
      if (wizardApp.auth === "tenant_oauth") {
        pushToast({
          message: `Redirecting to ${wizardApp.name} for authorization...`,
          variant: "info",
        });
        window.location.href = `/api/apps/oauth/start?appId=${wizardApp.id}`;
        return;
      }

      // For api_key / service_account: creds saved, done
      apps = apps.map((a) =>
        a.id === wizardApp!.id ? { ...a, connected: true, status: "live" } : a,
      );
      wizardStep = 3;
      pushToast({
        message: `${wizardApp.name} connected!`,
        variant: "success",
      });
    } catch (e: any) {
      pushToast({
        message: e?.message || "Connection failed",
        variant: "error",
      });
    }
    wizardLoading = false;
  }

  async function disconnectApp(app: Integration) {
    try {
      await fetch("/api/apps/disconnect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appId: app.id }),
      });
    } catch {
      // Continue with local disconnect
    }
    const original = allIntegrations.find((i) => i.id === app.id);
    apps = apps.map((a) =>
      a.id === app.id ? { ...a, connected: false, status: original?.status ?? a.status } : a,
    );
    pushToast({ message: `${app.name} disconnected`, variant: "info" });
  }

  function authLabel(auth: string): string {
    if (auth === "platform_oauth") return "OAuth 2.0";
    if (auth === "tenant_oauth") return "OAuth 2.0";
    if (auth === "api_key") return "API Key";
    if (auth === "service_account") return "Service Account";
    return auth;
  }

  function fieldInputType(field: CredentialField): string {
    if (field.type === "password") return "password";
    if (field.type === "url") return "url";
    return "text";
  }
</script>

<div class="space-y-6" data-tour="marketplace">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Marketplace</h1>
      <p class="text-sm text-muted-foreground">
        Connect your business apps to AtlasIT for automated compliance and IT management
      </p>
    </div>
    <div class="flex items-center gap-3">
      {#if connectedCount > 0}
        <a href="/console/integrations">
          <Badge variant="success" class="cursor-pointer">
            {connectedCount} Connected &rarr; API Manager
          </Badge>
        </a>
      {/if}
    </div>
  </div>

  <!-- Search -->
  <Input
    type="text"
    bind:value={searchQuery}
    placeholder="Search integrations..."
    class="max-w-md"
  />

  <!-- Categories -->
  <div class="flex flex-wrap gap-2">
    {#each categories as cat}
      <button
        type="button"
        class="px-3 py-1.5 text-xs font-medium rounded-full transition-colors {activeCategory === cat.id
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:text-foreground'}"
        on:click={() => (activeCategory = cat.id)}
      >
        {cat.label}
      </button>
    {/each}
  </div>

  <!-- Integration grid -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each filtered as integration}
      <Card class="{integration.connected ? 'border-green-500/30' : ''} cursor-pointer hover:shadow-md transition-shadow" on:click={() => { if (!integration.connected && integration.status !== 'planned') openWizard(integration); }}>
        <CardContent class="pt-5 flex flex-col h-full">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconMap[integration.category] || iconMap.productivity} />
              </svg>
            </div>
            <Badge variant={integration.connected ? 'success' : integration.status === 'stable' ? 'default' : integration.status === 'beta' ? 'warning' : 'secondary'}>
              {integration.connected ? "Connected" : integration.status}
            </Badge>
          </div>

          <h3 class="text-sm font-semibold mb-1 flex items-center gap-1.5">
            {integration.name}
            {#if integration.connected}
              <span class="inline-block w-2 h-2 rounded-full {integration.healthy === true ? 'bg-success' : integration.healthy === false ? 'bg-destructive' : 'bg-gray-400'}" title="{integration.healthy === true ? 'Healthy' : integration.healthy === false ? 'Unhealthy' : 'Not tested'}"></span>
            {/if}
          </h3>
          <div class="text-xs text-muted-foreground mb-1">
            {integration.category} &middot; {authLabel(integration.auth)} &middot; {integration.tier}
          </div>
          <div class="text-xs text-muted-foreground/70 mb-4 line-clamp-2">
            {integration.description}
          </div>

          <div class="mt-auto space-y-2">
            {#if integration.connected}
              <a href="/console/integrations">
                <Button variant="outline" size="sm" class="w-full">
                  <ExternalLink class="h-3 w-3 mr-1.5" />
                  Manage in API Manager
                </Button>
              </a>
              <Button variant="destructive" size="sm" class="w-full" on:click={() => disconnectApp(integration)}>
                Disconnect
              </Button>
            {:else if integration.status === 'planned'}
              <Button size="sm" class="w-full" disabled>
                Coming Soon
              </Button>
            {:else}
              <Button size="sm" class="w-full" on:click={() => openWizard(integration)}>
                Connect
              </Button>
            {/if}
          </div>
        </CardContent>
      </Card>
    {/each}
  </div>

  {#if filtered.length === 0}
    <div class="text-center py-12 text-muted-foreground">
      <p class="text-lg">No integrations found</p>
      <p class="text-sm mt-1">Try a different search or category</p>
    </div>
  {/if}
</div>

<!-- Config Wizard Modal -->
<Dialog open={wizardOpen} onClose={() => wizardOpen = false} title="Connect {wizardApp?.name || ''}">
  {#if wizardApp}
    <!-- Wizard steps indicator -->
    <div class="flex items-center gap-2 mb-6">
      {#each [1, 2, 3] as s}
        <div
          class="h-1.5 rounded-full flex-1 transition-all {s <= wizardStep ? 'bg-primary' : 'bg-muted'}"
        ></div>
      {/each}
    </div>

    {#if wizardStep === 1}
      <!-- Step 1: Overview -->
      <div class="space-y-4">
        <div class="rounded-lg p-4 bg-muted">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconMap[wizardApp.category] || iconMap.productivity} />
              </svg>
            </div>
            <div>
              <div class="text-sm font-semibold">{wizardApp.name}</div>
              <div class="text-xs text-muted-foreground capitalize">{wizardApp.category}</div>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mb-3">{wizardApp.description}</p>
          <div class="space-y-2 text-xs text-muted-foreground">
            <div class="flex justify-between"><span>Auth Method</span><span class="font-medium text-foreground">{authLabel(wizardApp.auth)}</span></div>
            <div class="flex justify-between"><span>Tier</span><span class="font-medium capitalize text-foreground">{wizardApp.tier}</span></div>
            <div class="flex justify-between"><span>Credentials Required</span><span class="font-medium text-foreground">{wizardApp.credentialFields.filter((f) => f.required).length} fields</span></div>
          </div>
        </div>
        {#if wizardApp.auth === "platform_oauth"}
          <Button class="w-full" on:click={connectApp} disabled={wizardLoading}>
            {wizardLoading ? "Redirecting..." : `Authorize ${wizardApp.name}`}
          </Button>
          <p class="text-xs text-center text-muted-foreground">
            You'll be redirected to {wizardApp.name} to grant AtlasIT access to your workspace.
          </p>
        {:else}
          <Button class="w-full" on:click={() => (wizardStep = 2)}>
            Continue to Credentials
            <ArrowRight class="h-4 w-4 ml-1.5" />
          </Button>
        {/if}
      </div>
    {:else if wizardStep === 2}
      <!-- Step 2: Dynamic credential fields -->
      <div class="space-y-4">
        <p class="text-xs text-muted-foreground">
          Enter the credentials for {wizardApp.name}. These are stored encrypted and used to connect to the API on your behalf.
        </p>

        {#each wizardApp.credentialFields as field}
          <div class="space-y-1.5">
            <Label>
              {field.label}
              {#if field.required}<span class="text-destructive">*</span>{/if}
            </Label>
            {#if field.type === "textarea"}
              <textarea
                bind:value={credValues[field.key]}
                placeholder={field.placeholder || ""}
                rows="4"
                class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              ></textarea>
            {:else}
              <Input
                type={fieldInputType(field)}
                bind:value={credValues[field.key]}
                placeholder={field.placeholder || ""}
              />
            {/if}
            {#if field.helpText}
              <p class="text-xs text-muted-foreground">{field.helpText}</p>
            {/if}
          </div>
        {/each}

        <Button class="w-full" on:click={connectApp} disabled={wizardLoading || !requiredFilled}>
          {wizardLoading ? "Connecting..." : `Connect ${wizardApp.name}`}
        </Button>
        <Button variant="outline" class="w-full" on:click={() => (wizardStep = 1)}>
          <ArrowLeft class="h-4 w-4 mr-1.5" />
          Back
        </Button>
      </div>
    {:else}
      <!-- Step 3: Confirmation -->
      <div class="space-y-4 text-center">
        <div class="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-success/15">
          <Check class="w-6 h-6 text-green-500" />
        </div>
        <div>
          <p class="text-sm font-semibold">{wizardApp.name} Connected</p>
          <p class="text-xs text-muted-foreground mt-1">
            JML workflows are now available for this application. You can manage credentials anytime in the API Manager.
          </p>
        </div>
        <DialogFooter>
          <a href="/console/integrations">
            <Button size="sm">API Manager</Button>
          </a>
          <a href="/console/workflows">
            <Button variant="outline" size="sm">Workflows</Button>
          </a>
          <Button variant="secondary" size="sm" on:click={() => (wizardOpen = false)}>Close</Button>
        </DialogFooter>
      </div>
    {/if}
  {/if}
</Dialog>
