<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { cn } from "$lib/utils";
  import { relativeTime } from "$lib/utils/time";
  import {
    ShieldCheck,
    Download,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Activity,
    FileCheck,
    Plug,
    Clock,
    Lock,
    Send,
  } from "lucide-svelte";

  interface TrustData {
    tenant: { name: string; slug: string; industry: string | null; size: string | null };
    overallScore: number;
    totals: { controls: number; pass: number; fail: number; unknown: number };
    frameworks: Array<{
      label: string;
      framework: string;
      controlCount: number;
      score: number;
      lastEvaluatedAt: string | null;
    }>;
    stats: {
      connectedApps: number;
      evidenceLast30Days: number;
      lastSnapshotAt: string | null;
      signedAttestations?: number;
    };
    commitment: string;
  }

  let data: TrustData | null = null;
  let loading = true;
  let error: string | null = null;

  $: slug = $page.params.slug;

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch(`/api/compliance/api/v1/trust/${encodeURIComponent(slug)}`);
      if (res.status === 404) {
        const j = await res.json().catch(() => ({}));
        error =
          j.code === "NOT_PUBLISHED"
            ? "This organization has not published their trust center."
            : "No trust center found for that URL.";
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      data = json.data;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(load);

  function scoreColorClass(score: number): string {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  }
  function scoreBgClass(score: number): string {
    if (score >= 80) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-destructive";
  }
  function frameworkBadgeClass(key: string): string {
    const map: Record<string, string> = {
      SOC2: "bg-info-muted text-info",
      ISO27001: "bg-primary-muted text-primary",
      NIST_CSF: "bg-success-muted text-success",
      HIPAA: "bg-warning-muted text-warning",
      GDPR: "bg-destructive-muted text-destructive",
    };
    return map[key] ?? "bg-muted text-muted-foreground";
  }
  $: pdfUrl = data
    ? `/api/compliance/api/v1/trust/${encodeURIComponent(data.tenant.slug)}/export.pdf`
    : "";

  // NDA / access request form state
  let ndaForm = { name: "", email: "", company: "", reason: "" };
  let ndaState: "idle" | "submitting" | "submitted" | "error" = "idle";
  let ndaError: string | null = null;

  async function submitAccessRequest() {
    if (!data || ndaState === "submitting") return;
    ndaState = "submitting";
    ndaError = null;
    try {
      const res = await fetch(
        `/api/compliance/api/v1/trust/${encodeURIComponent(data.tenant.slug)}/access-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ndaForm),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        ndaError = json.error ?? `HTTP ${res.status}`;
        ndaState = "error";
        return;
      }
      ndaState = json.status === "pending" ? "submitted" : "submitted";
    } catch (e) {
      ndaError = (e as Error).message;
      ndaState = "error";
    }
  }

  $: opStats = data
    ? [
        {
          icon: Plug,
          label: "Connected integrations",
          value: data.stats.connectedApps,
          hint: "Active live-data sources",
        },
        {
          icon: Activity,
          label: "Evidence last 30 days",
          value: data.stats.evidenceLast30Days.toLocaleString(),
          hint: "Operational records scored",
        },
        {
          icon: FileCheck,
          label: "Signed attestations",
          value: data.stats.signedAttestations ?? 0,
          hint: "Formal executive sign-offs",
        },
        {
          icon: Clock,
          label: "Update cadence",
          value: "Daily",
          hint: "Nightly re-evaluation 02:00 UTC",
        },
      ]
    : [];
</script>

<svelte:head>
  {#if data}
    <title>{data.tenant.name} · Trust Center</title>
    <meta
      name="description"
      content="Live compliance posture for {data.tenant.name}. Score: {data.overallScore}% across {data.totals.controls} controls."
    />
  {:else}
    <title>Trust Center · AtlasIT</title>
  {/if}
</svelte:head>

<div class="min-h-dvh bg-background">
  <!-- Decorative gradient -->
  <div class="absolute inset-x-0 top-0 -z-10 overflow-hidden pointer-events-none">
    <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/8 blur-3xl"></div>
  </div>

  <!-- Top brand bar -->
  <header class="container-page py-5 flex items-center justify-between border-b border-border">
    <a href="/" class="flex items-center gap-2 group">
      <div class="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-sm">
        <ShieldCheck class="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span class="font-semibold text-lg tracking-tight">AtlasIT</span>
    </a>
    <div class="text-2xs uppercase tracking-wider text-muted-foreground font-medium">Trust Center</div>
  </header>

  <main class="container-content py-10">
    {#if loading}
      <div class="space-y-4 animate-pulse">
        <div class="h-12 w-64 bg-muted rounded-lg"></div>
        <div class="h-48 bg-muted rounded-2xl"></div>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {#each Array(5) as _}
            <div class="h-32 bg-muted rounded-xl"></div>
          {/each}
        </div>
      </div>
    {:else if error || !data}
      <div class="mt-20 max-w-md mx-auto text-center">
        <div class="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <AlertCircle class="h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <h1 class="text-2xl font-semibold text-foreground mb-2">Trust center not available</h1>
        <p class="text-sm text-muted-foreground">{error ?? "Unknown error."}</p>
        <a
          href="/"
          class="mt-6 inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
        >
          ← Back to AtlasIT
        </a>
      </div>
    {:else}
      <!-- Tenant header -->
      <div class="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div class="min-w-0">
          <p class="text-2xs uppercase tracking-wider text-primary font-semibold mb-2">Live compliance posture</p>
          <h1 class="text-4xl font-semibold tracking-tight text-foreground">{data.tenant.name}</h1>
          {#if data.tenant.industry}
            <p class="mt-2 text-sm text-muted-foreground">
              {data.tenant.industry}{data.tenant.size ? ` · ${data.tenant.size} employees` : ""}
            </p>
          {/if}
        </div>
        <div class="flex items-center gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium rounded-lg border border-border bg-card hover:bg-accent transition-colors"
          >
            <Download class="h-3.5 w-3.5" strokeWidth={2.25} />
            Auditor PDF
          </a>
        </div>
      </div>

      <!-- Hero score card -->
      <div class="surface-elevated p-6 sm:p-8 mb-6 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>

        <div class="relative grid sm:grid-cols-[1fr,auto] gap-6 items-end">
          <div>
            <div class="text-2xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
              Overall Compliance Score
            </div>
            <div class="flex items-baseline gap-3 flex-wrap">
              <div class="text-7xl font-semibold tabular-nums tracking-tight {scoreColorClass(data.overallScore)}">
                {data.overallScore}<span class="text-3xl text-muted-foreground/40">%</span>
              </div>
            </div>
            <div class="mt-3 flex items-center gap-3 flex-wrap text-sm">
              <span class="inline-flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 rounded-full bg-success"></span>
                <span class="text-foreground tabular-nums font-medium">{data.totals.pass}</span>
                <span class="text-muted-foreground">passing</span>
              </span>
              <span class="text-muted-foreground/40">·</span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 rounded-full bg-destructive"></span>
                <span class="text-foreground tabular-nums font-medium">{data.totals.fail}</span>
                <span class="text-muted-foreground">failing</span>
              </span>
              <span class="text-muted-foreground/40">·</span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
                <span class="text-foreground tabular-nums font-medium">{data.totals.unknown}</span>
                <span class="text-muted-foreground">unknown</span>
              </span>
              <span class="text-muted-foreground/40">·</span>
              <span class="text-muted-foreground tabular-nums">of {data.totals.controls} controls</span>
            </div>
            {#if data.stats.lastSnapshotAt}
              <div class="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <Clock class="h-3 w-3" strokeWidth={2.25} />
                Updated {relativeTime(data.stats.lastSnapshotAt)}
              </div>
            {/if}
          </div>
        </div>

        <!-- Score bar -->
        <div class="mt-6 h-2 bg-muted rounded-full overflow-hidden">
          <div
            class="h-full {scoreBgClass(data.overallScore)} transition-all duration-700 ease-out-quart rounded-full"
            style="width: {data.overallScore}%"
          ></div>
        </div>

        <p class="mt-6 text-sm text-muted-foreground italic leading-relaxed border-l-2 border-primary/30 pl-4">
          {data.commitment}
        </p>
      </div>

      <!-- Frameworks grid -->
      <section class="mt-10">
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frameworks</h2>
          <span class="text-2xs text-muted-foreground">{data.frameworks.length} active</span>
        </div>
        {#if data.frameworks.length === 0}
          <div class="surface p-12 text-center">
            <p class="text-sm text-muted-foreground">No frameworks installed yet.</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {#each data.frameworks as fw}
              <div class="surface p-4 hover:shadow-sm transition-shadow group">
                <div class="flex items-start justify-between mb-3">
                  <span class="pill {frameworkBadgeClass(fw.framework)}">
                    {fw.framework.replace("_", " ")}
                  </span>
                  <span class={cn("h-1.5 w-1.5 rounded-full mt-1", scoreBgClass(fw.score))}></span>
                </div>
                <div class="text-xs font-medium text-foreground/80 mb-2 truncate">{fw.label}</div>
                <div class="flex items-baseline gap-1.5 mb-2">
                  <div class="text-2xl font-semibold tabular-nums tracking-tight {scoreColorClass(fw.score)}">
                    {fw.score}<span class="text-sm text-muted-foreground/50">%</span>
                  </div>
                  <span class="text-2xs text-muted-foreground tabular-nums">{fw.controlCount} ctrls</span>
                </div>
                <div class="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full {scoreBgClass(fw.score)} transition-all duration-500 ease-out-quart"
                    style="width: {fw.score}%"
                  ></div>
                </div>
                <p class="mt-2 text-2xs text-muted-foreground">
                  {relativeTime(fw.lastEvaluatedAt)}
                </p>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <!-- Operational stats -->
      <section class="mt-10">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Operational Evidence
        </h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {#each opStats as s}
            <div class="surface p-4">
              <div class="flex items-start justify-between mb-3">
                <p class="text-2xs uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
                <div class="w-7 h-7 rounded-md bg-primary-muted text-primary flex items-center justify-center shrink-0">
                  <svelte:component this={s.icon} class="w-3.5 h-3.5" strokeWidth={2} />
                </div>
              </div>
              <div class="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{s.value}</div>
              <p class="mt-1 text-2xs text-muted-foreground">{s.hint}</p>
            </div>
          {/each}
        </div>
      </section>

      <!-- Trust + verifiability footer -->
      <section class="mt-12 surface p-6 sm:p-8">
        <div class="grid sm:grid-cols-[auto,1fr] gap-5 items-start">
          <div class="w-12 h-12 rounded-xl bg-success-muted text-success flex items-center justify-center shrink-0">
            <CheckCircle2 class="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">Verifiable, evidence-grounded scoring</h3>
            <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
              Every control state on this page is computed by AtlasIT's CDT rule engine from live operational data —
              not self-attestation. Scores update continuously as evidence flows in from connected integrations.
              The downloadable PDF includes a SHA-256 content hash on every page for tamper detection.
            </p>
            <div class="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
              >
                <Download class="h-3 w-3" strokeWidth={2.25} />
                Download auditor package (PDF)
              </a>
              <a
                href="/"
                class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                How AtlasIT generates this <ExternalLink class="h-3 w-3" strokeWidth={2.25} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- NDA / Detailed Evidence Access -->
      <section class="mt-12 surface p-6 sm:p-8" id="request-access">
        <div class="flex items-start gap-4 mb-6">
          <div class="w-10 h-10 rounded-lg bg-primary-muted text-primary flex items-center justify-center shrink-0">
            <Lock class="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">Request detailed evidence access</h3>
            <p class="mt-1 text-sm text-muted-foreground">
              Need the full evidence bundle, policy documents, or pen-test reports?
              Submit your details and {data.tenant.name} will review your request and send a
              time-limited secure link.
            </p>
          </div>
        </div>

        {#if ndaState === "submitted"}
          <div class="rounded-lg bg-success-muted border border-success/20 p-5 flex items-start gap-3">
            <CheckCircle2 class="h-5 w-5 text-success shrink-0 mt-0.5" strokeWidth={1.75} />
            <div>
              <p class="text-sm font-medium text-foreground">Request submitted</p>
              <p class="text-sm text-muted-foreground mt-0.5">
                {data.tenant.name}'s team will review your request and send a secure download link
                to your email address.
              </p>
            </div>
          </div>
        {:else}
          <form
            on:submit|preventDefault={submitAccessRequest}
            class="grid sm:grid-cols-2 gap-4"
          >
            <div class="flex flex-col gap-1.5">
              <label for="nda-name" class="text-xs font-medium text-muted-foreground">Full name *</label>
              <input
                id="nda-name"
                type="text"
                bind:value={ndaForm.name}
                required
                placeholder="Jane Smith"
                class="h-9 px-3 rounded-md border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="nda-email" class="text-xs font-medium text-muted-foreground">Work email *</label>
              <input
                id="nda-email"
                type="email"
                bind:value={ndaForm.email}
                required
                placeholder="jane@acme.com"
                class="h-9 px-3 rounded-md border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="nda-company" class="text-xs font-medium text-muted-foreground">Company *</label>
              <input
                id="nda-company"
                type="text"
                bind:value={ndaForm.company}
                required
                placeholder="Acme Corp"
                class="h-9 px-3 rounded-md border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="nda-reason" class="text-xs font-medium text-muted-foreground">Reason (optional)</label>
              <input
                id="nda-reason"
                type="text"
                bind:value={ndaForm.reason}
                placeholder="e.g. Vendor security review for Q3 procurement"
                class="h-9 px-3 rounded-md border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {#if ndaState === "error" && ndaError}
              <div class="sm:col-span-2 rounded-md bg-destructive-muted border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {ndaError}
              </div>
            {/if}

            <div class="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={ndaState === "submitting"}
                class="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if ndaState === "submitting"}
                  <span class="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                  Sending…
                {:else}
                  <Send class="h-3.5 w-3.5" strokeWidth={2} />
                  Request access
                {/if}
              </button>
              <p class="text-2xs text-muted-foreground">
                Your information is shared only with {data.tenant.name}.
              </p>
            </div>
          </form>
        {/if}
      </section>

      <!-- Powered by -->
      <footer class="mt-12 pt-6 border-t border-border text-center">
        <p class="text-2xs text-muted-foreground">
          Trust center powered by
          <a href="/" class="text-primary hover:underline font-medium">AtlasIT</a>
          · Need detailed evidence? Contact
          <span class="text-foreground font-medium">{data.tenant.name}</span> directly.
        </p>
      </footer>
    {/if}
  </main>
</div>

