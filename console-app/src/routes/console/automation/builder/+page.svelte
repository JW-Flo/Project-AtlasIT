<script lang="ts">
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-svelte";

  interface GeneratedRule {
    name: string;
    description: string;
    triggerType: string;
    triggerConfig: Record<string, unknown>;
    conditions: Array<{ field?: string; operator?: string; value?: unknown; [key: string]: unknown }>;
    actions: Array<{ type?: string; order?: number; [key: string]: unknown }>;
  }

  interface ComplianceMapping {
    framework: string;
    controlId: string;
    controlName: string;
    evidenceType: string;
    fromAction: string;
  }

  interface NLResult {
    rule: GeneratedRule;
    compliancePreview: ComplianceMapping[];
    confidence: number;
    reasoning: string;
    prompt: string;
  }

  let prompt = "";
  let loading = false;
  let error: string | null = null;
  let result: NLResult | null = null;
  let showReasoning = false;
  let savingRule = false;

  function confidenceColor(confidence: number): string {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.5) return "bg-yellow-500";
    return "bg-destructive";
  }

  function confidenceLabel(confidence: number): string {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.5) return "Medium";
    return "Low";
  }

  function confidencePct(confidence: number): number {
    return Math.max(0, Math.min(100, Math.round(confidence * 100)));
  }

  async function generateRule() {
    if (!prompt.trim()) return;

    loading = true;
    error = null;
    result = null;

    try {
      const res = await fetch("/api/automation/nl", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) throw new Error(`Failed to generate rule (${res.status})`);

      const data = await res.json();
      if (data?.status !== "success" || !data?.data) {
        throw new Error("Unexpected response from NL builder");
      }

      result = data.data as NLResult;
      showReasoning = true;
    } catch (e: any) {
      error = e?.message || "Failed to generate rule";
      result = null;
    } finally {
      loading = false;
    }
  }

  async function saveAsRule() {
    if (!result?.rule) return;

    savingRule = true;
    try {
      const res = await fetch("/api/automation/rules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result.rule),
      });
      if (!res.ok) throw new Error(`Failed to save rule (${res.status})`);
      pushToast({ message: "Rule saved successfully", variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to save rule", variant: "error" });
    } finally {
      savingRule = false;
    }
  }

  function refinePrompt() {
    if (result?.prompt) prompt = result.prompt;
    result = null;
    error = null;
  }

  function stringify(value: unknown): string {
    if (value == null) return "--";
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">NL Automation Builder</h1>
    <p class="text-sm text-muted-foreground">Describe your lifecycle policy in plain English and generate an automation rule with compliance mapping.</p>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Policy Prompt</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <textarea
        bind:value={prompt}
        rows="5"
        placeholder="Describe your policy in plain English... e.g. When someone leaves engineering, revoke GitHub and Jira access immediately."
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      ></textarea>

      <div class="flex items-center gap-2">
        <Button on:click={generateRule} disabled={loading || !prompt.trim()}>
          <Sparkles class="h-4 w-4 mr-1.5" />
          Generate Rule
        </Button>
      </div>

      {#if loading}
        <div class="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm flex items-center gap-2">
          <Loader2 class="h-4 w-4 animate-spin" />
          Translating policy...
        </div>
      {/if}

      {#if error}
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      {/if}
    </CardContent>
  </Card>

  {#if result}
    <div class="grid gap-4 lg:grid-cols-2">
      <!-- Rule preview -->
      <Card>
        <CardHeader>
          <CardTitle>Generated Rule Preview</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <div class="text-lg font-semibold">{result.rule.name}</div>
            <p class="text-sm text-muted-foreground">{result.rule.description}</p>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Trigger</span>
            <Badge variant="outline">{result.rule.triggerType}</Badge>
          </div>

          <div>
            <div class="text-sm font-medium mb-1">Conditions</div>
            {#if result.rule.conditions?.length}
              <ul class="space-y-1 text-sm">
                {#each result.rule.conditions as condition}
                  <li class="rounded border px-2 py-1 bg-muted/40">{stringify(condition)}</li>
                {/each}
              </ul>
            {:else}
              <p class="text-sm text-muted-foreground">No explicit conditions.</p>
            {/if}
          </div>

          <div>
            <div class="text-sm font-medium mb-1">Actions</div>
            {#if result.rule.actions?.length}
              <ol class="space-y-1 text-sm list-decimal pl-5">
                {#each result.rule.actions as action}
                  <li class="rounded border px-2 py-1 bg-muted/40">{stringify(action)}</li>
                {/each}
              </ol>
            {:else}
              <p class="text-sm text-muted-foreground">No actions generated.</p>
            {/if}
          </div>
        </CardContent>
      </Card>

      <!-- Compliance preview -->
      <Card>
        <CardHeader>
          <CardTitle>Compliance Coverage Preview</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <div class="flex items-center justify-between text-sm mb-1">
              <span>Confidence: {confidenceLabel(result.confidence)}</span>
              <span>{confidencePct(result.confidence)}%</span>
            </div>
            <div class="h-2 rounded-full bg-muted overflow-hidden">
              <div class={`h-full ${confidenceColor(result.confidence)}`} style={`width: ${confidencePct(result.confidence)}%`}></div>
            </div>
          </div>

          <div class="space-y-2">
            {#if result.compliancePreview?.length}
              {#each result.compliancePreview as map}
                <div class="rounded border px-3 py-2">
                  <div class="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{map.framework}</Badge>
                    <Badge variant="secondary">{map.controlId}</Badge>
                  </div>
                  <div class="text-sm font-medium">{map.controlName}</div>
                  <div class="text-xs text-muted-foreground">Evidence: {map.evidenceType} • from action: {map.fromAction}</div>
                </div>
              {/each}
            {:else}
              <p class="text-sm text-muted-foreground">No compliance mappings generated.</p>
            {/if}
          </div>

          <div class="rounded border">
            <button class="w-full px-3 py-2 text-left text-sm font-medium flex items-center justify-between" on:click={() => (showReasoning = !showReasoning)}>
              AI Reasoning
              {#if showReasoning}
                <ChevronUp class="h-4 w-4" />
              {:else}
                <ChevronDown class="h-4 w-4" />
              {/if}
            </button>
            {#if showReasoning}
              <div class="px-3 pb-3 text-sm text-muted-foreground">{result.reasoning}</div>
            {/if}
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="flex items-center gap-2">
      <Button on:click={saveAsRule} disabled={savingRule}>
        {savingRule ? "Saving..." : "Save as Rule"}
      </Button>
      <Button variant="outline" on:click={refinePrompt}>Refine</Button>
    </div>
  {/if}
</div>
