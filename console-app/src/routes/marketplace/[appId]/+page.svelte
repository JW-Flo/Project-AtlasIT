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
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { ArrowLeft, ExternalLink } from "lucide-svelte";

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
      <h2 class="text-xl font-semibold">App not found</h2>
      <p class="mt-2 text-muted-foreground">
        This app may have been removed from the marketplace.
      </p>
      <Button on:click={() => goto("/marketplace")} class="mt-4">
        Back to Marketplace
      </Button>
    </div>
  </div>
{:else}
  <div class="max-w-4xl mx-auto">
    <!-- Back link -->
    <button
      on:click={() => goto("/marketplace")}
      class="mb-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to Marketplace
    </button>

    <!-- App Header -->
    <Card>
      <CardContent class="pt-6">
        <div class="flex items-start gap-6">
          <div
            class="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0"
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
              <h1 class="text-2xl font-bold">{app.name}</h1>
              <Badge variant="secondary">{app.category}</Badge>
            </div>
            <p class="mt-1 text-sm text-muted-foreground">
              by {app.provider} &middot; v{app.version}
            </p>
            <p class="mt-3 text-foreground">
              {app.description ?? "No description available."}
            </p>
          </div>

          <!-- Action buttons -->
          <div class="flex flex-col gap-2 shrink-0">
            {#if !isInstalled}
              <Button
                on:click={handleInstall}
                disabled={loading || app.status !== "active"}
              >
                {loading ? "Installing..." : "Install"}
              </Button>
            {:else if !isActive}
              <Button variant="success" on:click={handleActivate} disabled={loading}>
                {loading ? "Activating..." : "Activate"}
              </Button>
              <Button variant="destructive" on:click={handleUninstall} disabled={loading}>
                Uninstall
              </Button>
            {:else}
              <Badge variant="success" class="px-5 py-2 text-center">Active</Badge>
              <Button variant="destructive" on:click={handleUninstall} disabled={loading}>
                Uninstall
              </Button>
            {/if}
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Error -->
    {#if error}
      <Alert variant="destructive" class="mt-4">
        <p>{error}</p>
      </Alert>
    {/if}

    <!-- Capabilities -->
    {#if capabilities.length > 0}
      <Card class="mt-6">
        <CardHeader>
          <CardTitle>Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex flex-wrap gap-2">
            {#each capabilities as cap}
              <Badge variant="secondary">{cap.replace(/-/g, " ")}</Badge>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Configuration -->
    {#if isInstalled && configFields.length > 0}
      <Card class="mt-6">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <ConfigForm
            fields={configFields}
            values={configValues}
            {loading}
            onSubmit={handleConfigSave}
          />
        </CardContent>
      </Card>
    {/if}

    <!-- Install Info -->
    {#if install}
      <Card class="mt-6">
        <CardHeader>
          <CardTitle>Installation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-muted-foreground">Status</dt>
              <dd class="font-medium capitalize">{install.status}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Installed</dt>
              <dd class="font-medium">{new Date(install.installed_at).toLocaleDateString()}</dd>
            </div>
            {#if install.activated_at}
              <div>
                <dt class="text-muted-foreground">Activated</dt>
                <dd class="font-medium">{new Date(install.activated_at).toLocaleDateString()}</dd>
              </div>
            {/if}
            <div>
              <dt class="text-muted-foreground">Auth Model</dt>
              <dd class="font-medium uppercase">{app.auth_model}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    {/if}

    <!-- Documentation link -->
    {#if app.documentation_url}
      <div class="mt-6 text-center">
        <a
          href={app.documentation_url}
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1"
        >
          View Documentation
          <ExternalLink class="h-3 w-3" />
        </a>
      </div>
    {/if}
  </div>
{/if}
