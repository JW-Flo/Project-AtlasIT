<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";

  interface Integration {
    id: string;
    category: string;
    name: string;
    status: string;
    auth: string;
    tier: string;
    connected?: boolean;
  }

  const integrations: Integration[] = [
    { id: "google_workspace", category: "productivity", name: "Google Workspace", status: "planned", auth: "oauth", tier: "core" },
    { id: "microsoft_365", category: "productivity", name: "Microsoft 365", status: "planned", auth: "oauth", tier: "core" },
    { id: "slack", category: "productivity", name: "Slack", status: "planned", auth: "oauth", tier: "core" },
    { id: "bamboohr", category: "hr", name: "BambooHR", status: "planned", auth: "api-key", tier: "extended" },
    { id: "workday", category: "hr", name: "Workday", status: "planned", auth: "oauth", tier: "extended" },
    { id: "adp", category: "hr", name: "ADP", status: "planned", auth: "oauth", tier: "extended" },
    { id: "quickbooks", category: "finance", name: "QuickBooks", status: "planned", auth: "oauth", tier: "extended" },
    { id: "xero", category: "finance", name: "Xero", status: "planned", auth: "oauth", tier: "extended" },
    { id: "stripe", category: "finance", name: "Stripe", status: "planned", auth: "api-key", tier: "core" },
    { id: "okta", category: "security", name: "Okta", status: "beta", auth: "oauth", tier: "core" },
    { id: "auth0", category: "security", name: "Auth0", status: "planned", auth: "oauth", tier: "extended" },
    { id: "crowdstrike", category: "security", name: "CrowdStrike", status: "planned", auth: "oauth", tier: "extended" },
    { id: "aws", category: "infrastructure", name: "AWS", status: "planned", auth: "keys", tier: "core" },
    { id: "gcp", category: "infrastructure", name: "GCP", status: "planned", auth: "keys", tier: "extended" },
    { id: "azure", category: "infrastructure", name: "Azure", status: "planned", auth: "oauth", tier: "core" },
    { id: "zoom", category: "communication", name: "Zoom", status: "planned", auth: "oauth", tier: "extended" },
    { id: "teams", category: "communication", name: "Microsoft Teams", status: "planned", auth: "oauth", tier: "extended" },
    { id: "discord", category: "communication", name: "Discord", status: "planned", auth: "oauth", tier: "experimental" },
    { id: "jira", category: "productivity", name: "Jira", status: "planned", auth: "oauth", tier: "core" },
    { id: "github", category: "infrastructure", name: "GitHub", status: "planned", auth: "oauth", tier: "core" },
    { id: "datadog", category: "infrastructure", name: "Datadog", status: "planned", auth: "api-key", tier: "extended" },
    { id: "pagerduty", category: "security", name: "PagerDuty", status: "planned", auth: "api-key", tier: "extended" },
  ];

  const categories = [
    { id: "all", label: "All" },
    { id: "productivity", label: "Productivity" },
    { id: "hr", label: "HR" },
    { id: "finance", label: "Finance" },
    { id: "security", label: "Security" },
    { id: "infrastructure", label: "Infrastructure" },
    { id: "communication", label: "Communication" },
  ];

  const iconMap: Record<string, string> = {
    productivity: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    hr: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    finance: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    security: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    infrastructure: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01",
    communication: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  };

  let activeCategory = "all";
  let searchQuery = "";

  $: filtered = integrations.filter((i) => {
    if (activeCategory !== "all" && i.category !== activeCategory) return false;
    if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  function handleConnect(integration: Integration) {
    if (integration.status === "beta") {
      pushToast({ message: `${integration.name} integration is in beta. Contact support to enable.`, variant: "info" });
    } else {
      pushToast({ message: `${integration.name} integration coming soon!`, variant: "info" });
    }
  }
</script>

<div class="px-5 py-5 max-w-[1400px] mx-auto">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-3xl font-semibold mb-1" style="color: var(--color-text, #fff);">Marketplace</h1>
      <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.5;">
        Connect your business apps to AtlasIT for automated compliance and IT management
      </p>
    </div>
    <a href="/console" class="text-sm px-3 py-1.5 rounded" style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);">
      Back to Dashboard
    </a>
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
        style="background: {activeCategory === cat.id ? 'var(--color-accent, #3b82f6)' : 'rgba(255,255,255,0.05)'}; color: {activeCategory === cat.id ? '#fff' : 'var(--color-text, #fff)'}; opacity: {activeCategory === cat.id ? 1 : 0.6};"
        on:click={() => activeCategory = cat.id}
      >
        {cat.label}
      </button>
    {/each}
  </div>

  <!-- Integration grid -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each filtered as integration}
      <div class="rounded-lg p-5 flex flex-col" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(59,130,246,0.1);">
            <svg class="w-5 h-5" style="color: var(--color-accent, #3b82f6);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconMap[integration.category] || iconMap.productivity} />
            </svg>
          </div>
          <span
            class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
            style="background: {integration.status === 'beta' ? 'rgba(234,179,8,0.15)' : integration.status === 'live' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)'}; color: {integration.status === 'beta' ? '#eab308' : integration.status === 'live' ? '#22c55e' : 'rgba(255,255,255,0.4)'};"
          >
            {integration.status}
          </span>
        </div>

        <h3 class="text-sm font-semibold mb-1" style="color: var(--color-text, #fff);">{integration.name}</h3>
        <div class="text-xs mb-4" style="color: var(--color-text, #fff); opacity: 0.4;">
          {integration.category} &middot; {integration.auth === "oauth" ? "OAuth 2.0" : integration.auth === "api-key" ? "API Key" : "Access Keys"} &middot; {integration.tier}
        </div>

        <div class="mt-auto">
          <button
            type="button"
            on:click={() => handleConnect(integration)}
            class="w-full py-2 text-xs font-medium rounded transition-colors"
            style="background: {integration.status === 'beta' ? 'var(--color-accent, #3b82f6)' : 'rgba(255,255,255,0.05)'}; color: {integration.status === 'beta' ? '#fff' : 'var(--color-text, #fff)'}; opacity: {integration.status === 'beta' ? 1 : 0.6};"
          >
            {integration.status === "beta" ? "Request Access" : "Coming Soon"}
          </button>
        </div>
      </div>
    {/each}
  </div>

  {#if filtered.length === 0}
    <div class="text-center py-12" style="color: var(--color-text, #fff); opacity: 0.3;">
      <p class="text-lg">No integrations found</p>
      <p class="text-sm mt-1">Try a different search or category</p>
    </div>
  {/if}
</div>
