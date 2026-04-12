<script lang="ts">
  import { onMount } from "svelte";

  interface TenantSettings {
    tenant: {
      id: string;
      name: string;
      slug: string;
      tier: string;
      status: string;
      industry: string | null;
      size: string | null;
    } | null;
    preferences: Record<string, unknown>;
  }

  let settings: TenantSettings | null = null;
  let loading = true;
  let error: string | null = null;

  async function loadSettings() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/v1/tenant/settings");
      if (!res.ok) {
        error = `Failed to load settings (HTTP ${res.status})`;
        return;
      }
      const result = await res.json();
      if (result.data) {
        settings = result.data;
      } else {
        error = "No settings data returned";
      }
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  const sections = [
    {
      title: "Tenant Info",
      description: "Organization name, industry, company size, and branding.",
      href: "/console/settings/general",
    },
    {
      title: "Users & Roles",
      description: "Manage team members, invite users, and assign roles.",
      href: "/console/settings/users",
    },
    {
      title: "Security & MFA",
      description: "Multi-factor authentication, session policies, and access controls.",
      href: "/console/settings/security",
    },
    {
      title: "Billing",
      description: "Subscription plan, payment methods, and invoices.",
      href: "/console/settings/billing",
    },
    {
      title: "Notifications",
      description: "Email and in-app notification preferences.",
      href: "/console/settings/notifications",
    },
    {
      title: "Audit Log",
      description: "Full audit trail of actions taken within your organization.",
      href: "/console/settings/audit-log",
    },
    {
      title: "Trust Center",
      description: "Publicly share your compliance posture with customers.",
      href: "/console/settings/trust",
    },
  ];

  onMount(() => {
    loadSettings();
  });
</script>

<div class="p-8 max-w-5xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
    {#if settings?.tenant}
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {settings.tenant.name} · <span class="capitalize">{settings.tenant.tier}</span> tier
      </p>
    {/if}
  </div>

  {#if loading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each Array(7) as _}
        <div class="h-28 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      {/each}
    </div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <p class="text-red-800 dark:text-red-300 text-sm">{error}</p>
      <button
        on:click={loadSettings}
        class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
      >
        Retry
      </button>
    </div>
  {/if}

  {#if !loading || error}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each sections as sec}
        <a
          href={sec.href}
          class="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
        >
          <div class="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {sec.title}
          </div>
          <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">{sec.description}</div>
          <div class="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400">Configure →</div>
        </a>
      {/each}
    </div>
  {/if}
</div>
