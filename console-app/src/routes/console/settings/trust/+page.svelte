<script lang="ts">
  import { onMount } from "svelte";

  let tenantId = "";
  let tenantSlug = "";
  let trustPublic = false;
  let loading = true;
  let saving = false;
  let error: string | null = null;
  let banner: { type: "info" | "error"; msg: string } | null = null;

  // Access request management
  interface AccessRequest {
    id: string;
    requester_name: string;
    requester_email: string;
    requester_company: string;
    reason: string | null;
    status: "pending" | "approved" | "denied";
    reviewed_by: string | null;
    reviewed_at: string | null;
    review_note: string | null;
    expires_at: string | null;
    created_at: string;
  }
  let requests: AccessRequest[] = [];
  let requestsLoading = false;
  let requestsFilter: "pending" | "approved" | "denied" | "all" = "pending";
  let actioningId: string | null = null;
  let denyNote = "";

  async function loadRequests() {
    requestsLoading = true;
    try {
      const res = await fetch(`/api/compliance/api/v1/trust/access-requests?status=${requestsFilter}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      requests = json.requests ?? [];
    } catch (e) {
      banner = { type: "error", msg: `Failed to load access requests: ${(e as Error).message}` };
    } finally {
      requestsLoading = false;
    }
  }

  async function approveRequest(id: string) {
    actioningId = id;
    try {
      const res = await fetch(`/api/compliance/api/v1/trust/access-requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttlDays: 7 }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      banner = { type: "info", msg: "Request approved — secure link generated and queued for delivery." };
      await loadRequests();
    } catch (e) {
      banner = { type: "error", msg: `Approve failed: ${(e as Error).message}` };
    } finally {
      actioningId = null;
    }
  }

  async function denyRequest(id: string) {
    actioningId = id;
    try {
      const res = await fetch(`/api/compliance/api/v1/trust/access-requests/${id}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: denyNote }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      banner = { type: "info", msg: "Request denied." };
      denyNote = "";
      await loadRequests();
    } catch (e) {
      banner = { type: "error", msg: `Deny failed: ${(e as Error).message}` };
    } finally {
      actioningId = null;
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  $: publicUrl = tenantSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://www.atlasit.pro'}/trust/${tenantSlug}`
    : "";

  async function load() {
    loading = true;
    error = null;
    try {
      const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem("atlasit_user") : null;
      if (!userRaw) throw new Error("Not signed in");
      const user = JSON.parse(userRaw);
      tenantId = user.tenantId;
      const res = await fetch(`/api/v1/tenants/${tenantId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const t = json.data ?? {};
      tenantSlug = t.slug ?? tenantId;
      const cfg = t.config ?? {};
      trustPublic = Boolean(cfg.trust_center_public);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function saveToggle() {
    saving = true;
    banner = null;
    try {
      const res = await fetch(`/api/v1/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: { trust_center_public: trustPublic } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      banner = {
        type: "info",
        msg: trustPublic ? `Trust center published at ${publicUrl}` : "Trust center unpublished.",
      };
    } catch (e) {
      trustPublic = !trustPublic;
      banner = { type: "error", msg: `Save failed: ${(e as Error).message}` };
    } finally {
      saving = false;
    }
  }

  async function copyUrl() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      banner = { type: "info", msg: "URL copied to clipboard" };
    } catch {
      banner = { type: "error", msg: "Copy failed — select and copy manually" };
    }
  }

  onMount(async () => {
    await load();
    await loadRequests();
  });

  $: if (requestsFilter) loadRequests();
</script>

<div class="p-8 max-w-4xl mx-auto">
  <div class="mb-6">
    <a href="/console/settings" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Settings</a>
    <h1 class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Trust Center</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      Publish a live public page showing your continuous compliance posture. Prospects and auditors can
      see your real score, framework coverage, and operational cadence — without logging in.
    </p>
  </div>

  {#if banner}
    <div class="mb-5 rounded-lg p-4 text-sm border
      {banner.type === 'error'
        ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
        : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'}">
      {banner.msg}
    </div>
  {/if}

  {#if loading}
    <div class="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-300">{error}</p>
      <button on:click={load} class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div class="px-6 py-5 flex items-center justify-between gap-4">
        <div class="flex-1">
          <div class="font-medium text-gray-900 dark:text-white">Publish trust center</div>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            When enabled, anyone with your public URL can see aggregate scores, framework coverage, and
            integration count. No login. No individual evidence records are exposed.
          </p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            bind:checked={trustPublic}
            on:change={saveToggle}
            disabled={saving}
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {#if trustPublic}
        <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-5">
          <div class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Your public URL</div>
          <div class="flex items-center gap-2">
            <input type="text" readonly value={publicUrl}
              class="flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white" />
            <button type="button" on:click={copyUrl}
              class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Copy</button>
            <a href={publicUrl} target="_blank" rel="noopener"
              class="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">View →</a>
          </div>
        </div>
      {/if}
    </div>

    {#if trustPublic && publicUrl}
      {@const apiBase = typeof window !== 'undefined' ? window.location.origin : 'https://www.atlasit.pro'}
      {@const badgeUrl = `${apiBase}/api/compliance/api/v1/trust/${tenantSlug}/badge.svg`}
      {@const iframeUrl = `${apiBase}/trust/${tenantSlug}/embed`}
      {@const pdfBase = `${apiBase}/api/compliance/api/v1/trust/${tenantSlug}/export.pdf`}
      <div class="mt-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
        <h3 class="font-medium text-gray-900 dark:text-white text-sm mb-1">Embed on your site</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Add your live compliance score to your marketing site, GitHub README, or any page.
          Both options update automatically as your score changes.
        </p>

        <div class="space-y-4">
          <!-- SVG badge -->
          <div>
            <div class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">SVG badge (README / HTML)</div>
            <div class="flex items-center gap-3 mb-2">
              <img src={badgeUrl} alt="Compliance badge" class="h-5" />
              <span class="text-xs text-gray-500 dark:text-gray-400">← live preview</span>
            </div>
            <label class="block text-[11px] text-gray-500 dark:text-gray-400 mt-1" for="badge-md">Markdown</label>
            <textarea id="badge-md" readonly rows="1"
              class="w-full px-3 py-2 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
              on:click={(e) => (e.currentTarget as HTMLTextAreaElement).select()}
            >[![Compliance]({badgeUrl})]({publicUrl})</textarea>
            <label class="block text-[11px] text-gray-500 dark:text-gray-400 mt-2" for="badge-html">HTML</label>
            <textarea id="badge-html" readonly rows="1"
              class="w-full px-3 py-2 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
              on:click={(e) => (e.currentTarget as HTMLTextAreaElement).select()}
            >&lt;a href="{publicUrl}"&gt;&lt;img src="{badgeUrl}" alt="Compliance"&gt;&lt;/a&gt;</textarea>
            <p class="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              Per-framework: append <code class="bg-gray-100 dark:bg-gray-900 px-1 rounded text-[10px]">?framework=SOC2</code>
              (or ISO27001, NIST_CSF, HIPAA, GDPR). Style: <code class="bg-gray-100 dark:bg-gray-900 px-1 rounded text-[10px]">?style=for-the-badge</code>.
            </p>
          </div>

          <!-- Iframe embed -->
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Iframe widget</div>
            <div class="mb-2 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden" style="height: 140px;">
              <iframe src={iframeUrl} class="w-full h-full" title="Live trust widget preview" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>
            </div>
            <label class="block text-[11px] text-gray-500 dark:text-gray-400 mt-1" for="iframe-html">HTML</label>
            <textarea id="iframe-html" readonly rows="2"
              class="w-full px-3 py-2 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
              on:click={(e) => (e.currentTarget as HTMLTextAreaElement).select()}
            >&lt;iframe src="{iframeUrl}" width="100%" height="140" frameborder="0" title="Trust center"&gt;&lt;/iframe&gt;</textarea>
            <p class="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              Theme: append <code class="bg-gray-100 dark:bg-gray-900 px-1 rounded text-[10px]">?theme=dark</code>.
              Compact: <code class="bg-gray-100 dark:bg-gray-900 px-1 rounded text-[10px]">?size=compact</code>.
            </p>
          </div>

          <!-- Auditor PDF export -->
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Auditor PDF export</div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Generate a branded, signed compliance report suitable for auditor hand-off.
              Every page carries a SHA-256 content hash to detect tampering.
            </p>
            <div class="flex flex-wrap gap-2">
              <a href="{pdfBase}" target="_blank" rel="noopener"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                All frameworks
              </a>
              <a href="{pdfBase}?details=true" target="_blank" rel="noopener"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors">
                All + control detail
              </a>
              {#each ['SOC2', 'ISO27001', 'NIST_CSF', 'HIPAA', 'GDPR'] as fw}
                <a href="{pdfBase}?framework={fw}&details=true" target="_blank" rel="noopener"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors">
                  {fw.replace('_', ' ')}
                </a>
              {/each}
            </div>
            <p class="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              Direct link: <code class="bg-gray-100 dark:bg-gray-900 px-1 rounded text-[10px] break-all">{pdfBase}</code>
            </p>
          </div>
        </div>
      </div>
    {/if}

    <div class="mt-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <h3 class="font-medium text-gray-900 dark:text-white text-sm">What's shown on the public page?</h3>
      <ul class="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
        <li class="flex gap-2"><span class="text-green-600">✓</span>Overall compliance score + pass/fail/unknown counts</li>
        <li class="flex gap-2"><span class="text-green-600">✓</span>Per-framework scores (SOC 2, ISO 27001, NIST, HIPAA, GDPR)</li>
        <li class="flex gap-2"><span class="text-green-600">✓</span>Connected integrations count (not names — privacy-preserving)</li>
        <li class="flex gap-2"><span class="text-green-600">✓</span>Recent-evidence volume, update cadence</li>
        <li class="flex gap-2"><span class="text-red-600">✗</span>Individual evidence records, user info, policy content, audit log</li>
        <li class="flex gap-2"><span class="text-red-600">✗</span>Integration credentials, tokens, internal IDs</li>
      </ul>
    </div>

    <!-- Evidence Access Requests -->
    <div class="mt-8">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Evidence access requests</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Visitors who requested detailed evidence via your public trust page.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <select
            bind:value={requestsFilter}
            class="h-8 px-2 pr-7 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="all">All</option>
          </select>
          <button
            on:click={loadRequests}
            class="h-8 px-3 text-xs border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >Refresh</button>
        </div>
      </div>

      {#if requestsLoading}
        <div class="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      {:else if requests.length === 0}
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-10 text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            No {requestsFilter === "all" ? "" : requestsFilter + " "}access requests.
          </p>
        </div>
      {:else}
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          {#each requests as req (req.id)}
            <div class="px-5 py-4">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-sm text-gray-900 dark:text-white">{req.requester_name}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{req.requester_email}</span>
                    <span class="text-xs px-1.5 py-0.5 rounded-full font-medium
                      {req.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : req.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}">
                      {req.status}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {req.requester_company} · Requested {formatDate(req.created_at)}
                    {#if req.reason}<span class="text-gray-400 dark:text-gray-500"> · "{req.reason}"</span>{/if}
                  </p>
                  {#if req.status === "approved" && req.expires_at}
                    <p class="text-xs text-green-700 dark:text-green-400 mt-1">
                      Access expires {formatDate(req.expires_at)}
                    </p>
                  {/if}
                  {#if req.review_note}
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Note: {req.review_note}</p>
                  {/if}
                </div>

                {#if req.status === "pending"}
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      on:click={() => approveRequest(req.id)}
                      disabled={actioningId === req.id}
                      class="h-7 px-3 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                    >
                      {actioningId === req.id ? "…" : "Approve"}
                    </button>
                    <button
                      on:click={() => denyRequest(req.id)}
                      disabled={actioningId === req.id}
                      class="h-7 px-3 text-xs font-medium rounded-md border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      {actioningId === req.id ? "…" : "Deny"}
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
