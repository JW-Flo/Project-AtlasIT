<script lang="ts">
  import { goto } from "$app/navigation";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { integrations, categories, iconMap } from "$lib/data/integrations";

  let step = 1;
  let loading = false;
  let error = "";

  // Step 1: Organization
  let orgName = "";
  let industry = "";
  let companySize = "";

  // Step 2: Owner account
  let ownerName = "";
  let ownerEmail = "";
  let ownerPassword = "";

  // Step 3: Compliance frameworks
  let frameworks: string[] = [];

  // Step 4: Directory / IdP
  let selectedIdp: 'okta' | 'google_workspace' | 'microsoft_365' | null = null;
  let selectedIdpDomain = '';

  // Step 5: Apps
  let selectedApps: string[] = [];
  let expandedCategories: Record<string, boolean> = {};

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Retail",
    "Manufacturing",
    "Education",
    "Government",
    "Other",
  ];

  const sizes = [
    "1-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201-1000 employees",
    "1000+ employees",
  ];

  const availableFrameworks = [
    { id: "SOC2", name: "SOC 2", desc: "Service organization controls for security, availability, and confidentiality" },
    { id: "ISO27001", name: "ISO 27001", desc: "International standard for information security management" },
    { id: "NIST CSF", name: "NIST CSF", desc: "Cybersecurity framework for managing and reducing risk" },
    { id: "HIPAA", name: "HIPAA", desc: "Health Insurance Portability and Accountability Act compliance" },
    { id: "GDPR", name: "GDPR", desc: "General Data Protection Regulation for EU data privacy" },
  ];

  // Group apps by category (exclude "all")
  const appCategories = categories.filter((c) => c.id !== "all");
  const appsByCategory: Record<string, typeof integrations> = {};
  for (const cat of appCategories) {
    appsByCategory[cat.id] = integrations.filter((i) => i.category === cat.id);
  }

  function toggleFramework(id: string) {
    if (frameworks.includes(id)) {
      frameworks = frameworks.filter((f) => f !== id);
    } else {
      frameworks = [...frameworks, id];
    }
  }

  function toggleApp(id: string) {
    if (selectedApps.includes(id)) {
      selectedApps = selectedApps.filter((a) => a !== id);
    } else {
      selectedApps = [...selectedApps, id];
    }
  }

  function toggleCategory(catId: string) {
    expandedCategories[catId] = !expandedCategories[catId];
    expandedCategories = expandedCategories;
  }

  function nextStep() {
    error = "";
    if (step === 1 && !orgName.trim()) { error = "Organization name is required"; return; }
    if (step === 1 && !industry) { error = "Please select an industry"; return; }
    if (step === 2 && !ownerEmail) { error = "Owner email is required"; return; }
    if (step === 2 && !ownerPassword) { error = "Password is required"; return; }
    if (step === 2 && ownerPassword.length < 8) { error = "Password must be at least 8 characters"; return; }
    if (step === 4 && selectedIdp === 'okta' && !selectedIdpDomain.trim()) { error = "Okta domain is required"; return; }
    if (step < 6) step++;
  }

  function prevStep() {
    error = "";
    if (step > 1) step--;
  }

  async function finish() {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orgName,
          industry,
          companySize,
          frameworks,
          selectedIdp,
          selectedIdpDomain,
          selectedApps,
          ownerName,
          ownerEmail,
          ownerPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        error = data.error || "Registration failed";
        loading = false;
        return;
      }

      // Auto-login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
      });

      if (loginRes.ok) {
        pushToast({ message: `Welcome to AtlasIT! ${data.orgName} is ready.`, variant: "success" });
        goto(selectedIdp ? "/console?setup=idp" : "/console");
      } else {
        pushToast({ message: "Organization created. Please sign in.", variant: "info" });
        goto("/console/login");
      }
    } catch (e: any) {
      error = e?.message || "Setup failed";
    }
    loading = false;
  }
</script>

<div class="min-h-screen flex items-center justify-center" style="background: var(--color-bg, #0f1923);">
  <div class="max-w-2xl w-full px-4 py-8">
    <div class="text-center mb-8">
      <div class="text-4xl font-bold mb-2" style="color: var(--color-accent, #3b82f6);">AtlasIT</div>
      <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.6;">Set up your organization in minutes</p>
    </div>

    <!-- Progress -->
    <div class="flex items-center justify-center gap-2 mb-8">
      {#each [1, 2, 3, 4, 5, 6] as s}
        <div
          class="h-2 rounded-full transition-all"
          style="width: {s <= step ? '40px' : '20px'}; background: {s <= step ? 'var(--color-accent, #3b82f6)' : 'rgba(255,255,255,0.1)'};"
        ></div>
      {/each}
    </div>

    <div class="rounded-lg p-8" style="background: var(--color-surface, #1a2332);">
      {#if step === 1}
        <h2 class="text-xl font-semibold mb-1" style="color: var(--color-text, #fff);">Organization Details</h2>
        <p class="text-sm mb-6" style="color: var(--color-text, #fff); opacity: 0.5;">Tell us about your organization</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Organization Name *</label>
            <input type="text" bind:value={orgName} placeholder="Acme Corp" class="w-full px-3 py-2 rounded text-sm" style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);" />
          </div>
          <div>
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Industry *</label>
            <select bind:value={industry} class="w-full px-3 py-2 rounded text-sm" style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);">
              <option value="">Select industry...</option>
              {#each industries as ind}
                <option value={ind}>{ind}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Company Size</label>
            <select bind:value={companySize} class="w-full px-3 py-2 rounded text-sm" style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);">
              <option value="">Select size...</option>
              {#each sizes as s}
                <option value={s}>{s}</option>
              {/each}
            </select>
          </div>
        </div>

      {:else if step === 2}
        <h2 class="text-xl font-semibold mb-1" style="color: var(--color-text, #fff);">Owner Account</h2>
        <p class="text-sm mb-6" style="color: var(--color-text, #fff); opacity: 0.5;">Create the organization owner account</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Full Name</label>
            <input type="text" bind:value={ownerName} placeholder="Jane Smith" class="w-full px-3 py-2 rounded text-sm" style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);" />
          </div>
          <div>
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Email *</label>
            <input type="email" bind:value={ownerEmail} placeholder="jane@acme.com" class="w-full px-3 py-2 rounded text-sm" style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);" />
          </div>
          <div>
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Password *</label>
            <input type="password" bind:value={ownerPassword} placeholder="Min 8 characters" class="w-full px-3 py-2 rounded text-sm" style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);" />
          </div>
        </div>

      {:else if step === 3}
        <h2 class="text-xl font-semibold mb-1" style="color: var(--color-text, #fff);">Compliance Frameworks</h2>
        <p class="text-sm mb-6" style="color: var(--color-text, #fff); opacity: 0.5;">Select the frameworks relevant to your organization</p>

        <div class="space-y-3">
          {#each availableFrameworks as fw}
            <button
              type="button"
              class="w-full text-left p-4 rounded-lg border transition-colors"
              style="background: {frameworks.includes(fw.id) ? 'rgba(59,130,246,0.1)' : 'var(--color-bg, #0f1923)'}; border-color: {frameworks.includes(fw.id) ? 'var(--color-accent, #3b82f6)' : 'var(--color-border, rgba(255,255,255,0.1))'};"
              on:click={() => toggleFramework(fw.id)}
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm font-medium" style="color: var(--color-text, #fff);">{fw.name}</div>
                  <div class="text-xs mt-0.5" style="color: var(--color-text, #fff); opacity: 0.5;">{fw.desc}</div>
                </div>
                <div class="w-5 h-5 rounded border flex items-center justify-center" style="border-color: {frameworks.includes(fw.id) ? 'var(--color-accent, #3b82f6)' : 'rgba(255,255,255,0.2)'}; background: {frameworks.includes(fw.id) ? 'var(--color-accent, #3b82f6)' : 'transparent'};">
                  {#if frameworks.includes(fw.id)}
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  {/if}
                </div>
              </div>
            </button>
          {/each}
        </div>

      {:else if step === 4}
        <h2 class="text-xl font-semibold mb-1" style="color: var(--color-text, #fff);">Connect Your Directory</h2>
        <p class="text-sm mb-6" style="color: var(--color-text, #fff); opacity: 0.5;">Choose your identity provider to sync users and groups</p>

        <div class="grid grid-cols-3 gap-4">
          <button
            class="p-5 rounded-lg border-2 text-left transition-all {selectedIdp === 'okta' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'}"
            on:click={() => selectedIdp = 'okta'}
          >
            <div class="text-lg font-semibold mb-1">Okta</div>
            <div class="text-sm text-white/60">SSO & directory with SCIM support</div>
          </button>

          <button
            class="p-5 rounded-lg border-2 text-left transition-all {selectedIdp === 'google_workspace' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'}"
            on:click={() => { selectedIdp = 'google_workspace'; selectedIdpDomain = ''; }}
          >
            <div class="text-lg font-semibold mb-1">Google Workspace</div>
            <div class="text-sm text-white/60">Sync users and groups from Google</div>
          </button>

          <button
            class="p-5 rounded-lg border-2 text-left transition-all {selectedIdp === 'microsoft_365' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'}"
            on:click={() => { selectedIdp = 'microsoft_365'; selectedIdpDomain = ''; }}
          >
            <div class="text-lg font-semibold mb-1">Microsoft 365 / Entra ID</div>
            <div class="text-sm text-white/60">Azure AD directory and SSO</div>
          </button>
        </div>

        {#if selectedIdp === 'okta'}
          <div class="mt-4">
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Okta Domain *</label>
            <input
              type="text"
              bind:value={selectedIdpDomain}
              placeholder="your-org.okta.com"
              class="w-full px-3 py-2 rounded text-sm"
              style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
            />
          </div>
        {/if}

        <div class="mt-4 text-center">
          <button
            type="button"
            class="text-sm text-white/40 hover:text-white/60 underline"
            on:click={() => { selectedIdp = null; selectedIdpDomain = ''; step++; }}
          >
            Skip for now
          </button>
        </div>

      {:else if step === 5}
        <h2 class="text-xl font-semibold mb-1" style="color: var(--color-text, #fff);">Select Your Apps</h2>
        <p class="text-sm mb-6" style="color: var(--color-text, #fff); opacity: 0.5;">Choose the apps your organization uses (optional)</p>

        <div class="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {#each appCategories as cat}
            {@const catApps = appsByCategory[cat.id] || []}
            {@const selectedInCat = catApps.filter((a) => selectedApps.includes(a.id)).length}
            <div>
              <button
                type="button"
                class="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors"
                style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1));"
                on:click={() => toggleCategory(cat.id)}
              >
                <div class="flex items-center gap-3">
                  <svg class="w-4 h-4" style="color: var(--color-accent, #3b82f6);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconMap[cat.id] || iconMap.productivity} />
                  </svg>
                  <span class="text-sm font-medium" style="color: var(--color-text, #fff);">{cat.label}</span>
                  {#if selectedInCat > 0}
                    <span class="text-[10px] px-1.5 py-0.5 rounded-full" style="background: rgba(59,130,246,0.2); color: var(--color-accent, #3b82f6);">{selectedInCat}</span>
                  {/if}
                </div>
                <svg class="w-4 h-4 transition-transform" class:rotate-180={expandedCategories[cat.id]} style="color: var(--color-text, #fff); opacity: 0.4;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {#if expandedCategories[cat.id]}
                <div class="grid grid-cols-2 gap-2 mt-2 ml-2">
                  {#each catApps as app}
                    <button
                      type="button"
                      class="text-left p-3 rounded-lg border transition-colors"
                      style="background: {selectedApps.includes(app.id) ? 'rgba(59,130,246,0.1)' : 'var(--color-bg, #0f1923)'}; border-color: {selectedApps.includes(app.id) ? 'var(--color-accent, #3b82f6)' : 'var(--color-border, rgba(255,255,255,0.1))'};"
                      on:click={() => toggleApp(app.id)}
                    >
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-medium" style="color: var(--color-text, #fff);">{app.name}</span>
                        <div class="w-4 h-4 rounded border flex items-center justify-center shrink-0" style="border-color: {selectedApps.includes(app.id) ? 'var(--color-accent, #3b82f6)' : 'rgba(255,255,255,0.2)'}; background: {selectedApps.includes(app.id) ? 'var(--color-accent, #3b82f6)' : 'transparent'};">
                          {#if selectedApps.includes(app.id)}
                            <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                          {/if}
                        </div>
                      </div>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>

        {#if selectedApps.length > 0}
          <div class="mt-4 text-xs" style="color: var(--color-text, #fff); opacity: 0.5;">
            {selectedApps.length} app{selectedApps.length !== 1 ? 's' : ''} selected
          </div>
        {/if}

      {:else}
        <h2 class="text-xl font-semibold mb-1" style="color: var(--color-text, #fff);">Review & Create</h2>
        <p class="text-sm mb-6" style="color: var(--color-text, #fff); opacity: 0.5;">Confirm your organization setup</p>

        <div class="space-y-4">
          <div class="rounded-lg p-4" style="background: var(--color-bg, #0f1923);">
            <div class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-text, #fff); opacity: 0.4;">Organization</div>
            <div class="text-sm" style="color: var(--color-text, #fff);">{orgName}</div>
            {#if industry}<div class="text-xs mt-1" style="color: var(--color-text, #fff); opacity: 0.5;">{industry} {companySize ? `- ${companySize}` : ''}</div>{/if}
          </div>
          <div class="rounded-lg p-4" style="background: var(--color-bg, #0f1923);">
            <div class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-text, #fff); opacity: 0.4;">Owner</div>
            <div class="text-sm" style="color: var(--color-text, #fff);">{ownerName || ownerEmail}</div>
            <div class="text-xs mt-1" style="color: var(--color-text, #fff); opacity: 0.5;">{ownerEmail}</div>
          </div>
          {#if frameworks.length > 0}
            <div class="rounded-lg p-4" style="background: var(--color-bg, #0f1923);">
              <div class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-text, #fff); opacity: 0.4;">Frameworks</div>
              <div class="flex flex-wrap gap-2">
                {#each frameworks as fw}
                  <span class="text-xs px-2 py-1 rounded" style="background: rgba(59,130,246,0.2); color: var(--color-accent, #3b82f6);">{fw}</span>
                {/each}
              </div>
            </div>
          {/if}
          {#if selectedIdp}
            <div class="rounded-lg p-4" style="background: var(--color-bg, #0f1923);">
              <div class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-text, #fff); opacity: 0.4;">Identity Provider</div>
              <div class="text-sm" style="color: var(--color-text, #fff);">
                {selectedIdp === 'okta' ? 'Okta' : selectedIdp === 'google_workspace' ? 'Google Workspace' : 'Microsoft 365 / Entra ID'}
              </div>
              {#if selectedIdp === 'okta' && selectedIdpDomain}
                <div class="text-xs mt-1" style="color: var(--color-text, #fff); opacity: 0.5;">{selectedIdpDomain}</div>
              {/if}
            </div>
          {/if}
          {#if selectedApps.length > 0}
            <div class="rounded-lg p-4" style="background: var(--color-bg, #0f1923);">
              <div class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-text, #fff); opacity: 0.4;">Apps</div>
              <div class="flex flex-wrap gap-2">
                {#each selectedApps as appId}
                  {@const app = integrations.find((i) => i.id === appId)}
                  <span class="text-xs px-2 py-1 rounded" style="background: rgba(34,197,94,0.2); color: #22c55e;">{app?.name || appId}</span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      {#if error}
        <div class="text-sm text-red-400 bg-red-900/20 rounded-lg p-3 mt-4">{error}</div>
      {/if}

      <div class="flex justify-between mt-8">
        {#if step > 1}
          <button type="button" on:click={prevStep} class="px-4 py-2 text-sm rounded-lg" style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);">
            Back
          </button>
        {:else}
          <a href="/console/login" class="px-4 py-2 text-sm rounded-lg" style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);">
            Sign In Instead
          </a>
        {/if}

        {#if step < 6}
          <button type="button" on:click={nextStep} class="px-6 py-2 text-sm font-medium rounded-lg text-white" style="background: var(--color-accent, #3b82f6);">
            {step === 4 ? (selectedIdp ? "Continue" : "Skip") : step === 5 ? (selectedApps.length > 0 ? "Continue" : "Skip") : "Continue"}
          </button>
        {:else}
          <button type="button" on:click={finish} disabled={loading} class="px-6 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50" style="background: var(--color-accent, #3b82f6);">
            {loading ? "Creating..." : "Create Organization"}
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>
