<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/primitives/Button.svelte";
  import Skeleton from "$lib/components/loading/Skeleton.svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";

  interface PolicyTemplate {
    key: string;
    name: string;
    format: string;
  }

  interface GeneratedPolicy {
    hash: string;
    templateKey: string;
    content: string;
    createdAt: string;
    sizeBytes: number;
    reused: boolean;
  }

  let templates: PolicyTemplate[] = [];
  let loading = true;
  let generating = false;
  let error: string | null = null;
  let selectedTemplate: string = "";
  let contactEmail = "";
  let summary = "";
  let generatedPolicy: GeneratedPolicy | null = null;

  async function loadTemplates() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/policies/templates");
      if (!res.ok) throw new Error(`Failed to load templates (${res.status})`);
      const data = await res.json();
      templates = data.templates || [];
      if (templates.length > 0 && !selectedTemplate) {
        selectedTemplate = templates[0].key;
      }
    } catch (e: any) {
      error = e?.message || "Failed to load templates";
    } finally {
      loading = false;
    }
  }

  async function generatePolicy() {
    if (!selectedTemplate) return;
    generating = true;
    generatedPolicy = null;
    try {
      const res = await fetch("/api/policies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: selectedTemplate,
          input: {
            contactEmail: contactEmail || "security@company.com",
            summary: summary || "No additional context provided.",
          },
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Generation failed (${res.status})`);
      }
      generatedPolicy = await res.json();
      pushToast({
        message: generatedPolicy?.reused
          ? "Policy retrieved from cache"
          : "Policy generated successfully",
        variant: "success",
      });
    } catch (e: any) {
      pushToast({
        message: e?.message || "Failed to generate policy",
        variant: "error",
      });
    } finally {
      generating = false;
    }
  }

  function downloadPolicy() {
    if (!generatedPolicy) return;
    const blob = new Blob([generatedPolicy.content], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${generatedPolicy.templateKey}-policy.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onMount(loadTemplates);
</script>

<div class="px-5 py-5 max-w-[1200px] mx-auto">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-3xl font-semibold mb-1">Policy Generator</h1>
      <p class="text-sm text-white/60">
        Generate compliance policies from templates across SOC 2, ISO 27001,
        NIST CSF, HIPAA, and more.
      </p>
    </div>
    <a
      href="/console"
      class="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded text-white"
    >
      Back to Dashboard
    </a>
  </div>

  {#if loading}
    <div class="flex flex-col gap-4">
      <Skeleton width="100%" height="48px" />
      <Skeleton width="100%" height="200px" />
    </div>
  {:else if error}
    <div class="text-sm text-red-400 bg-red-900/20 rounded-lg p-4">{error}</div>
  {:else}
    <div class="grid gap-6 lg:grid-cols-[380px_1fr]">
      <!-- Form Panel -->
      <div class="bg-[#1a2332] rounded-lg p-5 flex flex-col gap-4">
        <h2 class="text-lg font-semibold">Configuration</h2>

        <div class="flex flex-col gap-1.5">
          <label for="template" class="text-sm text-white/70">Policy Template</label>
          <select
            id="template"
            bind:value={selectedTemplate}
            class="bg-[#0f1923] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {#each templates as tpl}
              <option value={tpl.key}>{tpl.name}</option>
            {/each}
          </select>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-sm text-white/70">Contact Email</label>
          <input
            id="email"
            type="email"
            bind:value={contactEmail}
            placeholder="security@company.com"
            class="bg-[#0f1923] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="summary" class="text-sm text-white/70">Additional Context</label>
          <textarea
            id="summary"
            bind:value={summary}
            rows="4"
            placeholder="Provide any additional context for the policy..."
            class="bg-[#0f1923] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500 resize-y"
          ></textarea>
        </div>

        <Button
          variant="primary"
          on:click={generatePolicy}
          disabled={generating || !selectedTemplate}
        >
          {generating ? "Generating..." : "Generate Policy"}
        </Button>

        {#if templates.length > 0}
          <div class="mt-2">
            <h3 class="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
              Available Templates
            </h3>
            <div class="flex flex-col gap-1">
              {#each templates as tpl}
                <div
                  class="text-xs px-2 py-1.5 rounded {selectedTemplate === tpl.key
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-white/50'}"
                >
                  {tpl.name}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Output Panel -->
      <div class="bg-[#1a2332] rounded-lg p-5 flex flex-col gap-3 min-h-[500px]">
        {#if generating}
          <div class="flex flex-col gap-3">
            <Skeleton width="60%" height="24px" />
            <Skeleton width="100%" height="300px" />
          </div>
        {:else if generatedPolicy}
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Generated Policy</h2>
            <div class="flex items-center gap-2">
              {#if generatedPolicy.reused}
                <span
                  class="text-[10px] uppercase tracking-wider bg-yellow-600/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30"
                >
                  cached
                </span>
              {/if}
              <span class="text-xs text-white/40">
                {(generatedPolicy.sizeBytes / 1024).toFixed(1)} KB
              </span>
              <button
                on:click={downloadPolicy}
                class="text-xs bg-green-600 hover:bg-green-500 px-2.5 py-1 rounded text-white"
              >
                Download .md
              </button>
            </div>
          </div>
          <div class="text-xs text-white/40 flex gap-4">
            <span>Hash: {generatedPolicy.hash.substring(0, 12)}...</span>
            <span>Generated: {new Date(generatedPolicy.createdAt).toLocaleString()}</span>
          </div>
          <div
            class="policy-content bg-[#0f1923] rounded p-4 mt-1 flex-1 overflow-auto text-sm leading-relaxed text-white/85 whitespace-pre-wrap font-mono"
          >
            {generatedPolicy.content}
          </div>
        {:else}
          <div
            class="flex flex-col items-center justify-center h-full text-white/30 gap-3"
          >
            <svg
              class="w-16 h-16 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p class="text-sm">Select a template and click Generate</p>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .policy-content :global(h1) {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  .policy-content :global(h2) {
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.3rem;
  }
</style>
