<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Badge from "$lib/components/ui/badge.svelte";

  export interface EvidenceItem {
    id: string;
    controlTags: string[];
    source: string;
    actorEmail?: string;
    subjectEmail?: string;
    impactScore: number;
    r2Hash?: string;
    createdAt: string;
    framework?: string;
    eventType?: string;
    metadata?: Record<string, unknown>;
  }

  const CONTROL_TAG_NAMES: Record<string, string> = {
    "CC6.1": "Logical Access Controls",
    "CC6.2": "Onboarding Access Provisioning",
    "CC6.3": "Access Removal on Termination",
    "CC7.1": "Change Management",
    "A.9.2.1": "User Registration and De-registration",
    "A.9.2.2": "User Access Provisioning",
    "A.9.2.5": "Review of User Access Rights",
    "A.9.2.6": "Removal of Access Rights",
    "NIST PR.AC-1": "Identities and Credentials Managed",
    "NIST PR.AC-4": "Access Permissions Managed",
    "GDPR Art.5(1)(f)": "Integrity and Confidentiality",
  };

  const SOURCE_ICONS: Record<string, string> = {
    github: "⬡",
    "google-workspace": "◈",
    okta: "○",
    slack: "◉",
    jira: "◇",
    aws: "△",
  };

  export let evidence: EvidenceItem | null = null;

  const dispatch = createEventDispatcher<{ close: void }>();

  function close() {
    dispatch("close");
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  function impactBarColor(score: number): string {
    if (score >= 70) return "bg-success";
    if (score >= 40) return "bg-warning";
    return "bg-destructive";
  }

  function impactBadgeVariant(score: number): "success" | "warning" | "destructive" {
    if (score >= 70) return "success";
    if (score >= 40) return "warning";
    return "destructive";
  }

  function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function truncate(str: string, len: number): string {
    return str.length > len ? str.slice(0, len) + "…" : str;
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }

  function sourceIcon(source: string): string {
    const key = source.toLowerCase().replace(/\s+/g, "-");
    return SOURCE_ICONS[key] ?? "◎";
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if evidence}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    on:click={handleOverlayClick}
  >
    <div
      class="relative w-full max-w-lg rounded-xl border bg-card text-card-foreground shadow-xl max-h-[90dvh] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Evidence detail"
    >
      <!-- Close button -->
      <button
        class="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        on:click={close}
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </button>

      <!-- Header -->
      <div class="px-5 pt-5 pb-4 border-b">
        <div class="flex items-center gap-2 mb-3 flex-wrap pr-6">
          <span class="text-lg mr-1" title={evidence.source}>{sourceIcon(evidence.source)}</span>
          {#each evidence.controlTags as tag}
            <Badge variant="default" class="font-mono text-xs">{tag}</Badge>
          {/each}
          {#if evidence.framework}
            <Badge variant="outline" class="text-xs">{evidence.framework}</Badge>
          {/if}
        </div>
        <div class="text-xs text-muted-foreground">
          {evidence.source}{evidence.eventType ? ` · ${evidence.eventType}` : ""}
        </div>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <!-- Impact score -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Impact Score</span>
            <Badge variant={impactBadgeVariant(evidence.impactScore)}>{evidence.impactScore}/100</Badge>
          </div>
          <div class="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              class="h-full rounded-full transition-all {impactBarColor(evidence.impactScore)}"
              style="width: {evidence.impactScore}%"
            ></div>
          </div>
        </div>

        <!-- Actor → Subject -->
        {#if evidence.actorEmail || evidence.subjectEmail}
          <div class="rounded-md border bg-muted/30 px-3 py-2.5 space-y-1.5">
            {#if evidence.actorEmail}
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs text-muted-foreground w-14 shrink-0">Actor</span>
                <span class="text-xs font-mono flex-1 truncate">{evidence.actorEmail}</span>
                <button
                  class="shrink-0 text-muted-foreground hover:text-foreground"
                  on:click={() => copyToClipboard(evidence!.actorEmail!)}
                  title="Copy email"
                  aria-label="Copy actor email"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>
              </div>
            {/if}
            {#if evidence.actorEmail && evidence.subjectEmail}
              <div class="flex items-center gap-2 pl-14">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
                  <path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>
                </svg>
              </div>
            {/if}
            {#if evidence.subjectEmail}
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs text-muted-foreground w-14 shrink-0">Subject</span>
                <span class="text-xs font-mono flex-1 truncate">{evidence.subjectEmail}</span>
                <button
                  class="shrink-0 text-muted-foreground hover:text-foreground"
                  on:click={() => copyToClipboard(evidence!.subjectEmail!)}
                  title="Copy email"
                  aria-label="Copy subject email"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>
              </div>
            {/if}
          </div>
        {/if}

        <!-- R2 Hash -->
        {#if evidence.r2Hash}
          <div>
            <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Storage Hash
              <span class="normal-case font-normal ml-1 text-muted-foreground/70" title="Tamper-evident storage hash">(tamper-evident)</span>
            </div>
            <div class="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
              <span class="font-mono text-xs flex-1 truncate text-muted-foreground" title={evidence.r2Hash}>
                {truncate(evidence.r2Hash, 40)}
              </span>
              <button
                class="shrink-0 text-muted-foreground hover:text-foreground"
                on:click={() => copyToClipboard(evidence!.r2Hash!)}
                title="Copy hash"
                aria-label="Copy storage hash"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              </button>
            </div>
          </div>
        {/if}

        <!-- Control mapping -->
        {#if evidence.controlTags.length > 0}
          <div>
            <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Control Mapping</div>
            <div class="space-y-1.5">
              {#each evidence.controlTags as tag}
                <div class="flex items-center gap-2">
                  <Badge variant="outline" class="font-mono text-xs shrink-0">{tag}</Badge>
                  <span class="text-xs text-muted-foreground">
                    {CONTROL_TAG_NAMES[tag] ?? "Unknown control"}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Timestamp -->
        <div class="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t">
          <span>{new Date(evidence.createdAt).toLocaleString()}</span>
          <span class="text-muted-foreground/50">·</span>
          <span>{relativeTime(evidence.createdAt)}</span>
        </div>
      </div>
    </div>
  </div>
{/if}
