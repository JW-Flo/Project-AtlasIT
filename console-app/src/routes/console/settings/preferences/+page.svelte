<script lang="ts">
  import { onMount } from "svelte";
  import { session } from "$lib/stores/session";
  import { preferences, fetchPreferences, updatePreference } from "$lib/stores/preferences";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";

  let loading = true;
  let tenantAge: number | null = null; // days since tenant creation
  let showHelpIcons = true;
  let saving = false;

  async function loadTenantAge() {
    try {
      const res = await fetch("/api/v1/tenant/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.createdAt) {
          const created = new Date(data.createdAt).getTime();
          const now = Date.now();
          tenantAge = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        }
      }
    } catch (err) {
      console.error("Failed to load tenant age:", err);
    }
  }

  async function load() {
    loading = true;
    await Promise.all([fetchPreferences(), loadTenantAge()]);
    showHelpIcons = $preferences.showHelpIcons;
    loading = false;
  }

  async function handleToggleHelpIcons() {
    saving = true;
    try {
      await updatePreference("showHelpIcons", !showHelpIcons);
      showHelpIcons = !showHelpIcons;
      pushToast({
        type: "success",
        message: showHelpIcons ? "Help icons enabled" : "Help icons disabled",
      });
    } catch (err) {
      pushToast({
        type: "error",
        message: "Failed to update preference",
      });
    } finally {
      saving = false;
    }
  }

  onMount(() => {
    load();
  });
</script>

<div class="animate-fade-in">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-foreground">Interface Preferences</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Customize how the platform displays information and guidance.
    </p>
  </div>

  {#if loading}
    <Card>
      <CardContent class="py-6">
        <Skeleton class="h-8 w-3/4 mb-4" />
        <Skeleton class="h-4 w-full mb-2" />
        <Skeleton class="h-4 w-5/6" />
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardHeader>
        <CardTitle>Help & Onboarding</CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Help Icons Toggle -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="text-base font-medium text-foreground">Contextual Help Icons</h3>
            <p class="text-sm text-muted-foreground mt-1">
              Show question mark icons throughout the platform that display tooltips explaining
              compliance concepts, automation rules, and other features.
            </p>
            {#if tenantAge !== null && tenantAge < 30}
              <p class="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                Note: Your account is {tenantAge} days old. Help icons are recommended for accounts
                under 30 days old as you familiarize yourself with the platform.
              </p>
            {/if}
          </div>
          <div class="ml-6 flex items-center">
            <button
              on:click={handleToggleHelpIcons}
              disabled={saving}
              aria-label="{showHelpIcons ? 'Disable' : 'Enable'} help icons"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary {showHelpIcons
                ? 'bg-blue-600'
                : 'bg-gray-300 dark:bg-gray-600'} {saving ? 'opacity-50 cursor-not-allowed' : ''}"
            >
              <span
                class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform {showHelpIcons
                  ? 'translate-x-6'
                  : 'translate-x-1'}"
              ></span>
            </button>
          </div>
        </div>

        <!-- Future preferences can go here -->
        <div class="border-t border-border pt-6">
          <p class="text-xs text-muted-foreground italic">
            More interface preferences will be available in future updates.
          </p>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
