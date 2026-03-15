<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";

  const settingsTabs = [
    { href: "/console/settings", label: "General" },
    { href: "/console/settings/users", label: "Users" },
    { href: "/console/settings/audit-log", label: "Audit Log" },
    { href: "/console/settings/billing", label: "Billing" },
  ];
  $: current = $page.url.pathname;

  let loading = true;
  let error = "";
  let saving = false;

  let name = "";
  let industry = "";
  let size = "";

  const sizeOptions = ["1-10", "11-50", "51-200", "201-500", "500+"];

  async function loadSettings() {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/tenant/settings");
      if (!res.ok) throw new Error(`Failed to load settings (${res.status})`);
      const data = await res.json();
      name = data.name || "";
      industry = data.industry || "";
      size = data.size || "";
    } catch (e: any) {
      error = e?.message || "Failed to load settings";
    } finally {
      loading = false;
    }
  }

  async function saveSettings() {
    saving = true;
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, industry, size }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      pushToast({ message: "Settings saved", variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to save settings", variant: "error" });
    } finally {
      saving = false;
    }
  }

  onMount(loadSettings);
</script>

<div class="px-6 py-6 space-y-6 max-w-4xl mx-auto">
  <h1 class="text-2xl font-semibold">Organization Settings</h1>

  <div class="flex gap-6 border-b border-white/10 mb-6">
    {#each settingsTabs as tab}
      <a href={tab.href}
         class="pb-2 text-sm {current === tab.href ? 'text-white border-b-2 border-indigo-500' : 'text-white/50 hover:text-white/80'}"
      >{tab.label}</a>
    {/each}
  </div>

  {#if error}
    <div class="text-red-400 bg-red-900/20 p-4 rounded-lg text-sm">{error}</div>
  {/if}

  {#if loading}
    <div class="text-white/50 text-sm">Loading settings...</div>
  {:else}
    <div class="bg-[#1a2332] rounded-lg p-6 border border-white/10 space-y-5">
      <div>
        <label for="org-name" class="block text-sm text-white/60 mb-1.5">Organization Name</label>
        <input
          id="org-name"
          type="text"
          bind:value={name}
          class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="industry" class="block text-sm text-white/60 mb-1.5">Industry</label>
        <input
          id="industry"
          type="text"
          bind:value={industry}
          class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="company-size" class="block text-sm text-white/60 mb-1.5">Company Size</label>
        <select
          id="company-size"
          bind:value={size}
          class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Select size...</option>
          {#each sizeOptions as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </div>

      <div class="pt-2">
        <button
          on:click={saveSettings}
          disabled={saving}
          class="text-sm bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  {/if}
</div>
