<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { ShieldCheck, Plus, FileCheck, AlertTriangle, Clock, X, ChevronDown, Lightbulb, FileText, Info } from "lucide-svelte";

  interface Attestation {
    id: string;
    framework: string;
    controlId: string;
    attestationKey: string;
    status: "active" | "expired" | "revoked";
    attestedBy: string;
    evidenceSummary: string;
    metadata: Record<string, any>;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
  }

  interface EvidenceGuidance {
    summary: string;
    recommendedDocuments: string[];
    acceptableFormats: string[];
    tips: string;
  }

  interface ControlDef {
    framework: string;
    key: string;
    description: string;
    cdtFields: string[];
    evidenceGuidance?: EvidenceGuidance;
  }

  let loading = true;
  let attestations: Attestation[] = [];
  let availableControls: Record<string, ControlDef> = {};
  let frameworkFilter = "all";
  let showForm = false;
  let saving = false;

  // Form state
  let selectedControlId = "";
  let evidenceSummary = "";
  let expiresAt = "";
  let numericValue: number | null = null;

  $: filteredAttestations =
    frameworkFilter === "all"
      ? attestations
      : attestations.filter((a) => a.framework === frameworkFilter);

  $: frameworks = [...new Set(Object.values(availableControls).map((c) => c.framework))];

  $: unattestedControls = Object.entries(availableControls).filter(
    ([id]) => !attestations.some((a) => a.controlId === id && a.status === "active"),
  );

  $: activeCount = attestations.filter((a) => a.status === "active").length;
  $: totalControls = Object.keys(availableControls).length;

  $: expiringSoon = attestations.filter((a) => {
    if (!a.expiresAt || a.status !== "active") return false;
    const diff = new Date(a.expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  });

  $: selectedControl = selectedControlId ? availableControls[selectedControlId] : null;
  $: needsNumericValue =
    selectedControl?.key === "unmitigated_high_risks" ||
    selectedControl?.cdtFields?.some((f: string) => f.includes("days_since"));

  async function loadAttestations() {
    try {
      const res = await fetch("/api/tenant-compliance/attestations?status=all");
      if (!res.ok) throw new Error("Failed to load attestations");
      const data = await res.json();
      attestations = data.attestations || [];
      availableControls = data.availableControls || {};
    } catch (err: any) {
      pushToast({ variant: "error", message: err.message });
    } finally {
      loading = false;
    }
  }

  async function submitAttestation() {
    if (!selectedControlId || !evidenceSummary.trim()) return;
    saving = true;
    try {
      const metadata: Record<string, any> = {};
      if (numericValue !== null) {
        metadata.value = numericValue;
      }

      const res = await fetch("/api/tenant-compliance/attestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          controlId: selectedControlId,
          evidenceSummary: evidenceSummary.trim(),
          expiresAt: expiresAt || undefined,
          metadata,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      pushToast({ variant: "success", message: "Attestation saved and evidence recorded" });
      resetForm();
      await loadAttestations();
    } catch (err: any) {
      pushToast({ variant: "error", message: err.message });
    } finally {
      saving = false;
    }
  }

  async function revokeAttestation(id: string) {
    try {
      const res = await fetch(`/api/tenant-compliance/attestations?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      pushToast({ variant: "success", message: "Attestation revoked" });
      await loadAttestations();
    } catch (err: any) {
      pushToast({ variant: "error", message: err.message });
    }
  }

  function resetForm() {
    showForm = false;
    selectedControlId = "";
    evidenceSummary = "";
    expiresAt = "";
    numericValue = null;
  }

  function statusColor(status: string): string {
    if (status === "active") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (status === "expired") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  }

  function relativeDate(iso: string): string {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    return d.toLocaleDateString();
  }

  onMount(loadAttestations);
</script>

<svelte:head>
  <title>Attestations — Compliance — AtlasIT</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">Control Attestations</h1>
      <p class="text-sm text-muted-foreground mt-1">
        Provide manual evidence for governance controls that can't be auto-detected
      </p>
    </div>
    <Button on:click={() => (showForm = true)} disabled={showForm}>
      <Plus class="h-4 w-4 mr-2" /> New Attestation
    </Button>
  </div>

  <!-- Summary cards -->
  {#if !loading}
    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent class="pt-5">
          <div class="flex items-center gap-3">
            <ShieldCheck class="h-5 w-5 text-emerald-500" />
            <div>
              <div class="text-2xl font-bold">{activeCount}/{totalControls}</div>
              <div class="text-xs text-muted-foreground">Controls Attested</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-5">
          <div class="flex items-center gap-3">
            <FileCheck class="h-5 w-5 text-blue-500" />
            <div>
              <div class="text-2xl font-bold">{unattestedControls.length}</div>
              <div class="text-xs text-muted-foreground">Pending Attestation</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-5">
          <div class="flex items-center gap-3">
            <Clock class="h-5 w-5 text-amber-500" />
            <div>
              <div class="text-2xl font-bold">{expiringSoon.length}</div>
              <div class="text-xs text-muted-foreground">Expiring in 30 days</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  {/if}

  <!-- New attestation form -->
  {#if showForm}
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="text-base">New Attestation</CardTitle>
          <button on:click={resetForm} class="text-muted-foreground hover:text-foreground">
            <X class="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <form on:submit|preventDefault={submitAttestation} class="space-y-4">
          <div>
            <label class="text-sm font-medium block mb-1.5">Control</label>
            <div class="relative">
              <select
                bind:value={selectedControlId}
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none"
              >
                <option value="">Select a control to attest...</option>
                {#each Object.entries(availableControls) as [id, def]}
                  <option value={id}>{id} — {def.description}</option>
                {/each}
              </select>
              <ChevronDown class="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {#if selectedControl}
              <p class="text-xs text-muted-foreground mt-1">
                Framework: {selectedControl.framework} | Fields: {selectedControl.cdtFields.join(", ")}
              </p>
            {/if}
          </div>

          <!-- Evidence guidance panel -->
          {#if selectedControl?.evidenceGuidance}
            {@const guidance = selectedControl.evidenceGuidance}
            <div class="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div class="flex items-start gap-2">
                <Lightbulb class="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 class="text-sm font-semibold text-primary">Evidence Recommendations</h4>
                  <p class="text-xs text-muted-foreground mt-0.5">{guidance.summary}</p>
                </div>
              </div>

              <div>
                <div class="flex items-center gap-1.5 mb-1.5">
                  <FileText class="h-3.5 w-3.5 text-muted-foreground" />
                  <span class="text-xs font-semibold">Recommended documents</span>
                </div>
                <ul class="space-y-1 ml-5">
                  {#each guidance.recommendedDocuments as doc}
                    <li class="text-xs text-muted-foreground list-disc">{doc}</li>
                  {/each}
                </ul>
              </div>

              <div class="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                <div>
                  <span class="font-semibold">Accepted formats:</span>
                  <span class="text-muted-foreground">{guidance.acceptableFormats.join(", ")}</span>
                </div>
              </div>

              <div class="flex items-start gap-1.5 bg-background/60 rounded-md px-3 py-2">
                <Info class="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p class="text-xs text-muted-foreground">{guidance.tips}</p>
              </div>
            </div>
          {/if}

          <div>
            <label class="text-sm font-medium block mb-1.5">Evidence Summary</label>
            <textarea
              bind:value={evidenceSummary}
              rows="3"
              placeholder="Describe the evidence supporting this attestation (e.g., board meeting minutes from March 2026 confirm oversight of information security program...)"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          {#if needsNumericValue}
            <div>
              <label class="text-sm font-medium block mb-1.5">
                {#if selectedControl?.key === "unmitigated_high_risks"}
                  Number of Unmitigated High Risks
                {:else}
                  Days Since Last Test
                {/if}
              </label>
              <input
                type="number"
                bind:value={numericValue}
                min="0"
                class="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          {/if}

          <div>
            <label class="text-sm font-medium block mb-1.5">Expires (optional)</label>
            <input
              type="date"
              bind:value={expiresAt}
              class="w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <p class="text-xs text-muted-foreground mt-1">
              Leave blank for no expiry. Expired attestations are flagged for renewal.
            </p>
          </div>

          <div class="flex gap-2 pt-2">
            <Button type="submit" disabled={saving || !selectedControlId || evidenceSummary.length < 10}>
              {saving ? "Saving..." : "Save Attestation"}
            </Button>
            <Button variant="outline" on:click={resetForm} type="button">Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  {/if}

  <!-- Framework filter -->
  {#if !loading && attestations.length > 0}
    <div class="flex gap-2">
      <button
        class="text-xs px-3 py-1 rounded-full border transition-colors {frameworkFilter === 'all'
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border hover:bg-muted'}"
        on:click={() => (frameworkFilter = "all")}
      >
        All
      </button>
      {#each frameworks as fw}
        <button
          class="text-xs px-3 py-1 rounded-full border transition-colors {frameworkFilter === fw
            ? 'bg-primary text-primary-foreground border-primary'
            : 'border-border hover:bg-muted'}"
          on:click={() => (frameworkFilter = fw)}
        >
          {fw}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Attestations list -->
  {#if loading}
    <div class="space-y-3">
      {#each Array(5) as _}
        <Skeleton class="h-16 w-full" />
      {/each}
    </div>
  {:else if filteredAttestations.length === 0}
    <Card>
      <CardContent class="py-12 text-center">
        <ShieldCheck class="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p class="text-sm text-muted-foreground">
          {attestations.length === 0
            ? "No attestations yet. Create one to provide evidence for governance controls."
            : "No attestations match the current filter."}
        </p>
        {#if attestations.length === 0}
          <Button class="mt-4" variant="outline" on:click={() => (showForm = true)}>
            <Plus class="h-4 w-4 mr-2" /> Create First Attestation
          </Button>
        {/if}
      </CardContent>
    </Card>
  {:else}
    <div class="space-y-2">
      {#each filteredAttestations as att}
        <Card>
          <CardContent class="py-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <Badge variant="outline" class="text-[10px]">{att.framework}</Badge>
                  <span class="font-mono text-sm font-medium">{att.controlId}</span>
                  <Badge class="text-[10px] {statusColor(att.status)}">{att.status}</Badge>
                  {#if att.expiresAt}
                    {@const daysLeft = Math.ceil((new Date(att.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                    {#if daysLeft > 0 && daysLeft <= 30}
                      <Badge class="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                        <AlertTriangle class="h-3 w-3 mr-1" /> Expires in {daysLeft}d
                      </Badge>
                    {/if}
                  {/if}
                </div>
                <p class="text-sm text-muted-foreground line-clamp-2">{att.evidenceSummary}</p>
                <div class="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>By {att.attestedBy}</span>
                  <span>{relativeDate(att.updatedAt)}</span>
                  {#if att.expiresAt}
                    <span>Expires {new Date(att.expiresAt).toLocaleDateString()}</span>
                  {/if}
                </div>
              </div>
              {#if att.status === "active"}
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
                  on:click={() => revokeAttestation(att.id)}
                >
                  Revoke
                </Button>
              {/if}
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}

  <!-- Unattested controls -->
  {#if !loading && unattestedControls.length > 0}
    <Card>
      <CardHeader>
        <CardTitle class="text-base flex items-center gap-2">
          <AlertTriangle class="h-4 w-4 text-amber-500" />
          Controls Pending Attestation ({unattestedControls.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          {#each unattestedControls as [id, def]}
            <div class="bg-muted/30 rounded-lg px-4 py-3">
              <div class="flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <Badge variant="outline" class="text-[10px]">{def.framework}</Badge>
                    <span class="font-mono text-sm">{id}</span>
                  </div>
                  <p class="text-xs text-muted-foreground mt-0.5">{def.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  on:click={() => {
                    selectedControlId = id;
                    showForm = true;
                  }}
                >
                  Attest
                </Button>
              </div>
              {#if def.evidenceGuidance}
                <div class="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Lightbulb class="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
                  <span>
                    Evidence needed: {def.evidenceGuidance.recommendedDocuments.slice(0, 2).join(", ")}{def.evidenceGuidance.recommendedDocuments.length > 2 ? `, +${def.evidenceGuidance.recommendedDocuments.length - 2} more` : ""}
                  </span>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
