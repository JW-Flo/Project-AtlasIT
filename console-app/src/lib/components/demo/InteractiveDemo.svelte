<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { DEMO_MODULES, DEMO_TENANT, DEMO_MARKETPLACE, type DemoNavModule } from "$lib/demo/data";

  export let authenticated = false;

  let activeModule: DemoNavModule = "dashboard";
  let liveCompliance = DEMO_TENANT.complianceScore;
  let liveAutomations = DEMO_TENANT.automationsToday;
  let liveReviews = DEMO_TENANT.pendingReviews;
  let liveIncidents = DEMO_TENANT.openIncidents;
  let showPrompt = false;

  const ctas = authenticated
    ? [
        { label: "Start Free Trial", href: "/pricing", event: "requested_trial" },
        { label: "Book Demo", href: "/support", event: "booked_demo" },
        { label: "Explore Full Sandbox", href: "/console", event: "clicked_cta" },
      ]
    : [
        { label: "Start Free Trial", href: "/signup", event: "requested_trial" },
        { label: "Book Demo", href: "/support", event: "booked_demo" },
        { label: "Explore Full Sandbox", href: "/console/login?email=demo@atlasit.pro", event: "clicked_cta" },
      ];

  async function track(event: string, module: string | null = null) {
    try {
      await fetch("/api/demo/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event, module }),
      });
    } catch {
      // keep demo responsive even if analytics endpoint is unavailable
    }
  }

  function selectModule(module: DemoNavModule) {
    activeModule = module;
    track("explored_module", module);
  }

  let interval: ReturnType<typeof setInterval> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    track("viewed_demo");
    interval = setInterval(() => {
      liveCompliance = Math.min(96, liveCompliance + 1);
      liveAutomations += 1;
      liveReviews = Math.max(0, liveReviews - (Math.random() > 0.65 ? 1 : 0));
      if (liveIncidents > 0 && Math.random() > 0.6) {
        liveIncidents -= 1;
      }
    }, 5000);
    timeout = setTimeout(() => (showPrompt = true), 90000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
    if (timeout) clearTimeout(timeout);
  });
</script>

<div class="mx-auto max-w-7xl px-4 pb-24 pt-8 text-slate-900">
  <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <p class="text-xs uppercase tracking-wide text-slate-500">Interactive AtlasIT Demo</p>
    <h1 class="text-2xl font-semibold text-slate-900">{DEMO_TENANT.name} — Live Security Operations</h1>
    <p class="mt-2 text-sm text-slate-600">
      {DEMO_TENANT.employees} employees · {DEMO_TENANT.frameworks.join(" + ")} · {DEMO_TENANT.stack.join(" · ")}
    </p>
  </div>

  <div class="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
    <div class="rounded-xl border bg-white p-4"><p class="text-xs text-slate-500">Compliance score</p><p class="text-xl font-semibold">{liveCompliance}%</p></div>
    <div class="rounded-xl border bg-white p-4"><p class="text-xs text-slate-500">Employees</p><p class="text-xl font-semibold">{DEMO_TENANT.employees}</p></div>
    <div class="rounded-xl border bg-white p-4"><p class="text-xs text-slate-500">Apps connected</p><p class="text-xl font-semibold">{DEMO_TENANT.appsConnected}</p></div>
    <div class="rounded-xl border bg-white p-4"><p class="text-xs text-slate-500">Pending reviews</p><p class="text-xl font-semibold">{liveReviews}</p></div>
    <div class="rounded-xl border bg-white p-4"><p class="text-xs text-slate-500">Open incidents</p><p class="text-xl font-semibold">{liveIncidents}</p></div>
  </div>

  <div class="mb-6 flex flex-wrap gap-2">
    {#each DEMO_MODULES as module}
      <button class="rounded-full border px-3 py-1 text-sm {activeModule === module.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:text-slate-900'}" on:click={() => selectModule(module.id)}>{module.label}</button>
    {/each}
  </div>

  <div class="rounded-2xl border bg-white p-6 shadow-sm min-h-[320px]">
    {#if activeModule === 'dashboard'}
      <h2 class="text-lg font-semibold">Guided Tour: Dashboard</h2>
      <p class="text-sm text-slate-600 mt-2">Automation executed today: <strong>{liveAutomations}</strong>. New-hire onboarding completed for <strong>Dr. Maya Lin</strong> at {new Date().toLocaleTimeString()}.</p>
    {:else if activeModule === 'compliance'}
      <h2 class="text-lg font-semibold">Compliance</h2>
      <p class="text-sm mt-2">SOC2 controls passing: 42/48 · HIPAA safeguards passing: 31/36 · Evidence objects collected in last 24h: 128.</p>
    {:else if activeModule === 'identity'}
      <h2 class="text-lg font-semibold">Identity Lifecycle</h2>
      <p class="text-sm mt-2">MFA coverage 95%. Orphaned accounts reduced to 1 after nightly remediation. Joiner/mover/leaver events synced from Okta and Google Workspace.</p>
    {:else if activeModule === 'automation'}
      <h2 class="text-lg font-semibold">Automation</h2>
      <ul class="mt-3 list-disc pl-5 text-sm space-y-1"><li>Onboard Dentist workflow: ✅ 12 steps in 94 seconds</li><li>Offboard Contractor workflow: ✅ 9 steps in 51 seconds</li><li>Slack access request approvals: ✅ 6 approvals today</li><li>Device quarantine flow: ✅ auto-triggered 2 times</li></ul>
    {:else if activeModule === 'incidents'}
      <h2 class="text-lg font-semibold">Incidents</h2>
      <ul class="mt-3 list-disc pl-5 text-sm space-y-1"><li>Suspicious login blocked — resolved automatically</li><li>MFA bypass attempt — under investigation</li><li>Terminated employee access removed — fully remediated</li></ul>
    {:else if activeModule === 'analytics'}
      <h2 class="text-lg font-semibold">Analytics</h2>
      <p class="text-sm mt-2">ROI: 117 hours saved this month. Risk trend improved by 18%. Automation success rate: 98.2%.</p>
    {:else}
      <h2 class="text-lg font-semibold">Marketplace</h2>
      <div class="mt-3 flex flex-wrap gap-2">
        {#each DEMO_MARKETPLACE as app}
          <span class="rounded-md border bg-slate-50 px-2 py-1 text-sm">{app}</span>
        {/each}
      </div>
    {/if}
  </div>

  {#if showPrompt}
    <div class="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
      Want your own live environment?
      <a href="/support" class="ml-2 text-blue-700 underline" on:click={() => track('booked_demo')}>Book a guided demo</a>
    </div>
  {/if}
</div>

<div class="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur">
  <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
    <p class="text-xs text-slate-600">Try AtlasIT instantly with synthetic data. No setup required.</p>
    <div class="flex gap-2">
      {#each ctas as cta}
        <a href={cta.href} class="rounded-md border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50" on:click={() => track(cta.event)}>{cta.label}</a>
      {/each}
    </div>
  </div>
</div>
