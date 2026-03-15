<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import {
    integrations as allIntegrations,
    categories,
    iconMap,
    type Integration,
    type CredentialField,
  } from "$lib/data/integrations";

  let apps: Integration[] = allIntegrations.map((i) => ({ ...i }));
  let activeCategory = "all";
  let searchQuery = "";

  // Config wizard state
  let wizardOpen = false;
  let wizardApp: Integration | null = null;
  let wizardStep = 1;
  let wizardLoading = false;

  // Dynamic credential values — keyed by field.key
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
        for (const sa of statusApps) {
          connected[sa.id] = !!sa.connected;
        }
        apps = apps.map((a) => ({ ...a, connected: !!connected[a.id] }));
      }
    } catch {
      // Status fetch failed — apps show as not connected
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
    apps = apps.map((a) =>
      a.id === app.id ? { ...a, connected: false, status: "planned" } : a,
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

<div class="px-5 py-5 max-w-[1400px] mx-auto">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1
        class="text-3xl font-semibold mb-1"
        style="color: var(--color-text, #fff);"
      >
        Marketplace
      </h1>
      <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.5;">
        Connect your business apps to AtlasIT for automated compliance and IT
        management
      </p>
    </div>
    <div class="flex items-center gap-3">
      {#if connectedCount > 0}
        <a
          href="/console/integrations"
          class="text-sm px-3 py-1.5 rounded font-medium"
          style="background: rgba(34,197,94,0.15); color: #22c55e;"
        >
          {connectedCount} Connected &rarr; API Manager
        </a>
      {/if}
      <a
        href="/console"
        class="text-sm px-3 py-1.5 rounded"
        style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);"
      >
        Back to Dashboard
      </a>
    </div>
  </div>

  <!-- Search -->
  <div class="mb-4">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search integrations..."
      class="w-full max-w-md px-4 py-2.5 rounded-lg text-sm"
      style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
    />
  </div>

  <!-- Categories -->
  <div class="flex flex-wrap gap-2 mb-6">
    {#each categories as cat}
      <button
        type="button"
        class="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
        style="background: {activeCategory === cat.id
          ? 'var(--color-accent, #3b82f6)'
          : 'rgba(255,255,255,0.05)'}; color: {activeCategory === cat.id
          ? '#fff'
          : 'var(--color-text, #fff)'}; opacity: {activeCategory === cat.id
          ? 1
          : 0.6};"
        on:click={() => (activeCategory = cat.id)}
      >
        {cat.label}
      </button>
    {/each}
  </div>

  <!-- Integration grid -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each filtered as integration}
      <div
        class="rounded-lg p-5 flex flex-col"
        style="background: var(--color-surface, #1a2332); border: 1px solid {integration.connected
          ? 'rgba(34,197,94,0.3)'
          : 'var(--color-border, rgba(255,255,255,0.1))'};"
      >
        <div class="flex items-start justify-between mb-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center"
            style="background: rgba(59,130,246,0.1);"
          >
            <svg
              class="w-5 h-5"
              style="color: var(--color-accent, #3b82f6);"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d={iconMap[integration.category] || iconMap.productivity}
              />
            </svg>
          </div>
          <span
            class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
            style="background: {integration.connected
              ? 'rgba(34,197,94,0.15)'
              : integration.status === 'beta'
                ? 'rgba(234,179,8,0.15)'
                : 'rgba(255,255,255,0.05)'}; color: {integration.connected
              ? '#22c55e'
              : integration.status === 'beta'
                ? '#eab308'
                : 'rgba(255,255,255,0.4)'};"
          >
            {integration.connected ? "Connected" : integration.status}
          </span>
        </div>

        <h3
          class="text-sm font-semibold mb-1"
          style="color: var(--color-text, #fff);"
        >
          {integration.name}
        </h3>
        <div
          class="text-xs mb-1"
          style="color: var(--color-text, #fff); opacity: 0.4;"
        >
          {integration.category} &middot; {authLabel(integration.auth)} &middot;
          {integration.tier}
        </div>
        <div
          class="text-xs mb-4 line-clamp-2"
          style="color: var(--color-text, #fff); opacity: 0.35;"
        >
          {integration.description}
        </div>

        <div class="mt-auto space-y-2">
          {#if integration.connected}
            <a
              href="/console/integrations"
              class="block w-full py-2 text-xs font-medium rounded transition-colors text-center"
              style="background: rgba(59,130,246,0.15); color: #3b82f6;"
            >
              Manage in API Manager
            </a>
            <button
              type="button"
              on:click={() => disconnectApp(integration)}
              class="w-full py-2 text-xs font-medium rounded transition-colors"
              style="background: rgba(239,68,68,0.1); color: #ef4444;"
            >
              Disconnect
            </button>
          {:else}
            <button
              type="button"
              on:click={() => openWizard(integration)}
              class="w-full py-2 text-xs font-medium rounded transition-colors"
              style="background: var(--color-accent, #3b82f6); color: #fff;"
            >
              Connect
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if filtered.length === 0}
    <div
      class="text-center py-12"
      style="color: var(--color-text, #fff); opacity: 0.3;"
    >
      <p class="text-lg">No integrations found</p>
      <p class="text-sm mt-1">Try a different search or category</p>
    </div>
  {/if}
</div>

<!-- Config Wizard Modal -->
{#if wizardOpen && wizardApp}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center"
    style="background: rgba(0,0,0,0.6);"
  >
    <div
      class="w-full max-w-lg mx-4 rounded-lg p-6 max-h-[85vh] overflow-y-auto"
      style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));"
    >
      <div class="flex items-center justify-between mb-4">
        <h3
          class="text-lg font-semibold"
          style="color: var(--color-text, #fff);"
        >
          Connect {wizardApp.name}
        </h3>
        <button
          type="button"
          on:click={() => (wizardOpen = false)}
          class="p-1"
          style="color: var(--color-text, #fff); opacity: 0.5;"
          aria-label="Close"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            /></svg
          >
        </button>
      </div>

      <!-- Wizard steps indicator -->
      <div class="flex items-center gap-2 mb-6">
        {#each [1, 2, 3] as s}
          <div
            class="h-1.5 rounded-full flex-1 transition-all"
            style="background: {s <= wizardStep
              ? 'var(--color-accent, #3b82f6)'
              : 'rgba(255,255,255,0.1)'};"
          ></div>
        {/each}
      </div>

      {#if wizardStep === 1}
        <!-- Step 1: Overview -->
        <div class="space-y-4">
          <div
            class="rounded-lg p-4"
            style="background: var(--color-bg, #0f1923);"
          >
            <div class="flex items-center gap-3 mb-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                style="background: rgba(59,130,246,0.1);"
              >
                <svg
                  class="w-5 h-5"
                  style="color: var(--color-accent, #3b82f6);"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d={iconMap[wizardApp.category] || iconMap.productivity}
                  />
                </svg>
              </div>
              <div>
                <div
                  class="text-sm font-semibold"
                  style="color: var(--color-text, #fff);"
                >
                  {wizardApp.name}
                </div>
                <div
                  class="text-xs capitalize"
                  style="color: var(--color-text, #fff); opacity: 0.5;"
                >
                  {wizardApp.category}
                </div>
              </div>
            </div>
            <p
              class="text-xs mb-3"
              style="color: var(--color-text, #fff); opacity: 0.6;"
            >
              {wizardApp.description}
            </p>
            <div
              class="space-y-2 text-xs"
              style="color: var(--color-text, #fff); opacity: 0.6;"
            >
              <div class="flex justify-between">
                <span>Auth Method</span><span class="font-medium"
                  >{authLabel(wizardApp.auth)}</span
                >
              </div>
              <div class="flex justify-between">
                <span>Tier</span><span class="font-medium capitalize"
                  >{wizardApp.tier}</span
                >
              </div>
              <div class="flex justify-between">
                <span>Credentials Required</span><span class="font-medium"
                  >{wizardApp.credentialFields.filter((f) => f.required)
                    .length} fields</span
                >
              </div>
            </div>
          </div>
          {#if wizardApp.auth === "platform_oauth"}
            <button
              type="button"
              on:click={connectApp}
              disabled={wizardLoading}
              class="w-full py-2.5 text-sm font-medium rounded text-white transition-colors disabled:opacity-50"
              style="background: var(--color-accent, #3b82f6);"
            >
              {wizardLoading ? "Redirecting..." : `Authorize ${wizardApp.name}`}
            </button>
            <p class="text-[11px] text-center" style="color: var(--color-text, #fff); opacity: 0.35;">
              You'll be redirected to {wizardApp.name} to grant AtlasIT access to your workspace.
            </p>
          {:else}
            <button
              type="button"
              on:click={() => (wizardStep = 2)}
              class="w-full py-2.5 text-sm font-medium rounded text-white transition-colors"
              style="background: var(--color-accent, #3b82f6);"
            >
              Continue to Credentials
            </button>
          {/if}
        </div>
      {:else if wizardStep === 2}
        <!-- Step 2: Dynamic credential fields -->
        <div class="space-y-4">
          <p class="text-xs" style="color: var(--color-text, #fff); opacity: 0.5;">
            Enter the credentials for {wizardApp.name}. These are stored
            encrypted and used to connect to the API on your behalf.
          </p>

          {#each wizardApp.credentialFields as field}
            <div>
              <label
                class="block text-sm mb-1.5"
                style="color: var(--color-text, #fff); opacity: 0.7;"
              >
                {field.label}
                {#if field.required}<span style="color: #ef4444;">*</span>{/if}
              </label>
              {#if field.type === "textarea"}
                <textarea
                  bind:value={credValues[field.key]}
                  placeholder={field.placeholder || ""}
                  rows="4"
                  class="w-full px-3 py-2 rounded text-sm font-mono resize-y"
                  style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
                ></textarea>
              {:else}
                <input
                  type={fieldInputType(field)}
                  bind:value={credValues[field.key]}
                  placeholder={field.placeholder || ""}
                  class="w-full px-3 py-2 rounded text-sm"
                  style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
                />
              {/if}
              {#if field.helpText}
                <p
                  class="text-[11px] mt-1"
                  style="color: var(--color-text, #fff); opacity: 0.35;"
                >
                  {field.helpText}
                </p>
              {/if}
            </div>
          {/each}

          <button
            type="button"
            on:click={connectApp}
            disabled={wizardLoading || !requiredFilled}
            class="w-full py-2.5 text-sm font-medium rounded text-white disabled:opacity-50 transition-colors"
            style="background: var(--color-accent, #3b82f6);"
          >
            {wizardLoading ? "Connecting..." : `Connect ${wizardApp.name}`}
          </button>
          <button
            type="button"
            on:click={() => (wizardStep = 1)}
            class="w-full py-2 text-xs rounded"
            style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);"
          >
            Back
          </button>
        </div>
      {:else}
        <!-- Step 3: Confirmation -->
        <div class="space-y-4 text-center">
          <div
            class="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
            style="background: rgba(34,197,94,0.15);"
          >
            <svg
              class="w-6 h-6 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              /></svg
            >
          </div>
          <div>
            <p
              class="text-sm font-semibold"
              style="color: var(--color-text, #fff);"
            >
              {wizardApp.name} Connected
            </p>
            <p
              class="text-xs mt-1"
              style="color: var(--color-text, #fff); opacity: 0.5;"
            >
              JML workflows are now available for this application. You can
              manage credentials anytime in the API Manager.
            </p>
          </div>
          <div class="flex gap-2">
            <a
              href="/console/integrations"
              class="flex-1 py-2 text-xs font-medium rounded text-center transition-colors"
              style="background: var(--color-accent, #3b82f6); color: #fff;"
            >
              API Manager
            </a>
            <a
              href="/console/workflows"
              class="flex-1 py-2 text-xs font-medium rounded text-center transition-colors"
              style="background: rgba(255,255,255,0.08); color: var(--color-text, #fff);"
            >
              Workflows
            </a>
            <button
              type="button"
              on:click={() => (wizardOpen = false)}
              class="flex-1 py-2 text-xs font-medium rounded transition-colors"
              style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);"
            >
              Close
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
