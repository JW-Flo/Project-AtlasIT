<script lang="ts">
  import { onMount } from "svelte";

  let tenantId = "";
  let tenantSlug = "";
  let trustPublic = false;
  let loading = true;
  let saving = false;
  let error: string | null = null;
  let banner: { type: "info" | "error"; msg: string } | null = null;

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
      const res = await fetch("/api/v1/tenant/settings");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      tenantSlug = json.data?.tenant?.slug ?? tenantId;
      const cfg = json.data?.tenant?.config ?? {};
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

  onMount(load);
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
            {@const pdfBase = `${apiBase}/api/compliance/api/v1/trust/${tenantSlug}/export.pdf`}
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
  {/if}
</div>
