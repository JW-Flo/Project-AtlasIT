<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import {
    TRUST_FRAMEWORK_OPTIONS,
    normalizeTrustSettings,
    toggleFramework,
    type TrustSettings,
  } from "./model";

  const settingsTabs = [
    { href: "/console/settings", label: "General" },
    { href: "/console/settings/users", label: "Users" },
    { href: "/console/settings/audit-log", label: "Audit Log" },
    { href: "/console/settings/billing", label: "Billing" },
    { href: "/console/settings/trust", label: "Trust Center" },
  ];
  $: current = $page.url.pathname;

  let loading = true;
  let saving = false;
  let error = "";
  let settings: TrustSettings = normalizeTrustSettings(undefined);

  async function loadSettings() {
    loading = true;
    error = "";

    try {
      const res = await fetch("/api/trust/settings");
      if (!res.ok) throw new Error(`Failed to load trust settings (${res.status})`);

      const data = await res.json();
      settings = normalizeTrustSettings(data.settings);
    } catch (e: any) {
      error = e?.message || "Failed to load trust settings";
      settings = normalizeTrustSettings(undefined);
    } finally {
      loading = false;
    }
  }

  async function saveSettings() {
    saving = true;

    try {
      const res = await fetch("/api/trust/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error(`Failed to save trust settings (${res.status})`);

      const data = await res.json();
      settings = normalizeTrustSettings(data.settings);
      pushToast({ message: "Trust Center settings saved", variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to save trust settings", variant: "error" });
    } finally {
      saving = false;
    }
  }

  function setFramework(framework: string, checked: boolean) {
    settings = {
      ...settings,
      visibleFrameworks: toggleFramework(settings.visibleFrameworks, framework, checked),
    };
  }

  onMount(loadSettings);
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-semibold tracking-tight">Trust Center Settings</h1>

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

  {#if error}
    <Alert variant="destructive">
      <p>{error}</p>
    </Alert>
  {/if}

  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <Skeleton class="h-12 rounded-lg" />
      {/each}
    </div>
  {:else}
    <Card>
      <CardContent class="pt-6 space-y-6">
        <div class="space-y-2">
          <Label class="text-base">Public visibility</Label>
          <label class="flex items-center gap-3 rounded-md border px-3 py-2">
            <input
              type="checkbox"
              checked={settings.isPublic}
              on:change={(event) => {
                settings = { ...settings, isPublic: event.currentTarget.checked };
              }}
            />
            <span class="text-sm">Expose your Trust Center at <code>/trust/&lt;slug&gt;</code></span>
          </label>
        </div>

        <div class="space-y-2">
          <Label class="text-base">Visible frameworks</Label>
          <p class="text-sm text-muted-foreground">Only selected frameworks will be shown on your public Trust Center page.</p>

          <div class="grid gap-2 sm:grid-cols-2">
            {#each TRUST_FRAMEWORK_OPTIONS as framework}
              <label class="flex items-center gap-3 rounded-md border px-3 py-2">
                <input
                  type="checkbox"
                  checked={settings.visibleFrameworks.includes(framework)}
                  on:change={(event) => setFramework(framework, event.currentTarget.checked)}
                />
                <span class="text-sm">{framework}</span>
              </label>
            {/each}
          </div>
        </div>

        <div>
          <Button on:click={saveSettings} disabled={saving}>
            {saving ? "Saving..." : "Save Trust Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
