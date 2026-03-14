<script lang="ts">
  import { goto } from "$app/navigation";
  import { push as pushToast } from "$lib/components/feedback/toastStore";

  let step = 1;
  let loading = false;
  let error = "";

  // Step 1: Organization
  let orgName = "";
  let industry = "";
  let companySize = "";

  // Step 2: Admin user
  let adminName = "";
  let adminEmail = "";
  let adminPassword = "";

  // Step 3: Compliance frameworks
  let frameworks: string[] = [];

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

  function toggleFramework(id: string) {
    if (frameworks.includes(id)) {
      frameworks = frameworks.filter((f) => f !== id);
    } else {
      frameworks = [...frameworks, id];
    }
  }

  function nextStep() {
    error = "";
    if (step === 1 && !orgName) { error = "Organization name is required"; return; }
    if (step === 2 && (!adminEmail || !adminPassword)) { error = "Email and password are required"; return; }
    if (step === 2 && adminPassword.length < 8) { error = "Password must be at least 8 characters"; return; }
    if (step < 4) step++;
  }

  function prevStep() {
    error = "";
    if (step > 1) step--;
  }

  async function finish() {
    loading = true;
    error = "";
    try {
      // Register user + create tenant
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          displayName: adminName,
          orgName,
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) {
        error = regData.error || "Registration failed";
        loading = false;
        return;
      }

      // Save tenant preferences
      try {
        await fetch("/api/tenants/preferences", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            tenantId: regData.tenantId,
            industry,
            companySize,
            frameworks,
          }),
        });
      } catch {
        // Non-critical, continue
      }

      // Auto-login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      if (loginRes.ok) {
        pushToast({ message: "Welcome to AtlasIT!", variant: "success" });
        goto("/console");
      } else {
        pushToast({ message: "Account created. Please sign in.", variant: "info" });
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
      {#each [1, 2, 3, 4] as s}
        <div
          class="h-2 rounded-full transition-all"
          style="width: {s <= step ? '48px' : '24px'}; background: {s <= step ? 'var(--color-accent, #3b82f6)' : 'rgba(255,255,255,0.1)'};"
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
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Industry</label>
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
        <h2 class="text-xl font-semibold mb-1" style="color: var(--color-text, #fff);">Admin Account</h2>
        <p class="text-sm mb-6" style="color: var(--color-text, #fff); opacity: 0.5;">Create your administrator account</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Full Name</label>
            <input type="text" bind:value={adminName} placeholder="Jane Smith" class="w-full px-3 py-2 rounded text-sm" style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);" />
          </div>
          <div>
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Email *</label>
            <input type="email" bind:value={adminEmail} placeholder="jane@acme.com" class="w-full px-3 py-2 rounded text-sm" style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);" />
          </div>
          <div>
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Password *</label>
            <input type="password" bind:value={adminPassword} placeholder="Min 8 characters" class="w-full px-3 py-2 rounded text-sm" style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);" />
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

      {:else}
        <h2 class="text-xl font-semibold mb-1" style="color: var(--color-text, #fff);">Review & Create</h2>
        <p class="text-sm mb-6" style="color: var(--color-text, #fff); opacity: 0.5;">Confirm your setup details</p>

        <div class="space-y-4">
          <div class="rounded-lg p-4" style="background: var(--color-bg, #0f1923);">
            <div class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-text, #fff); opacity: 0.4;">Organization</div>
            <div class="text-sm" style="color: var(--color-text, #fff);">{orgName}</div>
            {#if industry}<div class="text-xs mt-1" style="color: var(--color-text, #fff); opacity: 0.5;">{industry} {companySize ? `- ${companySize}` : ''}</div>{/if}
          </div>
          <div class="rounded-lg p-4" style="background: var(--color-bg, #0f1923);">
            <div class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-text, #fff); opacity: 0.4;">Admin</div>
            <div class="text-sm" style="color: var(--color-text, #fff);">{adminName || adminEmail}</div>
            <div class="text-xs mt-1" style="color: var(--color-text, #fff); opacity: 0.5;">{adminEmail}</div>
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

        {#if step < 4}
          <button type="button" on:click={nextStep} class="px-6 py-2 text-sm font-medium rounded-lg text-white" style="background: var(--color-accent, #3b82f6);">
            Continue
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
