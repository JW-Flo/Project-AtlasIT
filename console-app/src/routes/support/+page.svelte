<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import { FileText, Puzzle, Activity, Mail, Clock, Monitor, ArrowRight, Send } from "lucide-svelte";

  // Status state
  type StatusLevel = "operational" | "degraded" | "outage" | "loading";
  let statusLevel: StatusLevel = "loading";
  let statusText = "Checking system status…";

  // Form state
  let formName = "";
  let formEmail = "";
  let formCategory = "general";
  let formMessage = "";
  let formState: "idle" | "submitting" | "success" | "error" = "idle";
  let formError = "";

  onMount(async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          statusLevel = "operational";
          statusText = "All systems operational";
        } else {
          statusLevel = "degraded";
          const downServices = Object.entries(data.services ?? {})
            .filter(([, s]: [string, any]) => !s.ok)
            .map(([name]) => name)
            .join(", ");
          statusText = downServices
            ? `Degraded performance — ${downServices}`
            : "Some services are degraded";
        }
      } else {
        statusLevel = "outage";
        statusText = "Unable to reach services";
      }
    } catch {
      statusLevel = "outage";
      statusText = "Status unavailable";
    }
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (formState === "submitting") return;
    formState = "submitting";
    formError = "";

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          category: formCategory,
          message: formMessage,
        }),
      });

      if (res.ok) {
        formState = "success";
        formName = "";
        formEmail = "";
        formCategory = "general";
        formMessage = "";
      } else {
        const data = await res.json().catch(() => ({}));
        formError = (data as any).error || "Failed to send message. Please try again.";
        formState = "error";
      }
    } catch {
      formError = "Network error. Please check your connection and try again.";
      formState = "error";
    }
  }

  function resetForm() {
    formState = "idle";
    formError = "";
  }

  $: statusClasses = {
    loading: "bg-muted/50 border-border text-muted-foreground",
    operational: "bg-success/10 border-success/30 text-success",
    degraded: "bg-warning/10 border-warning/30 text-warning-foreground",
    outage: "bg-destructive/10 border-destructive/30 text-destructive",
  }[statusLevel];

  $: statusDotClasses = {
    loading: "bg-muted-foreground animate-pulse",
    operational: "bg-success animate-pulse",
    degraded: "bg-warning animate-pulse",
    outage: "bg-destructive",
  }[statusLevel];
</script>

<svelte:head>
  <title>Support — AtlasIT</title>
  <meta name="description" content="Get help with AtlasIT — AI-powered IT management for SMBs. Documentation, status, and direct support channels." />
</svelte:head>

<!-- Public page — no AppFrame wrapper, renders its own nav + layout -->
<div class="min-h-dvh bg-background text-foreground flex flex-col">

  <!-- Nav -->
  <nav class="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md">
    <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
      <a href="https://atlasit.pro" class="flex items-center gap-2.5 no-underline text-foreground hover:opacity-80 transition-opacity">
        <div class="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span class="text-primary-foreground font-bold text-sm">A</span>
        </div>
        <span class="font-semibold text-base tracking-tight">AtlasIT</span>
      </a>
      <ul class="flex items-center gap-6 list-none m-0 p-0">
        <li>
          <a href="https://docs.atlasit.pro" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors no-underline">
            Docs
          </a>
        </li>
        <li>
          <a href="/support" aria-current="page" class="text-sm font-medium text-foreground no-underline">
            Support
          </a>
        </li>
        <li>
          <a href="https://status.atlasit.pro" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors no-underline">
            Status
          </a>
        </li>
        <li>
          <Button href="/console/login" size="sm">Console Login</Button>
        </li>
      </ul>
    </div>
  </nav>

  <!-- Hero -->
  <section class="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center w-full">
    <h1 class="text-4xl font-bold tracking-tight leading-tight">How can we help?</h1>
    <p class="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
      Documentation, system status, and direct access to the AtlasIT team.
    </p>
  </section>

  <!-- Live status bar -->
  <div class="max-w-5xl mx-auto px-6 pb-10 w-full">
    <div class="rounded-xl border px-5 py-3.5 flex items-center gap-3 text-sm font-medium {statusClasses}">
      <span class="w-2 h-2 rounded-full shrink-0 {statusDotClasses}"></span>
      <span>{statusText}</span>
      <a
        href="https://status.atlasit.pro"
        class="ml-auto text-xs font-semibold opacity-75 hover:opacity-100 transition-opacity no-underline text-inherit"
      >
        View status page <ArrowRight class="inline h-3 w-3 ml-0.5" />
      </a>
    </div>
  </div>

  <!-- Resource cards -->
  <div class="max-w-5xl mx-auto px-6 pb-16 w-full">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">

      <!-- Documentation -->
      <a href="https://docs.atlasit.pro" class="no-underline text-inherit group">
        <Card class="h-full transition-colors hover:border-primary/40 cursor-pointer">
          <CardContent class="pt-7 pb-6 px-7 flex flex-col h-full">
            <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5 shrink-0">
              <FileText class="h-5 w-5 text-primary" />
            </div>
            <h3 class="text-base font-semibold tracking-tight mb-1.5">Documentation</h3>
            <p class="text-sm text-muted-foreground leading-relaxed flex-1">
              Setup guides, API reference, connector configuration, and workflow authoring for the AtlasIT platform.
            </p>
            <div class="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
              Browse docs
              <ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </CardContent>
        </Card>
      </a>

      <!-- Integration guides -->
      <a href="https://docs.atlasit.pro/integrations" class="no-underline text-inherit group">
        <Card class="h-full transition-colors hover:border-primary/40 cursor-pointer">
          <CardContent class="pt-7 pb-6 px-7 flex flex-col h-full">
            <div class="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center mb-5 shrink-0">
              <Puzzle class="h-5 w-5 text-success" />
            </div>
            <h3 class="text-base font-semibold tracking-tight mb-1.5">Integration guides</h3>
            <p class="text-sm text-muted-foreground leading-relaxed flex-1">
              Step-by-step setup for Okta, Google Workspace, Slack, AWS, and other supported connectors.
            </p>
            <div class="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
              View integrations
              <ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </CardContent>
        </Card>
      </a>

      <!-- System status -->
      <a href="https://status.atlasit.pro" class="no-underline text-inherit group">
        <Card class="h-full transition-colors hover:border-primary/40 cursor-pointer">
          <CardContent class="pt-7 pb-6 px-7 flex flex-col h-full">
            <div class="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center mb-5 shrink-0">
              <Activity class="h-5 w-5 text-warning-foreground" />
            </div>
            <h3 class="text-base font-semibold tracking-tight mb-1.5">System status</h3>
            <p class="text-sm text-muted-foreground leading-relaxed flex-1">
              Real-time availability for the AtlasIT control plane, connectors, and workflow execution engine.
            </p>
            <div class="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
              Check status
              <ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </CardContent>
        </Card>
      </a>

    </div>
  </div>

  <!-- Contact section -->
  <section class="max-w-5xl mx-auto px-6 pb-20 w-full">
    <Card>
      <CardContent class="p-0">
        <div class="grid grid-cols-1 md:grid-cols-2">

          <!-- Contact info -->
          <div class="p-10 border-b md:border-b-0 md:border-r">
            <h2 class="text-xl font-bold tracking-tight mb-3">Contact support</h2>
            <p class="text-sm text-muted-foreground mb-8 leading-relaxed">
              For account issues, integration troubleshooting, or anything the docs don't cover — reach us directly.
            </p>

            <div class="space-y-5">
              <div class="flex items-center gap-3">
                <div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail class="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Email</div>
                  <a href="mailto:support@atlasit.pro" class="text-sm text-foreground hover:text-primary transition-colors no-underline">
                    support@atlasit.pro
                  </a>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock class="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Response time</div>
                  <span class="text-sm text-foreground">
                    Business-critical: &lt; 4 hours &middot; General: &lt; 24 hours
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Monitor class="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Hours</div>
                  <span class="text-sm text-foreground">Mon–Fri, 8 AM – 8 PM CT</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact form -->
          <div class="p-10">
            {#if formState === "success"}
              <div class="flex flex-col items-center justify-center h-full text-center py-8">
                <div class="h-12 w-12 rounded-full bg-success/15 flex items-center justify-center mb-4">
                  <Send class="h-5 w-5 text-success" />
                </div>
                <h3 class="text-base font-semibold mb-2">Message sent</h3>
                <p class="text-sm text-muted-foreground mb-6">
                  We'll get back to you at <strong>{formEmail || "your email"}</strong> within our normal response window.
                </p>
                <Button variant="outline" size="sm" on:click={resetForm}>Send another</Button>
              </div>
            {:else}
              <form class="flex flex-col gap-4" on:submit={handleSubmit}>
                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      bind:value={formName}
                      disabled={formState === "submitting"}
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      bind:value={formEmail}
                      disabled={formState === "submitting"}
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    bind:value={formCategory}
                    disabled={formState === "submitting"}
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="general">General inquiry</option>
                    <option value="integration">Integration setup</option>
                    <option value="account">Account &amp; billing</option>
                    <option value="incident">Incident / outage</option>
                    <option value="security">Security concern</option>
                    <option value="feature">Feature request</option>
                  </select>
                </div>

                <div class="flex flex-col gap-1.5">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    placeholder="Describe your issue or question…"
                    bind:value={formMessage}
                    disabled={formState === "submitting"}
                    rows="5"
                    class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[100px]"
                  ></textarea>
                </div>

                {#if formState === "error" && formError}
                  <p class="text-sm text-destructive">{formError}</p>
                {/if}

                <div>
                  <Button type="submit" disabled={formState === "submitting"} class="gap-1.5">
                    {#if formState === "submitting"}
                      Sending…
                    {:else}
                      Send message
                      <Send class="h-3.5 w-3.5" />
                    {/if}
                  </Button>
                </div>
              </form>
            {/if}
          </div>

        </div>
      </CardContent>
    </Card>
  </section>

  <!-- Footer -->
  <footer class="mt-auto border-t py-6 px-6 text-center text-xs text-muted-foreground">
    &copy; 2026 AtlasIT &middot;
    <a href="https://atlasit.pro/privacy" class="text-muted-foreground hover:text-foreground transition-colors no-underline">Privacy</a>
    &middot;
    <a href="https://atlasit.pro/terms" class="text-muted-foreground hover:text-foreground transition-colors no-underline">Terms</a>
    &middot;
    <a href="https://status.atlasit.pro" class="text-muted-foreground hover:text-foreground transition-colors no-underline">Status</a>
  </footer>

</div>
