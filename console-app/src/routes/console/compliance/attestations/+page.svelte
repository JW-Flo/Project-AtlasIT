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
      case "active":  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "expired": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      case "revoked": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default:        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    }
  }

  function frameworkColor(key: string): string {
    const map: Record<string, string> = {
      SOC2: "bg-blue-100 text-blue-700",
      ISO27001: "bg-purple-100 text-purple-700",
      NIST_CSF: "bg-teal-100 text-teal-700",
      HIPAA: "bg-orange-100 text-orange-700",
      GDPR: "bg-pink-100 text-pink-700",
    };
    return map[key] ?? "bg-gray-100 text-gray-700";
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

<div class="p-8 max-w-7xl mx-auto">
  <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Attestations</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Formal signed statements that a control is working. Each attestation generates
        compliance evidence. Revoking one generates negative evidence — your score reflects reality.
      </p>
    </div>
    {#if userRole === "admin" || userRole === "owner"}
      <button
        on:click={() => { showForm = !showForm; formError = null; }}
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
      >
        {showForm ? "Cancel" : "New Attestation"}
      </button>
    {/if}
  </div>

  <div class="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div class="text-xs text-gray-500 dark:text-gray-400">Total</div>
      <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{items.length}</div>
    </div>
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div class="text-xs text-gray-500 dark:text-gray-400">Active</div>
      <div class="mt-1 text-2xl font-bold text-green-600">{totalActive}</div>
    </div>
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div class="text-xs text-gray-500 dark:text-gray-400">Revoked</div>
      <div class="mt-1 text-2xl font-bold text-red-600">{totalRevoked}</div>
    </div>
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div class="text-xs text-gray-500 dark:text-gray-400">Frameworks covered</div>
      <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
        {new Set(facets.filter((f) => f.status === "active").map((f) => f.framework)).size}
      </div>
    </div>
  </div>

  <div class="mb-5 flex flex-wrap items-center gap-3">
    <select
      bind:value={frameworkFilter}
      on:change={applyFilters}
      class="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
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
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'}"
        >
          {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      {/each}
    </div>
  </div>

  {#if showForm && (userRole === "admin" || userRole === "owner")}
    <div class="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">New Attestation</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="att-fw">Framework</label>
          <select id="att-fw" bind:value={formFramework}
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            {#each FRAMEWORKS as fw}<option value={fw}>{fw}</option>{/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="att-ctrl">Control ID <span class="text-red-500">*</span></label>
          <input id="att-ctrl" type="text" bind:value={formControlId} placeholder="e.g. CC6.1 or A.9.2.4"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="att-key">
            Attestation key <span class="text-red-500">*</span>
            <span class="text-gray-400 font-normal text-xs">(unique per tenant while active)</span>
          </label>
          <input id="att-key" type="text" bind:value={formKey} placeholder="e.g. soc2-access-review-2026-q1"
            class="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="att-stmt">
            Statement <span class="text-red-500">*</span>
          </label>
          <textarea id="att-stmt" rows="4" bind:value={formStatement}
            placeholder="e.g. Access reviews for all privileged users were completed on 2026-03-28. No unauthorized privileged access was found. Findings logged in audit-202603.pdf."
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="att-valid">
            Valid until <span class="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <input id="att-valid" type="date" bind:value={formValidUntil}
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
        </div>
      </div>
      {#if formError}
        <p class="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
      {/if}
      <div class="mt-4 flex gap-2 justify-end">
        <button on:click={() => (showForm = false)}
          class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
          Cancel
        </button>
        <button on:click={createAttestation}
          disabled={submitting || !formControlId.trim() || !formKey.trim() || !formStatement.trim()}
          class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-medium">
          {submitting ? "Signing..." : "Sign Attestation"}
        </button>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="space-y-2">
      {#each [1, 2, 3] as _}<div class="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>{/each}
    </div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-300">{error}</p>
      <button on:click={load} class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button>
    </div>
  {:else if items.length === 0}
    <div class="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
      <p class="text-gray-500 dark:text-gray-400 text-sm">No attestations</p>
      <p class="mt-1 text-gray-400 dark:text-gray-500 text-xs">
        {userRole === "admin" || userRole === "owner"
          ? "Click New Attestation to sign your first."
          : "Admin or owner role required to sign attestations."}
      </p>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
                <td class="px-5 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{a.controlId}</td>
                <td class="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{a.attestationKey}</td>
                <td class="px-5 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize {statusClass(a.status)}">
                    {a.status}
                  </span>
                </td>
                <td class="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{relativeTime(a.attestedAt)}</td>
                <td class="px-5 py-3 text-xs text-gray-700 dark:text-gray-300">{a.attestedByName ?? a.attestedByEmail ?? "—"}</td>
                <td class="px-5 py-3 text-right">
                  {#if a.status === "active" && (userRole === "admin" || userRole === "owner")}
                    <button type="button" on:click|stopPropagation={() => revokeAttestation(a.id)}
                      class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium">
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
                        <p class="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{a.statement}</p>
                      </div>
                      <dl class="flex flex-wrap gap-x-8 gap-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div><dt class="font-semibold text-gray-400 uppercase">ID</dt><dd class="font-mono mt-0.5 text-gray-700 dark:text-gray-300">{a.id}</dd></div>
                        <div><dt class="font-semibold text-gray-400 uppercase">Attested</dt><dd class="mt-0.5 text-gray-700 dark:text-gray-300">{new Date(a.attestedAt).toLocaleString()}</dd></div>
                        {#if a.validUntil}<div><dt class="font-semibold text-gray-400 uppercase">Valid until</dt><dd class="mt-0.5 text-gray-700 dark:text-gray-300">{new Date(a.validUntil).toLocaleDateString()}</dd></div>{/if}
                        {#if a.revokedAt}
                          <div><dt class="font-semibold text-red-500 uppercase">Revoked</dt><dd class="mt-0.5 text-red-700 dark:text-red-300">{new Date(a.revokedAt).toLocaleString()}</dd></div>
                          {#if a.revocationReason}<div><dt class="font-semibold text-red-500 uppercase">Reason</dt><dd class="mt-0.5 text-red-700 dark:text-red-300">{a.revocationReason}</dd></div>{/if}
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
