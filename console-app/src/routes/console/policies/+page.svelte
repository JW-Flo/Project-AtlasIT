<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { session } from "$lib/stores/session";
  import { FileText, Download, AlertTriangle } from "lucide-svelte";

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

  onMount(() => {
    loadTemplates();
    if ($session?.email) contactEmail = $session.email;
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Policy Generator</h1>
      <p class="text-sm text-muted-foreground">
        Generate compliance policies from templates across SOC 2, ISO 27001, NIST CSF, HIPAA, and more.
      </p>
    </div>
  </div>

  {#if loading}
    <div class="flex flex-col gap-4">
      <Skeleton class="h-12 w-full rounded-lg" />
      <Skeleton class="h-48 w-full rounded-lg" />
    </div>
  {:else if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>
  {:else}
    <div class="grid gap-6 lg:grid-cols-[380px_1fr]">
      <!-- Form Panel -->
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label htmlFor="template">Policy Template</Label>
            <select
              id="template"
              bind:value={selectedTemplate}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {#each templates as tpl}
                <option value={tpl.key}>{tpl.name}</option>
              {/each}
            </select>
          </div>

          <div class="space-y-2">
            <Label htmlFor="email">Contact Email</Label>
            <Input
              id="email"
              type="email"
              bind:value={contactEmail}
              placeholder="security@company.com"
            />
          </div>

          <div class="space-y-2">
            <Label htmlFor="summary">Additional Context</Label>
            <textarea
              id="summary"
              bind:value={summary}
              rows="4"
              placeholder="Provide any additional context for the policy..."
              class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            ></textarea>
          </div>

          <Button on:click={generatePolicy} disabled={generating || !selectedTemplate} class="w-full">
            {generating ? "Generating..." : "Generate Policy"}
          </Button>

          {#if templates.length > 0}
            <div class="mt-2">
              <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Available Templates
              </h3>
              <div class="flex flex-col gap-1">
                {#each templates as tpl}
                  <button
                    type="button"
                    class="text-xs px-2 py-1.5 rounded text-left cursor-pointer transition-colors {selectedTemplate === tpl.key
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'}"
                    on:click={() => { selectedTemplate = tpl.key; }}
                  >
                    {tpl.name}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Output Panel -->
      <Card class="min-h-[500px]">
        <CardContent class="pt-6 flex flex-col gap-3 h-full">
          {#if generating}
            <div class="flex flex-col gap-3">
              <Skeleton class="h-6 w-3/5 rounded" />
              <Skeleton class="h-72 w-full rounded" />
            </div>
          {:else if generatedPolicy}
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Generated Policy</h2>
              <div class="flex items-center gap-2">
                {#if generatedPolicy.reused}
                  <Badge variant="warning">cached</Badge>
                {/if}
                <span class="text-xs text-muted-foreground">
                  {(generatedPolicy.sizeBytes / 1024).toFixed(1)} KB
                </span>
                <Button variant="success" size="sm" on:click={downloadPolicy}>
                  <Download class="h-4 w-4 mr-1" />
                  Download .md
                </Button>
              </div>
            </div>
            <div class="text-xs text-muted-foreground flex gap-4">
              <span>Hash: {generatedPolicy.hash.substring(0, 12)}...</span>
              <span>Generated: {new Date(generatedPolicy.createdAt).toLocaleString()}</span>
            </div>
            <div class="policy-content bg-muted rounded-lg p-4 mt-1 flex-1 overflow-auto text-sm leading-relaxed whitespace-pre-wrap font-mono">
              {generatedPolicy.content}
            </div>
          {:else}
            <div class="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <FileText class="w-16 h-16 opacity-30" />
              <p class="text-sm">Select a template and click Generate</p>
            </div>
          {/if}
        </CardContent>
      </Card>
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
