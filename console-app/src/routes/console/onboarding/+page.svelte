<script lang="ts">
  import { onMount } from "svelte";
  import { POLICY_TEMPLATES, defaultTemplatesFor } from "$lib/data/policy-templates";

  // ── Wizard state ──────────────────────────────────────────────────────────

  type StepId = "company" | "frameworks" | "policies" | "team" | "integration" | "finish";
  const STEPS: { id: StepId; label: string; description: string }[] = [
    { id: "company",     label: "Company",     description: "Industry, size, goals" },
    { id: "frameworks",  label: "Frameworks",  description: "Which regulations you care about" },
    { id: "policies",    label: "Policies",    description: "Starter policies to customize" },
    { id: "team",        label: "Team",        description: "Invite teammates (optional)" },
    { id: "integration", label: "Apps",        description: "Connect your first integration (optional)" },
    { id: "finish",      label: "Finish",      description: "Review and go" },
  ];
  let currentStep: StepId = "company";

  // ── Step 1: Company ──────────────────────────────────────────────────────
  let industry = "";
  let size = "";
  let useCases: string[] = [];

  const INDUSTRIES = [
    "Technology / SaaS",
    "Financial services",
    "Healthcare",
    "E-commerce / Retail",
    "Education",
    "Manufacturing",
    "Media / Entertainment",
    "Government",
    "Other",
  ];
  const SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
  const USE_CASES = [
    { id: "soc2-prep",      label: "SOC 2 audit prep" },
    { id: "iso-cert",       label: "ISO 27001 certification" },
    { id: "hipaa",          label: "HIPAA compliance" },
    { id: "gdpr",           label: "GDPR / privacy compliance" },
    { id: "continuous",     label: "Continuous monitoring" },
    { id: "vendor-risk",    label: "Vendor risk management" },
  ];

  function toggleUseCase(id: string) {
    useCases = useCases.includes(id) ? useCases.filter((u) => u !== id) : [...useCases, id];
    if (id === "soc2-prep" && useCases.includes("soc2-prep")) frameworks = [...new Set([...frameworks, "pack-soc2-builtin"])];
    if (id === "iso-cert" && useCases.includes("iso-cert")) frameworks = [...new Set([...frameworks, "pack-iso27001-builtin"])];
    if (id === "hipaa" && useCases.includes("hipaa")) frameworks = [...new Set([...frameworks, "pack-hipaa-builtin"])];
    if (id === "gdpr" && useCases.includes("gdpr")) frameworks = [...new Set([...frameworks, "pack-gdpr-builtin"])];
  }

  // ── Step 2: Frameworks ───────────────────────────────────────────────────
  const FRAMEWORKS = [
    { id: "pack-soc2-builtin",     label: "SOC 2 Type II",     frameworkKey: "SOC2",      controlCount: 26, tagline: "US trust-services criteria — common for B2B SaaS" },
    { id: "pack-iso27001-builtin", label: "ISO 27001:2022",    frameworkKey: "ISO27001",  controlCount: 17, tagline: "International infosec management standard" },
    { id: "pack-nist-csf-builtin", label: "NIST CSF 2.0",      frameworkKey: "NIST_CSF",  controlCount: 7,  tagline: "US critical-infrastructure cybersecurity framework" },
    { id: "pack-hipaa-builtin",    label: "HIPAA Security",    frameworkKey: "HIPAA",     controlCount: 7,  tagline: "US healthcare PHI protection" },
    { id: "pack-gdpr-builtin",     label: "GDPR",              frameworkKey: "GDPR",      controlCount: 7,  tagline: "EU data-subject rights and data protection" },
  ];
  let frameworks: string[] = [];

  function toggleFramework(id: string) {
    frameworks = frameworks.includes(id) ? frameworks.filter((f) => f !== id) : [...frameworks, id];
  }

  // ── Step 3: Policies ─────────────────────────────────────────────────────
  let selectedTemplates: string[] = [];
  $: selectedFrameworkKeys = FRAMEWORKS.filter((f) => frameworks.includes(f.id)).map((f) => f.frameworkKey);
  $: suggestedTemplates = defaultTemplatesFor(selectedFrameworkKeys);

  function toggleTemplate(id: string) {
    selectedTemplates = selectedTemplates.includes(id) ? selectedTemplates.filter((t) => t !== id) : [...selectedTemplates, id];
  }

  // ── Step 4: Team ─────────────────────────────────────────────────────────
  let invitees: Array<{ email: string; displayName: string; role: string }> = [];
  function addInviteeRow() {
    invitees = [...invitees, { email: "", displayName: "", role: "member" }];
  }
  function removeInviteeRow(i: number) {
    invitees = invitees.filter((_, idx) => idx !== i);
  }

  // ── Provisioning execution ───────────────────────────────────────────────
  let submitting = false;
  let provisioningLog: Array<{ kind: "info" | "ok" | "err"; msg: string }> = [];
  let provisioningDone = false;
  let provisioningError: string | null = null;

  async function pushLog(kind: "info" | "ok" | "err", msg: string) {
    provisioningLog = [...provisioningLog, { kind, msg }];
  }

  async function runProvisioning() {
    submitting = true;
    provisioningLog = [];
    provisioningError = null;

    try {
      await pushLog("info", "Saving company profile...");
      const userRaw = sessionStorage.getItem("atlasit_user");
      const tenantId = userRaw ? JSON.parse(userRaw).tenantId : null;
      if (!tenantId) throw new Error("No tenant in session — log in again");
      if (industry || size) {
        const r = await fetch(`/api/v1/tenants/${tenantId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(industry ? { industry } : {}),
            ...(size ? { size } : {}),
            config: { useCases },
          }),
        });
        if (r.ok) await pushLog("ok", `Profile saved (industry: ${industry || "—"}, size: ${size || "—"})`);
        else await pushLog("err", `Profile save returned ${r.status} — continuing`);
      }

      for (const packId of frameworks) {
        const label = FRAMEWORKS.find((f) => f.id === packId)?.label ?? packId;
        await pushLog("info", `Installing ${label}...`);
        const r = await fetch(`/api/compliance/api/v1/compliance-packs/${packId}/install`, { method: "POST" });
        if (r.ok) await pushLog("ok", `${label} installed`);
        else await pushLog("err", `${label} install failed (HTTP ${r.status})`);
      }

      for (const tplId of selectedTemplates) {
        const tpl = POLICY_TEMPLATES.find((t) => t.id === tplId);
        if (!tpl) continue;
        await pushLog("info", `Creating policy: ${tpl.name}...`);
        const r = await fetch(`/api/compliance/api/v1/policies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: tpl.name,
            category: tpl.category,
            version: "1.0",
            content: tpl.content,
            framework_refs: tpl.applicableFrameworks,
          }),
        });
        if (r.ok) await pushLog("ok", `${tpl.name} drafted`);
        else await pushLog("err", `${tpl.name} failed (HTTP ${r.status})`);
      }

      for (const inv of invitees) {
        if (!inv.email.trim()) continue;
        await pushLog("info", `Inviting ${inv.email}...`);
        const r = await fetch(`/api/v1/tenant/users/invite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inv.email.trim(), displayName: inv.displayName.trim() || undefined, role: inv.role }),
        });
        if (r.ok) await pushLog("ok", `Invited ${inv.email}`);
        else await pushLog("err", `Invite to ${inv.email} failed (HTTP ${r.status})`);
      }

      if (frameworks.length > 0) {
        await pushLog("info", "Running initial compliance evaluation...");
        for (const packId of frameworks) {
          await fetch(`/api/compliance/api/v1/compliance-packs/${packId}/evaluate`, { method: "POST" }).catch(() => {});
        }
        await pushLog("ok", "Initial evaluation complete");
      }

      provisioningDone = true;
    } catch (e) {
      provisioningError = (e as Error).message;
      await pushLog("err", `Fatal: ${provisioningError}`);
    } finally {
      submitting = false;
    }
  }

  function goToStep(id: StepId) { currentStep = id; }
  function next() {
    const idx = STEPS.findIndex((s) => s.id === currentStep);
    if (idx < STEPS.length - 1) currentStep = STEPS[idx + 1].id;
  }
  function back() {
    const idx = STEPS.findIndex((s) => s.id === currentStep);
    if (idx > 0) currentStep = STEPS[idx - 1].id;
  }

  $: currentIdx = STEPS.findIndex((s) => s.id === currentStep);
  $: canSkip = currentStep === "team" || currentStep === "integration" || currentStep === "policies";

  $: if (frameworks.length > 0 && selectedTemplates.length === 0) {
    selectedTemplates = suggestedTemplates;
  }

  onMount(() => {
    const tok = sessionStorage.getItem("atlasit_token");
    if (!tok) window.location.href = "/login";
  });

  function frameworkColor(key: string): string {
    const map: Record<string, string> = {
      SOC2: "bg-blue-100 text-blue-700",
      ISO27001: "bg-purple-100 text-purple-700",
      NIST_CSF: "bg-teal-100 text-teal-700",
      HIPAA: "bg-orange-100 text-orange-700",
      GDPR: "bg-pink-100 text-pink-700",
    };
    return map[key] ?? "bg-gray-100 text-gray-700";
  }
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="max-w-4xl mx-auto px-6 py-10">
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Welcome to AtlasIT</h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        A few quick questions and we'll set you up with real compliance scoring.
      </p>
    </div>

    <div class="mb-8 flex items-center justify-between">
      {#each STEPS as step, i}
        <div class="flex-1 flex items-center">
          <button
            type="button"
            on:click={() => i < currentIdx && goToStep(step.id)}
            disabled={i > currentIdx}
            class="flex flex-col items-center gap-1 {i <= currentIdx ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2
              {i < currentIdx ? 'bg-blue-600 border-blue-600 text-white'
                : i === currentIdx ? 'border-blue-600 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400'}">
              {i < currentIdx ? "✓" : i + 1}
            </div>
            <div class="text-xs font-medium hidden sm:block">{step.label}</div>
          </button>
          {#if i < STEPS.length - 1}
            <div class="flex-1 h-0.5 mx-1 {i < currentIdx ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}"></div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 sm:p-8">
      {#if currentStep === "company"}
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Tell us about your company</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">We'll use this to recommend frameworks and starter policies.</p>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="o-industry">Industry</label>
            <select id="o-industry" bind:value={industry} class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              <option value="">Select an industry</option>
              {#each INDUSTRIES as ind}<option value={ind}>{ind}</option>{/each}
            </select>
          </div>

          <div>
            <div class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company size</div>
            <div class="flex flex-wrap gap-2">
              {#each SIZES as s}
                <button
                  type="button"
                  on:click={() => (size = s)}
                  class="px-3 py-1.5 text-sm rounded-md border transition-colors
                    {size === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'}"
                >{s}</button>
              {/each}
            </div>
          </div>

          <div>
            <div class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Which best describes your goals?</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {#each USE_CASES as uc}
                <button
                  type="button"
                  on:click={() => toggleUseCase(uc.id)}
                  class="text-left p-3 rounded-md border transition-colors
                    {useCases.includes(uc.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-900 dark:text-blue-200'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'}"
                >
                  <div class="text-sm font-medium">{uc.label}</div>
                </button>
              {/each}
            </div>
          </div>
        </div>

      {:else if currentStep === "frameworks"}
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Choose your frameworks</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          We'll install these compliance packs and start scoring your evidence against their controls.
        </p>
        <div class="space-y-2">
          {#each FRAMEWORKS as fw}
            <button
              type="button"
              on:click={() => toggleFramework(fw.id)}
              class="w-full text-left p-4 rounded-md border transition-colors flex items-start gap-3
                {frameworks.includes(fw.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 hover:border-blue-400'}"
            >
              <div class="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                {frameworks.includes(fw.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-400 dark:border-gray-500'}">
                {#if frameworks.includes(fw.id)}<span class="text-white text-xs">✓</span>{/if}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="font-medium text-gray-900 dark:text-white">{fw.label}</div>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {frameworkColor(fw.frameworkKey)}">{fw.frameworkKey}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{fw.controlCount} controls</span>
                </div>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{fw.tagline}</p>
              </div>
            </button>
          {/each}
        </div>

      {:else if currentStep === "policies"}
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Seed starter policies</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          We'll create draft policies based on your chosen frameworks. You can edit before publishing.
          {suggestedTemplates.length} suggested based on your selection.
        </p>
        <div class="space-y-2 max-h-96 overflow-y-auto pr-1">
          {#each POLICY_TEMPLATES as tpl}
            {@const suggested = suggestedTemplates.includes(tpl.id)}
            <button
              type="button"
              on:click={() => toggleTemplate(tpl.id)}
              class="w-full text-left p-3 rounded-md border transition-colors flex items-start gap-3
                {selectedTemplates.includes(tpl.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:border-blue-400'}"
            >
              <div class="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                {selectedTemplates.includes(tpl.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-400 dark:border-gray-500'}">
                {#if selectedTemplates.includes(tpl.id)}<span class="text-white text-xs">✓</span>{/if}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="font-medium text-sm text-gray-900 dark:text-white">{tpl.name}</div>
                  {#if suggested}<span class="text-[10px] uppercase font-semibold bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded">Suggested</span>{/if}
                  {#each tpl.applicableFrameworks as fw}
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium {frameworkColor(fw)}">{fw}</span>
                  {/each}
                </div>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{tpl.tagline}</p>
              </div>
            </button>
          {/each}
        </div>

      {:else if currentStep === "team"}
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Invite your team</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Invite teammates who should have access. You can always invite more later from Settings → Users.
        </p>
        <div class="space-y-2">
          {#each invitees as inv, i}
            <div class="flex gap-2 items-start">
              <input type="email" bind:value={inv.email} placeholder="email@company.com"
                class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              <input type="text" bind:value={inv.displayName} placeholder="Full name"
                class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              <select bind:value={inv.role}
                class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <button type="button" on:click={() => removeInviteeRow(i)} class="px-3 py-2 text-gray-400 hover:text-red-600" title="Remove">×</button>
            </div>
          {/each}
          <button type="button" on:click={addInviteeRow} class="text-sm text-blue-600 dark:text-blue-400 hover:underline">+ Add another</button>
        </div>

      {:else if currentStep === "integration"}
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Connect your first app</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Adapters pull live evidence from your tools. Skip to connect later from the Apps page.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/console/apps" class="p-4 border border-gray-200 dark:border-gray-700 rounded-md hover:border-blue-400 transition-colors">
            <div class="font-medium text-gray-900 dark:text-white">Okta</div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Identity, MFA, access provisioning. Uses an API token.</p>
          </a>
          <a href="/console/apps" class="p-4 border border-gray-200 dark:border-gray-700 rounded-md hover:border-blue-400 transition-colors">
            <div class="font-medium text-gray-900 dark:text-white">GitHub</div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Branch protection, required reviews, signed commits. OAuth one-click.</p>
          </a>
        </div>
        <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">More coming: Google Workspace, Microsoft 365, Slack, AWS, Azure.</p>

      {:else if currentStep === "finish"}
        {#if !submitting && !provisioningDone && !provisioningError}
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Ready to go</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Here's what we'll set up:</p>
          <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li class="flex gap-2"><span class="text-blue-600">→</span>Save company profile: {industry || "—"}, {size || "—"}, {useCases.length} use case{useCases.length === 1 ? "" : "s"}</li>
            <li class="flex gap-2"><span class="text-blue-600">→</span>Install {frameworks.length} compliance pack{frameworks.length === 1 ? "" : "s"}</li>
            <li class="flex gap-2"><span class="text-blue-600">→</span>Create {selectedTemplates.length} starter polic{selectedTemplates.length === 1 ? "y" : "ies"} (drafts)</li>
            <li class="flex gap-2"><span class="text-blue-600">→</span>Invite {invitees.filter((i) => i.email.trim()).length} teammate{invitees.filter((i) => i.email.trim()).length === 1 ? "" : "s"}</li>
            <li class="flex gap-2"><span class="text-blue-600">→</span>Run initial evidence evaluation</li>
          </ul>
        {:else}
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Setting up your tenant</h2>
          <div class="space-y-1 font-mono text-xs max-h-80 overflow-y-auto">
            {#each provisioningLog as entry}
              <div class="flex gap-2">
                <span class="{entry.kind === 'ok' ? 'text-green-600 dark:text-green-400' : entry.kind === 'err' ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}">
                  {entry.kind === "ok" ? "✓" : entry.kind === "err" ? "✗" : "•"}
                </span>
                <span class="text-gray-700 dark:text-gray-300">{entry.msg}</span>
              </div>
            {/each}
          </div>
          {#if provisioningDone}
            <div class="mt-6 p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p class="text-sm text-green-800 dark:text-green-300">All set. Head to your dashboard.</p>
            </div>
          {:else if provisioningError}
            <div class="mt-6 p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p class="text-sm text-red-800 dark:text-red-300">Setup hit an error: {provisioningError}</p>
              <p class="mt-1 text-xs text-red-700 dark:text-red-400">Anything that succeeded above is saved — continue to the dashboard.</p>
            </div>
          {/if}
        {/if}
      {/if}

      <div class="mt-8 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-5">
        <button type="button" on:click={back} disabled={currentIdx === 0 || submitting}
          class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">← Back</button>
        <div class="flex gap-2">
          {#if canSkip && currentStep !== "finish"}
            <button type="button" on:click={next} disabled={submitting}
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Skip</button>
          {/if}
          {#if currentStep === "finish"}
            {#if provisioningDone}
              <a href="/console" class="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">Go to dashboard →</a>
            {:else if !submitting && !provisioningError}
              <button type="button" on:click={runProvisioning} class="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">Set everything up</button>
            {:else if provisioningError}
              <a href="/console" class="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">Continue anyway →</a>
            {/if}
          {:else}
            <button type="button" on:click={next} disabled={submitting || (currentStep === "frameworks" && frameworks.length === 0)}
              class="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50">Continue →</button>
          {/if}
        </div>
      </div>
    </div>

    <div class="mt-5 text-center">
      <a href="/console" class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Skip setup for now</a>
    </div>
  </div>
</div>
