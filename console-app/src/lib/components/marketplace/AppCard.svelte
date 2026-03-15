<script lang="ts">
  import type { MarketplaceApp, Install } from "$lib/api/marketplace";

  export let app: MarketplaceApp;
  export let install: Install | null = null;
  export let loading: boolean = false;
  export let onInstall: ((app: MarketplaceApp) => void) | undefined = undefined;

  $: status = install?.status ?? "available";

  $: statusLabel =
    status === "active"
      ? "Active"
      : status === "installed"
        ? "Installed"
        : status === "configuring"
          ? "Configuring"
          : status === "error"
            ? "Error"
            : "Available";

  $: statusColor =
    status === "active"
      ? "#22c55e"
      : status === "installed"
        ? "#3b82f6"
        : status === "configuring"
          ? "#eab308"
          : status === "error"
            ? "#ef4444"
            : "var(--color-text-dim)";

  $: statusBg =
    status === "active"
      ? "rgba(34,197,94,0.15)"
      : status === "installed"
        ? "rgba(59,130,246,0.15)"
        : status === "configuring"
          ? "rgba(234,179,8,0.15)"
          : status === "error"
            ? "rgba(239,68,68,0.15)"
            : "rgba(255,255,255,0.05)";

  function categoryColor(cat: string): string {
    const map: Record<string, string> = {
      identity: "#8b5cf6",
      security: "#ef4444",
      productivity: "#3b82f6",
      communication: "#06b6d4",
      hr: "#f59e0b",
      finance: "#10b981",
      infrastructure: "#6366f1",
    };
    return map[cat] ?? "#6b7280";
  }
</script>

<a
  href="/marketplace/{app.id}"
  class="group block rounded-lg p-5 flex flex-col transition-all duration-200 hover:-translate-y-0.5"
  style="background: var(--color-surface); border: 1px solid {install
    ? 'rgba(34,197,94,0.2)'
    : 'var(--color-border)'};"
>
  <div class="flex items-start justify-between mb-3">
    <div class="flex items-center gap-3">
      {#if app.logo_url}
        <img
          src={app.logo_url}
          alt="{app.name} logo"
          class="w-10 h-10 rounded-lg object-contain"
          style="background: rgba(255,255,255,0.05);"
        />
      {:else}
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
          style="background: {categoryColor(app.category)}20; color: {categoryColor(app.category)};"
        >
          {app.name.charAt(0)}
        </div>
      {/if}
    </div>
    <span
      class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium"
      style="background: {statusBg}; color: {statusColor};"
    >
      {statusLabel}
    </span>
  </div>

  <h3 class="text-sm font-semibold mb-1" style="color: var(--color-text);">
    {app.name}
  </h3>

  <div class="flex items-center gap-1.5 mb-2">
    <span
      class="text-[10px] px-1.5 py-0.5 rounded font-medium"
      style="background: {categoryColor(app.category)}15; color: {categoryColor(app.category)};"
    >
      {app.category}
    </span>
    {#if app.auth_model}
      <span
        class="text-[10px] px-1.5 py-0.5 rounded"
        style="background: rgba(255,255,255,0.05); color: var(--color-text-dim);"
      >
        {app.auth_model}
      </span>
    {/if}
  </div>

  <p
    class="text-xs line-clamp-2 mb-4 flex-1"
    style="color: var(--color-text-dim);"
  >
    {app.description || "No description available"}
  </p>

  <div class="mt-auto">
    {#if install}
      <span
        class="block w-full py-2 text-xs font-medium rounded text-center transition-colors group-hover:brightness-110"
        style="background: rgba(59,130,246,0.15); color: #3b82f6;"
      >
        View Details
      </span>
    {:else}
      <button
        type="button"
        disabled={loading}
        class="w-full py-2 text-xs font-medium rounded text-white transition-colors disabled:opacity-50"
        style="background: var(--color-accent);"
        on:click|preventDefault|stopPropagation={() => onInstall?.(app)}
      >
        {#if loading}
          Installing...
        {:else}
          Install
        {/if}
      </button>
    {/if}
  </div>
</a>
