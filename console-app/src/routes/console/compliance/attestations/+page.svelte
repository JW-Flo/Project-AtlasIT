<script lang="ts">
  import { onMount } from "svelte";

  interface Attestation {
    id: string;
    framework: string;
    controlId: string;
    attestationKey: string;
    status: "active" | "expired" | "revoked";
    statement: string;
    attestedById: string;
    attestedByEmail: string | null;
    attestedByName: string | null;
    attestedAt: string;
    validUntil: string | null;
    evidenceRefIds: string[] | null;
    revokedAt: string | null;
    revokedBy: string | null;
    revocationReason: string | null;
    createdAt: string;
  }

  let items: Attestation[] = [];
  let facets: Array<{ framework: string; status: string; cnt: string }> = [];
  let loading = true;
  let error: string | null = null;

  let frameworkFilter = "all";
  let statusFilter: "all" | "active" | "expired" | "revoked" = "all";
  let expandedId: string | null = null;

  let showForm = false;
  let formFramework = "SOC2";
  let formControlId = "";
  let formKey = "";
  let formStatement = "";
  let formValidUntil = "";
  let formError: string | null = null;
  let submitting = false;

  let userRole = "";

  const FRAMEWORKS = ["SOC2", "ISO27001", "NIST_CSF", "HIPAA", "GDPR"];

  async function load() {
    loading = true;
    error = null;
    try {
      const p = new URLSearchParams();
      if (frameworkFilter !== "all") p.set("framework", frameworkFilter);
      if (statusFilter !== "all") p.set("status", statusFilter);
      const res = await fetch(`/api/compliance/api/v1/attestations?${p.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      items = j.data?.items ?? [];
      facets = j.data?.facets?.byFramework ?? [];
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function createAttestation() {
    if (!formControlId.trim() || !formKey.trim() || !formStatement.trim()) return;
    submitting = true;
    formError = null;
    try {
      const body: Record<string, unknown> = {
        framework: formFramework,
        controlId: formControlId.trim(),
        attestationKey: formKey.trim(),
        statement: formStatement.trim(),
      };
      if (formValidUntil) body.validUntil = new Date(formValidUntil).toISOString();
      const res = await fetch("/api/compliance/api/v1/attestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { message?: string }).message ?? `HTTP ${res.status}`);
      }
      formControlId = "";
      formKey = "";
      formStatement = "";
      formValidUntil = "";
      showForm = false;
      await load();
    } catch (e) {
      formError = (e as Error).message;
    } finally {
      submitting = false;
    }
  }

  async function revokeAttestation(id: string) {
    const reason = prompt("Reason for revocation (optional):");
    if (reason === null) return;
    try {
      const res = await fetch(`/api/compliance/api/v1/attestations/${id}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || null }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e) {
      alert(`Revoke failed: ${(e as Error).message}`);
    }
  }

  function statusClass(s: string): string {
    switch (s) {
      case "active":  return "bg-success-muted text-success";
      case "expired": return "bg-warning-muted text-warning";
      case "revoked": return "bg-destructive-muted text-destructive";
      default:        return "bg-muted text-muted-foreground";
    }
  }

  function frameworkColor(key: string): string {
    const map: Record<string, string> = {
      SOC2: "bg-info-muted text-info",
      ISO27001: "bg-primary-muted text-primary",
      NIST_CSF: "bg-info-muted text-info",
      HIPAA: "bg-warning-muted text-warning",
      GDPR: "bg-primary-muted text-primary",
    };
    return map[key] ?? "bg-muted text-muted-foreground";
  }

  function relativeTime(iso: string | null): string {
    if (!iso) return "—";
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    return "just now";
  }

  function applyFilters() {
    expandedId = null;
    load();
  }

  $: totalActive = facets.filter((f) => f.status === "active").reduce((s, f) => s + parseInt(f.cnt, 10), 0);
  $: totalRevoked = facets.filter((f) => f.status === "revoked").reduce((s, f) => s + parseInt(f.cnt, 10), 0);

  onMount(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem("atlasit_user") ?? "{}");
      userRole = u.role ?? "";
    } catch {}
    load();
  });
</script>

<div class="animate-fade-in">
  <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Attestations</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Formal signed statements that a control is working. Each attestation generates
        compliance evidence. Revoking one generates negative evidence — your score reflects reality.
      </p>
    </div>
    {#if userRole === "admin" || userRole === "owner"}
      <button
        on:click={() => { showForm = !showForm; formError = null; }}
        class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md"
      >
        {showForm ? "Cancel" : "New Attestation"}
      </button>
    {/if}
  </div>

  <div class="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="bg-card border border-border rounded-lg p-4">
      <div class="text-xs text-muted-foreground">Total</div>
      <div class="mt-1 text-2xl font-bold text-foreground">{items.length}</div>
    </div>
    <div class="bg-card border border-border rounded-lg p-4">
      <div class="text-xs text-muted-foreground">Active</div>
      <div class="mt-1 text-2xl font-bold text-success">{totalActive}</div>
    </div>
    <div class="bg-card border border-border rounded-lg p-4">
      <div class="text-xs text-muted-foreground">Revoked</div>
      <div class="mt-1 text-2xl font-bold text-destructive">{totalRevoked}</div>
    </div>
    <div class="bg-card border border-border rounded-lg p-4">
      <div class="text-xs text-muted-foreground">Frameworks covered</div>
      <div class="mt-1 text-2xl font-bold text-foreground">
        {new Set(facets.filter((f) => f.status === "active").map((f) => f.framework)).size}
      </div>
    </div>
  </div>

  <div class="mb-5 flex flex-wrap items-center gap-3">
    <select
      bind:value={frameworkFilter}
      on:change={applyFilters}
      class="px-3 py-1.5 text-xs border border-input rounded-md bg-card text-foreground/80"
    >
      <option value="all">All frameworks</option>
      {#each FRAMEWORKS as fw}<option value={fw}>{fw}</option>{/each}
    </select>
    <div class="flex gap-1">
      {#each ["all", "active", "expired", "revoked"] as s}
        <button
          type="button"
          on:click={() => { statusFilter = s as typeof statusFilter; applyFilters(); }}
          class="px-3 py-1 text-xs font-medium rounded-full border transition-colors
            {statusFilter === s
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-card text-foreground/80 border-input hover:border-primary'}"
        >
          {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      {/each}
    </div>
  </div>

  {#if showForm && (userRole === "admin" || userRole === "owner")}
    <div class="mb-6 bg-card border border-border rounded-lg p-5">
      <h2 class="text-base font-semibold text-foreground mb-4">New Attestation</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-foreground/80 mb-1" for="att-fw">Framework</label>
          <select id="att-fw" bind:value={formFramework}
            class="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground">
            {#each FRAMEWORKS as fw}<option value={fw}>{fw}</option>{/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground/80 mb-1" for="att-ctrl">Control ID <span class="text-destructive">*</span></label>
          <input id="att-ctrl" type="text" bind:value={formControlId} placeholder="e.g. CC6.1 or A.9.2.4"
            class="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-foreground/80 mb-1" for="att-key">
            Attestation key <span class="text-destructive">*</span>
            <span class="text-muted-foreground/70 font-normal text-xs">(unique per tenant while active)</span>
          </label>
          <input id="att-key" type="text" bind:value={formKey} placeholder="e.g. soc2-access-review-2026-q1"
            class="w-full px-3 py-2 text-sm font-mono border border-input rounded-md bg-white dark:bg-gray-900 text-foreground" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-foreground/80 mb-1" for="att-stmt">
            Statement <span class="text-destructive">*</span>
          </label>
          <textarea id="att-stmt" rows="4" bind:value={formStatement}
            placeholder="e.g. Access reviews for all privileged users were completed on 2026-03-28. No unauthorized privileged access was found. Findings logged in audit-202603.pdf."
            class="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground/80 mb-1" for="att-valid">
            Valid until <span class="text-muted-foreground/70 font-normal text-xs">(optional)</span>
          </label>
          <input id="att-valid" type="date" bind:value={formValidUntil}
            class="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground" />
        </div>
      </div>
      {#if formError}
        <p class="mt-3 text-sm text-destructive">{formError}</p>
      {/if}
      <div class="mt-4 flex gap-2 justify-end">
        <button on:click={() => (showForm = false)}
          class="px-4 py-2 text-sm border border-input rounded-md text-foreground/80 hover:bg-gray-50 dark:hover:bg-gray-700">
          Cancel
        </button>
        <button on:click={createAttestation}
          disabled={submitting || !formControlId.trim() || !formKey.trim() || !formStatement.trim()}
          class="px-4 py-2 text-sm bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-md font-medium">
          {submitting ? "Signing..." : "Sign Attestation"}
        </button>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="space-y-2">
      {#each [1, 2, 3] as _}<div class="h-16 bg-muted rounded animate-pulse"></div>{/each}
    </div>
  {:else if error}
    <div class="bg-destructive-muted border border-destructive/20 rounded-lg p-4">
      <p class="text-destructive">{error}</p>
      <button on:click={load} class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md">Retry</button>
    </div>
  {:else if items.length === 0}
    <div class="bg-card border border-dashed border-input rounded-lg p-12 text-center">
      <p class="text-muted-foreground text-sm">No attestations</p>
      <p class="mt-1 text-muted-foreground/70 text-xs">
        {userRole === "admin" || userRole === "owner"
          ? "Click New Attestation to sign your first."
          : "Admin or owner role required to sign attestations."}
      </p>
    </div>
  {:else}
    <div class="bg-card border border-border rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th class="px-5 py-3 font-medium">Framework</th>
              <th class="px-5 py-3 font-medium">Control</th>
              <th class="px-5 py-3 font-medium">Key</th>
              <th class="px-5 py-3 font-medium">Status</th>
              <th class="px-5 py-3 font-medium">Attested</th>
              <th class="px-5 py-3 font-medium">By</th>
              <th class="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each items as a (a.id)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                on:click={() => (expandedId = expandedId === a.id ? null : a.id)}>
                <td class="px-5 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {frameworkColor(a.framework)}">
                    {a.framework}
                  </span>
                </td>
                <td class="px-5 py-3 font-mono text-xs text-foreground/80">{a.controlId}</td>
                <td class="px-5 py-3 font-mono text-xs text-muted-foreground max-w-[200px] truncate">{a.attestationKey}</td>
                <td class="px-5 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize {statusClass(a.status)}">
                    {a.status}
                  </span>
                </td>
                <td class="px-5 py-3 text-muted-foreground text-xs">{relativeTime(a.attestedAt)}</td>
                <td class="px-5 py-3 text-xs text-foreground/80">{a.attestedByName ?? a.attestedByEmail ?? "—"}</td>
                <td class="px-5 py-3 text-right">
                  {#if a.status === "active" && (userRole === "admin" || userRole === "owner")}
                    <button type="button" on:click|stopPropagation={() => revokeAttestation(a.id)}
                      class="text-xs text-destructive hover:text-destructive dark:hover:text-red-300 font-medium">
                      Revoke
                    </button>
                  {/if}
                </td>
              </tr>
              {#if expandedId === a.id}
                <tr class="bg-gray-50 dark:bg-gray-700/30">
                  <td colspan="7" class="px-5 py-4">
                    <div class="space-y-2 text-xs">
                      <div><span class="font-semibold text-gray-500 uppercase">Statement:</span>
                        <p class="mt-1 text-foreground/80 whitespace-pre-wrap">{a.statement}</p>
                      </div>
                      <dl class="flex flex-wrap gap-x-8 gap-y-2 pt-2 border-t border-border">
                        <div><dt class="font-semibold text-muted-foreground/70 uppercase">ID</dt><dd class="font-mono mt-0.5 text-foreground/80">{a.id}</dd></div>
                        <div><dt class="font-semibold text-muted-foreground/70 uppercase">Attested</dt><dd class="mt-0.5 text-foreground/80">{new Date(a.attestedAt).toLocaleString()}</dd></div>
                        {#if a.validUntil}<div><dt class="font-semibold text-muted-foreground/70 uppercase">Valid until</dt><dd class="mt-0.5 text-foreground/80">{new Date(a.validUntil).toLocaleDateString()}</dd></div>{/if}
                        {#if a.revokedAt}
                          <div><dt class="font-semibold text-destructive uppercase">Revoked</dt><dd class="mt-0.5 text-red-700 dark:text-red-300">{new Date(a.revokedAt).toLocaleString()}</dd></div>
                          {#if a.revocationReason}<div><dt class="font-semibold text-destructive uppercase">Reason</dt><dd class="mt-0.5 text-red-700 dark:text-red-300">{a.revocationReason}</dd></div>{/if}
                        {/if}
                      </dl>
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
