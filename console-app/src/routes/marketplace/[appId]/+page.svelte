<script lang="ts">
  import { goto } from "$app/navigation";
  import ConfigForm from "$lib/components/marketplace/ConfigForm.svelte";
  import type { MarketplaceApp, Install, ConfigField } from "$lib/api/marketplace";
  import {
    installApp,
    uninstallApp,
    activateInstall,
    updateInstallConfig,
  } from "$lib/api/marketplace";
  import { session } from "$lib/stores/session";

  export let data: { app: MarketplaceApp | null; install: Install | null };

  let app = data.app;
  let install = data.install;
  let loading = false;
  let error: string | null = null;
  let configValues: Record<string, unknown> = install?.config ?? {};

  $: isInstalled =
    install && install.status !== "uninstalled" ? true : false;
  $: isActive = install?.status === "active";
  $: capabilities = parseJson<string[]>(app?.capabilities) ?? [];
  $: configFields = parseJson<ConfigField[]>(app?.config_schema) ?? [];

  function parseJson<T>(val: unknown): T | null {
    if (!val) return null;
    if (typeof val === "string") {
      try {
        return JSON.parse(val) as T;
      } catch {
        return null;
      }
    }
    return val as T;
  }

  const categoryColors: Record<string, string> = {
    identity: "bg-blue-100 text-blue-800",
    security: "bg-red-100 text-red-800",
    compliance: "bg-purple-100 text-purple-800",
    productivity: "bg-green-100 text-green-800",
    communication: "bg-yellow-100 text-yellow-800",
    utility: "bg-gray-100 text-gray-800",
    custom: "bg-indigo-100 text-indigo-800",
  };

  async function handleInstall() {
    if (!app || !$session?.tenantId) return;
    loading = true;
    error = null;
    try {
      install = await installApp($session.tenantId, app.id);
    } catch (e) {
      error = e instanceof Error ? e.message : "Install failed";
    } finally {
      loading = false;
    }
  }

  async function handleUninstall() {
    if (!install) return;
    loading = true;
    error = null;
    try {
      await uninstallApp(install.id);
      install = null;
    } catch (e) {
      error = e instanceof Error ? e.message : "Uninstall failed";
    } finally {
      loading = false;
    }
  }

  async function handleActivate() {
    if (!install) return;
    loading = true;
    error = null;
    try {
      install = await activateInstall(install.id);
    } catch (e) {
      error = e instanceof Error ? e.message : "Activation failed";
    } finally {
      loading = false;
    }
  }

  async function handleConfigSave(values: Record<string, unknown>) {
    if (!install) return;
    loading = true;
    error = null;
    try {
      install = await updateInstallConfig(install.id, values);
      configValues = install.config ?? {};
    } catch (e) {
      error = e instanceof Error ? e.message : "Config update failed";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{app?.name ?? "App"} - Marketplace - AtlasIT</title>
</svelte:head>

{#if !app}
  <div class="flex items-center justify-center min-h-[400px]">
    <div class="text-center">
      <h2 class="text-xl font-semibold text-gray-700">App not found</h2>
      <p class="mt-2 text-gray-500">
        This app may have been removed from the marketplace.
      </p>
      <button
        on:click={() => goto("/marketplace")}
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Back to Marketplace
      </button>
    </div>
  </div>
{:else}
  <div class="max-w-4xl mx-auto">
    <!-- Back link -->
    <button
      on:click={() => goto("/marketplace")}
      class="mb-6 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
    >
      <span>&larr;</span> Back to Marketplace
    </button>

    <!-- App Header -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-start gap-6">
        <div
          class="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400 shrink-0"
        >
          {#if app.logo_url}
            <img
              src={app.logo_url}
              alt={app.name}
              class="w-16 h-16 rounded-xl object-cover"
            />
          {:else}
            {app.name.charAt(0)}
          {/if}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900">{app.name}</h1>
            <span
              class="px-2 py-0.5 rounded-full text-xs font-medium {categoryColors[
                app.category
              ] ?? 'bg-gray-100 text-gray-800'}"
            >
              {app.category}
            </span>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            by {app.provider} &middot; v{app.version}
          </p>
          <p class="mt-3 text-gray-600">
            {app.description ?? "No description available."}
          </p>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-col gap-2 shrink-0">
          {#if !isInstalled}
            <button
              on:click={handleInstall}
              disabled={loading || app.status !== "active"}
              class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {loading ? "Installing..." : "Install"}
            </button>
          {:else if !isActive}
            <button
              on:click={handleActivate}
              disabled={loading}
              class="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {loading ? "Activating..." : "Activate"}
            </button>
            <button
              on:click={handleUninstall}
              disabled={loading}
              class="px-5 py-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              Uninstall
            </button>
          {:else}
            <span
              class="px-5 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium text-center"
            >
              Active
            </span>
            <button
              on:click={handleUninstall}
              disabled={loading}
              class="px-5 py-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              Uninstall
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- Error -->
    {#if error}
      <div
        class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
      >
        {error}
      </div>
    {/if}

    <!-- Capabilities -->
    {#if capabilities.length > 0}
      <div class="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Capabilities</h2>
        <div class="flex flex-wrap gap-2">
          {#each capabilities as cap}
            <span
              class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {cap.replace(/-/g, " ")}
            </span>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Configuration -->
    {#if isInstalled && configFields.length > 0}
      <div class="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
        <ConfigForm
          fields={configFields}
          values={configValues}
          {loading}
          onSubmit={handleConfigSave}
        />
      </div>
    {/if}

    <!-- Install Info -->
    {#if install}
      <div class="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">
          Installation Details
        </h2>
        <dl class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-gray-500">Status</dt>
            <dd class="font-medium text-gray-900 capitalize">
              {install.status}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">Installed</dt>
            <dd class="font-medium text-gray-900">
              {new Date(install.installed_at).toLocaleDateString()}
            </dd>
          </div>
          {#if install.activated_at}
            <div>
              <dt class="text-gray-500">Activated</dt>
              <dd class="font-medium text-gray-900">
                {new Date(install.activated_at).toLocaleDateString()}
              </dd>
            </div>
          {/if}
          <div>
            <dt class="text-gray-500">Auth Model</dt>
            <dd class="font-medium text-gray-900 uppercase">
              {app.auth_model}
            </dd>
          </div>
        </dl>
      </div>
    {/if}

    <!-- Documentation link -->
    {#if app.documentation_url}
      <div class="mt-6 text-center">
        <a
          href={app.documentation_url}
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Documentation &rarr;
        </a>
      </div>
    {/if}
  </div>
{/if}
