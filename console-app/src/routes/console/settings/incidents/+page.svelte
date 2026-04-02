<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { AlertTriangle, Save, Clock } from "lucide-svelte";

  const settingsTabs = [
    { href: "/console/settings", label: "General" },
    { href: "/console/settings/users", label: "Users" },
    { href: "/console/settings/audit-log", label: "Audit Log" },
    { href: "/console/settings/billing", label: "Billing" },
    { href: "/console/settings/trust", label: "Trust Center" },
    { href: "/console/settings/incidents", label: "Incidents" },
  ];
  $: current = $page.url.pathname;

  interface SlaConfig {
    critical: number;
    high: number;
    medium: number;
    low: number;
  }

  const SEVERITY_META: { key: keyof SlaConfig; label: string; color: string; desc: string }[] = [
    { key: "critical", label: "Critical", color: "text-red-500", desc: "System down, data breach, security emergency" },
    { key: "high", label: "High", color: "text-orange-500", desc: "Major feature broken, compliance risk" },
    { key: "medium", label: "Medium", color: "text-yellow-500", desc: "Degraded service, minor security issue" },
    { key: "low", label: "Low", color: "text-muted-foreground", desc: "Cosmetic issue, minor inconvenience" },
  ];

  let loading = true;
  let saving = false;
  let error = "";
  let config: SlaConfig = { critical: 3600, high: 14400, medium: 86400, low: 259200 };

  function formatDuration(seconds: number): string {
    if (seconds >= 86400) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${Math.floor(seconds / 60)}m`;
  }

  // Input values as hours for UX convenience
  let inputHours: Record<string, number> = {};

  function secondsToHours(s: number): number {
    return Math.round((s / 3600) * 10) / 10;
  }

  function hoursToSeconds(h: number): number {
    return Math.round(h * 3600);
  }

  async function loadConfig() {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/incidents/sla-config");
      if (!res.ok) throw new Error(`Failed to load SLA config (${res.status})`);
      config = await res.json();
      inputHours = {
        critical: secondsToHours(config.critical),
        high: secondsToHours(config.high),
        medium: secondsToHours(config.medium),
        low: secondsToHours(config.low),
      };
    } catch (e: any) {
      error = e?.message || "Failed to load SLA configuration";
    } finally {
      loading = false;
    }
  }

  async function saveConfig() {
    saving = true;
    error = "";
    try {
      const updated: SlaConfig = {
        critical: hoursToSeconds(inputHours.critical),
        high: hoursToSeconds(inputHours.high),
        medium: hoursToSeconds(inputHours.medium),
        low: hoursToSeconds(inputHours.low),
      };

      // Validate ordering: critical <= high <= medium <= low
      if (updated.critical > updated.high || updated.high > updated.medium || updated.medium > updated.low) {
        error = "SLA deadlines must increase from Critical to Low (Critical is the tightest)";
        saving = false;
        return;
      }

      const res = await fetch("/api/incidents/sla-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save (${res.status})`);
      }
      config = await res.json();
      pushToast({ message: "SLA configuration saved", variant: "success" });
    } catch (e: any) {
      error = e?.message || "Failed to save SLA configuration";
      pushToast({ message: error, variant: "error" });
    } finally {
      saving = false;
    }
  }

  onMount(loadConfig);
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-semibold tracking-tight">Incident Settings</h1>

  <div class="flex gap-1 border-b">
    {#each settingsTabs as tab}
      <a
        href={tab.href}
        class="px-4 py-2.5 text-sm font-medium transition-colors -mb-px {current === tab.href
          ? 'text-foreground border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground'}"
      >{tab.label}</a>
    {/each}
  </div>

  {#if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>
  {/if}

  {#if loading}
    <div class="space-y-3">
      <Skeleton class="h-10 rounded-lg" />
      <Skeleton class="h-48 rounded-lg" />
    </div>
  {:else}
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Clock class="h-5 w-5" />
          SLA Response Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <p class="text-sm text-muted-foreground">
          Configure how long each severity level has before the SLA is considered breached.
          New incidents and severity changes will use these deadlines.
        </p>

        <div class="grid gap-4">
          {#each SEVERITY_META as sev}
            <div class="flex items-center gap-4 p-3 rounded-lg border bg-card">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium {sev.color}">{sev.label}</span>
                  <span class="text-xs text-muted-foreground">({formatDuration(hoursToSeconds(inputHours[sev.key] ?? 0))})</span>
                </div>
                <p class="text-xs text-muted-foreground mt-0.5">{sev.desc}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min="0.02"
                  max="168"
                  step="0.5"
                  bind:value={inputHours[sev.key]}
                  class="w-20 h-9 rounded-md border border-input bg-background px-3 text-sm text-right tabular-nums"
                />
                <span class="text-xs text-muted-foreground w-10">hours</span>
              </div>
            </div>
          {/each}
        </div>

        <div class="flex justify-end pt-2">
          <Button on:click={saveConfig} disabled={saving}>
            <Save class="h-4 w-4 mr-1.5" />
            {saving ? "Saving..." : "Save SLA Config"}
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
