<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import {
    AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Key, Bot, Shield,
    Clock, User, Search, Filter
  } from "lucide-svelte";

  interface NhiCredential {
    id: string;
    credentialType: string;
    provider: string;
    externalId: string;
    displayName: string;
    ownerEmail: string | null;
    scopes: string[] | string | null;
    permissions: string | null;
    expiresAt: string | null;
    lastUsedAt: string | null;
    lastRotatedAt: string | null;
    riskScore: number;
    riskFactors: Record<string, unknown> | null;
    status: string;
    linkedUserEmail: string | null;
    linkedUserName: string | null;
    createdAt: string;
    updatedAt: string;
  }

  interface AuditEntry {
    id: string;
    action: string;
    actor: string;
    details: Record<string, unknown> | null;
    createdAt: string;
  }

  let loading = true;
  let error: string | null = null;
  let credentials: NhiCredential[] = [];
  let total = 0;
  let scanning = false;

  // Filters
  let filterStatus = "";
  let filterType = "";
  let filterProvider = "";
  let searchQuery = "";

  // Expanded row
  let expandedId: string | null = null;
  let detailLoading = false;
  let detailAudit: AuditEntry[] = [];

  // Actions
  let updatingId = new Set<string>();

  const TYPE_LABELS: Record<string, string> = {
    service_account: "Service Account",
    oauth_app: "OAuth App",
    access_key: "Access Key",
    api_key: "API Key",
    bot: "Bot",
    oauth_grant: "OAuth Grant",
  };

  const PROVIDER_LABELS: Record<string, string> = {
    google_workspace: "Google Workspace",
    microsoft_365: "Microsoft 365",
    aws: "AWS",
    github: "GitHub",
    okta: "Okta",
    slack: "Slack",
  };

  function typeLabel(t: string): string { return TYPE_LABELS[t] ?? t; }
  function providerLabel(p: string): string { return PROVIDER_LABELS[p] ?? p; }

  function riskVariant(score: number): "destructive" | "warning" | "secondary" | "success" {
    if (score >= 80) return "destructive";
    if (score >= 50) return "warning";
    if (score >= 20) return "secondary";
    return "success";
  }

  function statusVariant(s: string): "success" | "destructive" | "warning" | "secondary" {
    if (s === "active") return "success";
    if (s === "revoked") return "destructive";
    if (s === "rotation_pending") return "warning";
    return "secondary";
  }

  function timeAgo(iso: string | null): string {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days > 30) return `${Math.floor(days / 30)}mo ago`;
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  }

  function expiryStatus(expiresAt: string | null): { label: string; variant: "destructive" | "warning" | "secondary" } | null {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { label: "Expired", variant: "destructive" };
    if (diff <= 7 * 86400000) return { label: `Expires in ${Math.ceil(diff / 86400000)}d`, variant: "warning" };
    return null;
  }

  function scopesList(scopes: string[] | string | null): string[] {
    if (!scopes) return [];
    if (Array.isArray(scopes)) return scopes;
    if (typeof scopes === "string") return scopes.split(",").map(s => s.trim()).filter(Boolean);
    return [];
  }

  $: filtered = credentials.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.displayName?.toLowerCase().includes(q) &&
          !c.ownerEmail?.toLowerCase().includes(q) &&
          !c.provider?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function loadCredentials() {
    loading = true;
    error = null;
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("type", filterType);
      if (filterProvider) params.set("provider", filterProvider);
      params.set("limit", "200");
      const res = await fetch(`/api/nhi?${params}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      credentials = data.credentials ?? [];
      total = data.total ?? 0;
    } catch (e: any) {
      error = e?.message || "Failed to load NHI credentials";
      credentials = [];
    } finally {
      loading = false;
    }
  }

  async function runDiscovery() {
    scanning = true;
    try {
      const res = await fetch("/api/nhi", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        pushToast({ message: `Discovery complete: ${data.synced ?? data.discovered ?? "?"} credentials found`, variant: "success" });
        await loadCredentials();
      } else {
        pushToast({ message: data.error || data.message || "Discovery failed", variant: "error" });
      }
    } catch (e: any) {
      pushToast({ message: e?.message || "Discovery failed", variant: "error" });
    } finally {
      scanning = false;
    }
  }

  async function toggleExpanded(id: string) {
    if (expandedId === id) {
      expandedId = null;
      return;
    }
    expandedId = id;
    detailLoading = true;
    detailAudit = [];
    try {
      const res = await fetch(`/api/nhi/${id}`);
      if (res.ok) {
        const data = await res.json();
        detailAudit = data.auditLog ?? [];
      }
    } catch { /* silent */ }
    detailLoading = false;
  }

  async function updateStatus(id: string, newStatus: string) {
    updatingId.add(id);
    updatingId = new Set(updatingId);
    try {
      const res = await fetch(`/api/nhi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      const idx = credentials.findIndex(c => c.id === id);
      if (idx >= 0 && data.credential) {
        credentials[idx] = data.credential;
        credentials = [...credentials];
      }
      pushToast({ message: `Status changed to ${newStatus}`, variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Update failed", variant: "error" });
    }
    updatingId.delete(id);
    updatingId = new Set(updatingId);
  }

  async function revokeCredential(id: string) {
    updatingId.add(id);
    updatingId = new Set(updatingId);
    try {
      const res = await fetch(`/api/nhi/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      const idx = credentials.findIndex(c => c.id === id);
      if (idx >= 0) {
        credentials[idx] = { ...credentials[idx], status: "revoked" };
        credentials = [...credentials];
      }
      pushToast({ message: "Credential revoked", variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Revoke failed", variant: "error" });
    }
    updatingId.delete(id);
    updatingId = new Set(updatingId);
  }

  function applyFilters() {
    loadCredentials();
  }

  onMount(loadCredentials);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Non-Human Identities</h1>
      <p class="text-sm text-muted-foreground">Service accounts, API keys, OAuth apps, and bot credentials across connected adapters.</p>
    </div>
    <Button on:click={runDiscovery} disabled={scanning} size="sm">
      <RefreshCw class="h-4 w-4 mr-1.5 {scanning ? 'animate-spin' : ''}" />
      {scanning ? "Scanning..." : "Discover NHIs"}
    </Button>
  </div>

  <!-- Stats -->
  {#if !loading && credentials.length > 0}
    {@const active = credentials.filter(c => c.status === "active").length}
    {@const expiringSoon = credentials.filter(c => expiryStatus(c.expiresAt)?.variant === "warning").length}
    {@const expired = credentials.filter(c => expiryStatus(c.expiresAt)?.variant === "destructive").length}
    {@const highRisk = credentials.filter(c => c.riskScore >= 80).length}
    <div class="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <Card>
        <CardContent class="pt-4 pb-3">
          <p class="text-xs text-muted-foreground uppercase font-medium">Total</p>
          <p class="text-2xl font-bold mt-1">{total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4 pb-3">
          <p class="text-xs text-muted-foreground uppercase font-medium">Active</p>
          <p class="text-2xl font-bold mt-1 text-green-500">{active}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4 pb-3">
          <p class="text-xs text-muted-foreground uppercase font-medium">Expiring Soon</p>
          <p class="text-2xl font-bold mt-1 text-yellow-500">{expiringSoon + expired}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4 pb-3">
          <p class="text-xs text-muted-foreground uppercase font-medium">High Risk</p>
          <p class="text-2xl font-bold mt-1 text-red-500">{highRisk}</p>
        </CardContent>
      </Card>
    </div>
  {/if}

  <!-- Filters -->
  <div class="flex flex-wrap gap-3 items-center">
    <div class="relative flex-1 min-w-[200px] max-w-sm">
      <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search by name, owner, or provider..."
        bind:value={searchQuery}
        class="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm"
      />
    </div>
    <select
      bind:value={filterStatus}
      on:change={applyFilters}
      class="h-9 rounded-md border border-input bg-background px-3 text-sm"
    >
      <option value="">All Statuses</option>
      <option value="active">Active</option>
      <option value="revoked">Revoked</option>
      <option value="rotation_pending">Rotation Pending</option>
    </select>
    <select
      bind:value={filterType}
      on:change={applyFilters}
      class="h-9 rounded-md border border-input bg-background px-3 text-sm"
    >
      <option value="">All Types</option>
      <option value="service_account">Service Account</option>
      <option value="oauth_app">OAuth App</option>
      <option value="access_key">Access Key</option>
      <option value="api_key">API Key</option>
      <option value="bot">Bot</option>
    </select>
    <select
      bind:value={filterProvider}
      on:change={applyFilters}
      class="h-9 rounded-md border border-input bg-background px-3 text-sm"
    >
      <option value="">All Providers</option>
      <option value="google_workspace">Google Workspace</option>
      <option value="microsoft_365">Microsoft 365</option>
      <option value="aws">AWS</option>
      <option value="github">GitHub</option>
      <option value="okta">Okta</option>
    </select>
  </div>

  <!-- Table -->
  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3, 4] as _}
        <Skeleton class="h-14 rounded-lg" />
      {/each}
    </div>
  {:else if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>
  {:else if filtered.length === 0}
    <Card class="border-dashed">
      <CardContent class="py-10 text-center text-sm text-muted-foreground">
        {#if credentials.length === 0}
          No NHI credentials discovered yet. Click "Discover NHIs" to scan connected adapters.
        {:else}
          No credentials match your filters.
        {/if}
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-4 py-3 font-medium w-6"></th>
                <th class="px-4 py-3 font-medium">Name</th>
                <th class="px-4 py-3 font-medium">Type</th>
                <th class="px-4 py-3 font-medium">Provider</th>
                <th class="px-4 py-3 font-medium">Owner</th>
                <th class="px-4 py-3 font-medium">Risk</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Last Used</th>
                <th class="px-4 py-3 font-medium">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {#each filtered as cred}
                {@const expiry = expiryStatus(cred.expiresAt)}
                <tr
                  class="border-t hover:bg-muted/50 cursor-pointer transition-colors"
                  on:click={() => toggleExpanded(cred.id)}
                >
                  <td class="px-4 py-3 text-muted-foreground">
                    {#if expandedId === cred.id}
                      <ChevronUp class="h-4 w-4" />
                    {:else}
                      <ChevronDown class="h-4 w-4" />
                    {/if}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      {#if cred.credentialType === "bot"}
                        <Bot class="h-4 w-4 text-muted-foreground shrink-0" />
                      {:else if cred.credentialType === "access_key" || cred.credentialType === "api_key"}
                        <Key class="h-4 w-4 text-muted-foreground shrink-0" />
                      {:else}
                        <Shield class="h-4 w-4 text-muted-foreground shrink-0" />
                      {/if}
                      <span class="font-medium truncate max-w-[200px]">{cred.displayName || cred.externalId || "Unknown"}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs">{typeLabel(cred.credentialType)}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs">{providerLabel(cred.provider)}</span>
                  </td>
                  <td class="px-4 py-3 text-xs text-muted-foreground">
                    {cred.ownerEmail || cred.linkedUserEmail || "Unowned"}
                  </td>
                  <td class="px-4 py-3">
                    <Badge variant={riskVariant(cred.riskScore)} class="text-xs tabular-nums">{cred.riskScore}</Badge>
                  </td>
                  <td class="px-4 py-3">
                    <Badge variant={statusVariant(cred.status)} class="text-xs capitalize">{cred.status.replace("_", " ")}</Badge>
                  </td>
                  <td class="px-4 py-3 text-xs text-muted-foreground">
                    {timeAgo(cred.lastUsedAt)}
                  </td>
                  <td class="px-4 py-3">
                    {#if expiry}
                      <Badge variant={expiry.variant} class="text-xs">{expiry.label}</Badge>
                    {:else if cred.expiresAt}
                      <span class="text-xs text-muted-foreground">{new Date(cred.expiresAt).toLocaleDateString()}</span>
                    {:else}
                      <span class="text-xs text-muted-foreground">No expiry</span>
                    {/if}
                  </td>
                </tr>

                {#if expandedId === cred.id}
                  <tr class="border-t bg-muted/30">
                    <td colspan="9" class="px-6 py-4">
                      <div class="space-y-4">
                        <div class="grid gap-4 sm:grid-cols-2">
                          <!-- Details -->
                          <div class="space-y-3">
                            <div>
                              <span class="text-xs font-medium text-muted-foreground uppercase">External ID</span>
                              <p class="mt-0.5 text-sm font-mono">{cred.externalId || "—"}</p>
                            </div>
                            {#if scopesList(cred.scopes).length > 0}
                              <div>
                                <span class="text-xs font-medium text-muted-foreground uppercase">Scopes</span>
                                <div class="flex flex-wrap gap-1 mt-1">
                                  {#each scopesList(cred.scopes).slice(0, 10) as scope}
                                    <Badge variant="secondary" class="text-xs font-mono">{scope}</Badge>
                                  {/each}
                                  {#if scopesList(cred.scopes).length > 10}
                                    <Badge variant="secondary" class="text-xs">+{scopesList(cred.scopes).length - 10} more</Badge>
                                  {/if}
                                </div>
                              </div>
                            {/if}
                            {#if cred.riskFactors && Object.keys(cred.riskFactors).length > 0}
                              <div>
                                <span class="text-xs font-medium text-muted-foreground uppercase">Risk Factors</span>
                                <div class="flex flex-wrap gap-1 mt-1">
                                  {#each Object.entries(cred.riskFactors) as [key, val]}
                                    <Badge variant="warning" class="text-xs">{key}: {val}</Badge>
                                  {/each}
                                </div>
                              </div>
                            {/if}
                            <div class="flex gap-4 text-xs text-muted-foreground">
                              {#if cred.lastRotatedAt}
                                <span>Rotated: {timeAgo(cred.lastRotatedAt)}</span>
                              {/if}
                              <span>Discovered: {new Date(cred.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <!-- Actions -->
                          <div class="space-y-3">
                            <div>
                              <span class="text-xs font-medium text-muted-foreground uppercase">Actions</span>
                              <div class="flex gap-2 mt-1" on:click|stopPropagation>
                                {#if cred.status === "active"}
                                  <Button size="sm" variant="outline" disabled={updatingId.has(cred.id)}
                                    on:click={() => updateStatus(cred.id, "rotation_pending")}>
                                    <RefreshCw class="h-3 w-3 mr-1" /> Request Rotation
                                  </Button>
                                  <Button size="sm" variant="destructive" disabled={updatingId.has(cred.id)}
                                    on:click={() => revokeCredential(cred.id)}>
                                    Revoke
                                  </Button>
                                {:else if cred.status === "rotation_pending"}
                                  <Button size="sm" variant="outline" disabled={updatingId.has(cred.id)}
                                    on:click={() => updateStatus(cred.id, "active")}>
                                    Mark Rotated
                                  </Button>
                                  <Button size="sm" variant="destructive" disabled={updatingId.has(cred.id)}
                                    on:click={() => revokeCredential(cred.id)}>
                                    Revoke
                                  </Button>
                                {:else}
                                  <span class="text-xs text-muted-foreground italic">Credential revoked</span>
                                {/if}
                              </div>
                            </div>

                            <!-- Audit log -->
                            <div>
                              <span class="text-xs font-medium text-muted-foreground uppercase">Audit Log</span>
                              <div class="mt-1 space-y-1 max-h-40 overflow-y-auto">
                                {#if detailLoading}
                                  <Skeleton class="h-6 rounded" />
                                {:else if detailAudit.length > 0}
                                  {#each detailAudit as entry}
                                    <div class="flex gap-2 text-xs border-l-2 border-border pl-2 py-0.5">
                                      <span class="font-medium">{entry.actor || "System"}</span>
                                      <span class="text-muted-foreground">{entry.action.replace("nhi_credential.", "")}</span>
                                      <span class="text-muted-foreground ml-auto shrink-0">{new Date(entry.createdAt).toLocaleString()}</span>
                                    </div>
                                  {/each}
                                {:else}
                                  <p class="text-xs text-muted-foreground italic">No audit entries.</p>
                                {/if}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
