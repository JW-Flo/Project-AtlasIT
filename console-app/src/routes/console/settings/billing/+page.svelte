<script lang="ts">
  import { page } from "$app/stores";

  const settingsTabs = [
    { href: "/console/settings", label: "General" },
    { href: "/console/settings/users", label: "Users" },
    { href: "/console/settings/audit-log", label: "Audit Log" },
    { href: "/console/settings/billing", label: "Billing" },
  ];
  $: current = $page.url.pathname;
</script>

<div class="px-6 py-6 space-y-6 max-w-4xl mx-auto">
  <h1 class="text-2xl font-semibold">Billing</h1>

  <div class="flex gap-6 border-b border-white/10 mb-6">
    {#each settingsTabs as tab}
      <a href={tab.href}
         class="pb-2 text-sm {current === tab.href ? 'text-white border-b-2 border-indigo-500' : 'text-white/50 hover:text-white/80'}"
      >{tab.label}</a>
    {/each}
  </div>

  <div class="bg-[#1a2332] rounded-lg p-6 border border-white/10">
    <h2 class="text-lg font-semibold mb-2">Plan: Starter (Pilot)</h2>
    <p class="text-sm text-white/60">
      Billing management will be available in a future release.
      Contact <a href="mailto:support@atlasit.pro" class="text-indigo-400 hover:text-indigo-300">support@atlasit.pro</a> for billing inquiries.
    </p>
  </div>
</div>
