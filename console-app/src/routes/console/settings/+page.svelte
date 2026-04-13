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

<div class="animate-fade-in max-w-5xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-foreground">Settings</h1>
    {#if settings?.tenant}
      <p class="mt-1 text-sm text-muted-foreground">
        {settings.tenant.name} · <span class="capitalize">{settings.tenant.tier}</span> tier
      </p>
    {/if}
  </div>

  {#if loading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each Array(7) as _}
        <div class="h-28 bg-muted rounded-lg animate-pulse"></div>
      {/each}
    </div>
  {:else if error}
    <div class="bg-destructive-muted border border-destructive/20 rounded-lg p-4 mb-6">
      <p class="text-destructive text-sm">{error}</p>
      <button
        on:click={loadSettings}
        class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md"
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
          class="block bg-card border border-border rounded-lg p-5 hover:border-primary dark:hover:border-primary transition-colors group"
        >
          <div class="font-semibold text-foreground group-hover:text-primary dark:group-hover:text-primary">
            {sec.title}
          </div>
          <div class="mt-1 text-sm text-muted-foreground">{sec.description}</div>
          <div class="mt-3 text-xs font-medium text-primary">Configure →</div>
        </a>
      {/each}
    </div>
  {/if}
</div>
