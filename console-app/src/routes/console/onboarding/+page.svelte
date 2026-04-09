<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { integrations, categories, iconMap } from "$lib/data/integrations";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { AlertTriangle, ArrowRight, ArrowLeft, Check, ChevronDown, Zap, Clock } from "lucide-svelte";

  // Read plan from URL query (from pricing page)
  $: selectedPlan = $page.url.searchParams.get("plan") || "free";
  $: selectedCycle = $page.url.searchParams.get("cycle") || "monthly";

  let step = 1;
  let loading = false;
  let error = "";

  // Post-creation narration state (step 7)
  let narrationPhase = 0;
  let narrationScore = 0;
  let narrationEvidenceCount = 0;
  let narrationControlsCount = 0;

  const NARRATION_STEPS = [
    { label: "Creating organization...", icon: "org" },
    { label: "Syncing directory users...", icon: "users" },
    { label: "Classifying compliance evidence...", icon: "evidence" },
    { label: "Scoring controls across frameworks...", icon: "score" },
    { label: "Your compliance posture is ready!", icon: "done" },
  ];

  async function runNarration() {
    for (let i = 0; i < NARRATION_STEPS.length; i++) {
      narrationPhase = i;
      await new Promise((r) => setTimeout(r, i === 0 ? 800 : 1200));

      if (i === 2) {
        // Simulate evidence count climbing
        for (let e = 0; e < 12; e++) {
          narrationEvidenceCount = e + 1;
          narrationControlsCount = Math.min(e + 1, 8);
          await new Promise((r) => setTimeout(r, 80));
        }
      }
      if (i === 3) {
        // Simulate score climbing
        const targetScore = frameworks.length >= 3 ? 35 : frameworks.length >= 1 ? 25 : 15;
        for (let s = 0; s <= targetScore; s += 5) {
          narrationScore = s;
          await new Promise((r) => setTimeout(r, 100));
        }
        narrationScore = targetScore;
      }
    }
  }

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
          plan: selectedPlan,
          billingCycle: selectedCycle,
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
        // Show narration before redirecting
        step = 7;
        loading = false;
        await runNarration();
        pushToast({ message: `Welcome to AtlasIT! ${data.orgName} is ready.`, variant: "success" });
        await new Promise((r) => setTimeout(r, 1500));

        // If a paid plan was selected, redirect to checkout
        if (selectedPlan !== "free" && selectedPlan !== "enterprise") {
          try {
            const checkoutRes = await fetch("/api/billing/checkout", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ plan: selectedPlan, cycle: selectedCycle }),
            });
            const checkoutData = await checkoutRes.json();
            if (checkoutData.url) {
              window.location.href = checkoutData.url;
              return;
            }
          } catch {
            // Fall through to dashboard if checkout fails
          }
        }

        goto(selectedIdp ? "/console?setup=idp" : "/console");
        return;
      } else {
        // L-6 FIX: Retry login once, then redirect to dashboard (session may already exist)
        pushToast({ message: "Organization created. Redirecting...", variant: "info" });
        goto("/console");
      }
    } catch (e: any) {
      error = e?.message || "Setup failed";
    }
    loading = false;
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-background">
  <div class="max-w-2xl w-full px-4 py-8">
    <div class="text-center mb-8">
      <div class="text-4xl font-bold mb-2 text-primary">AtlasIT</div>
      <p class="text-sm text-muted-foreground">Set up your organization in minutes</p>
      <div class="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
        <Clock class="w-3.5 h-3.5" />
        <span>Connect your first app and see your compliance score in under 10 minutes</span>
      </div>
      {#if selectedPlan !== "free"}
        <div class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Zap class="w-3.5 h-3.5" />
          {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan selected
          {#if selectedPlan !== "enterprise"}&middot; 14-day free trial{/if}
        </div>
      {/if}
    </div>

    <!-- Progress -->
    {#if step <= 6}
      <div class="flex items-center justify-center gap-2 mb-8">
        {#each [1, 2, 3, 4, 5, 6] as s}
          <div
            class="h-2 rounded-full transition-all {s <= step ? 'bg-primary' : 'bg-muted'}"
            style="width: {s <= step ? '40px' : '20px'};"
          ></div>
        {/each}
      </div>
    {/if}

    <Card>
      <CardContent class="pt-8 pb-8 px-8">
        {#if step === 1}
          <h2 class="text-xl font-semibold mb-1">Organization Details</h2>
          <p class="text-sm text-muted-foreground mb-6">Tell us about your organization</p>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <Label>Organization Name *</Label>
              <Input type="text" bind:value={orgName} placeholder="Acme Corp" />
            </div>
            <div class="space-y-1.5">
              <Label>Industry *</Label>
              <select bind:value={industry} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Select industry...</option>
                {#each industries as ind}
                  <option value={ind}>{ind}</option>
                {/each}
              </select>
            </div>
            <div class="space-y-1.5">
              <Label>Company Size</Label>
              <select bind:value={companySize} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Select size...</option>
                {#each sizes as s}
                  <option value={s}>{s}</option>
                {/each}
              </select>
            </div>
          </div>

        {:else if step === 2}
          <h2 class="text-xl font-semibold mb-1">Owner Account</h2>
          <p class="text-sm text-muted-foreground mb-6">Create the organization owner account</p>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <Label>Full Name</Label>
              <Input type="text" bind:value={ownerName} placeholder="Jane Smith" />
            </div>
            <div class="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" bind:value={ownerEmail} placeholder="jane@acme.com" />
            </div>
            <div class="space-y-1.5">
              <Label>Password *</Label>
              <Input type="password" bind:value={ownerPassword} placeholder="Min 8 characters" />
            </div>
          </div>

        {:else if step === 3}
          <h2 class="text-xl font-semibold mb-1">Compliance Frameworks</h2>
          <p class="text-sm text-muted-foreground mb-6">Select the frameworks relevant to your organization</p>

          <div class="space-y-3">
            {#each availableFrameworks as fw}
              <button
                type="button"
                class="w-full text-left p-4 rounded-lg border transition-colors {frameworks.includes(fw.id)
                  ? 'bg-primary/5 border-primary'
                  : 'bg-muted border-transparent hover:border-border'}"
                on:click={() => toggleFramework(fw.id)}
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm font-medium">{fw.name}</div>
                    <div class="text-xs text-muted-foreground mt-0.5">{fw.desc}</div>
                  </div>
                  <div class="w-5 h-5 rounded border flex items-center justify-center shrink-0 {frameworks.includes(fw.id) ? 'bg-primary border-primary' : 'border-border'}">
                    {#if frameworks.includes(fw.id)}
                      <Check class="w-3 h-3 text-primary-foreground" />
                    {/if}
                  </div>
                </div>
              </button>
            {/each}
          </div>

        {:else if step === 4}
          <h2 class="text-xl font-semibold mb-1">Connect Your Directory</h2>
          <p class="text-sm text-muted-foreground mb-6">Choose your identity provider to sync users and groups</p>

          <div class="grid grid-cols-3 gap-4">
            <button
              class="p-5 rounded-lg border-2 text-left transition-all {selectedIdp === 'okta' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
              on:click={() => selectedIdp = 'okta'}
            >
              <div class="text-lg font-semibold mb-1">Okta</div>
              <div class="text-sm text-muted-foreground">SSO & directory with SCIM support</div>
            </button>

            <button
              class="p-5 rounded-lg border-2 text-left transition-all {selectedIdp === 'google_workspace' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
              on:click={() => { selectedIdp = 'google_workspace'; selectedIdpDomain = ''; }}
            >
              <div class="text-lg font-semibold mb-1">Google Workspace</div>
              <div class="text-sm text-muted-foreground">Sync users and groups from Google</div>
            </button>

            <button
              class="p-5 rounded-lg border-2 text-left transition-all {selectedIdp === 'microsoft_365' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
              on:click={() => { selectedIdp = 'microsoft_365'; selectedIdpDomain = ''; }}
            >
              <div class="text-lg font-semibold mb-1">Microsoft 365 / Entra ID</div>
              <div class="text-sm text-muted-foreground">Azure AD directory and SSO</div>
            </button>
          </div>

          {#if selectedIdp === 'okta'}
            <div class="mt-4 space-y-1.5">
              <Label>Okta Domain *</Label>
              <Input type="text" bind:value={selectedIdpDomain} placeholder="your-org.okta.com" />
            </div>
          {/if}

          <div class="mt-4 text-center">
            <button
              type="button"
              class="text-sm text-muted-foreground hover:text-foreground underline"
              on:click={() => { selectedIdp = null; selectedIdpDomain = ''; step++; }}
            >
              Skip for now
            </button>
          </div>

        {:else if step === 5}
          <h2 class="text-xl font-semibold mb-1">Select Your Apps</h2>
          <p class="text-sm text-muted-foreground mb-6">Choose the apps your organization uses (optional)</p>

          <div class="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {#each appCategories as cat}
              {@const catApps = appsByCategory[cat.id] || []}
              {@const selectedInCat = catApps.filter((a) => selectedApps.includes(a.id)).length}
              <div>
                <button
                  type="button"
                  class="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors bg-muted border border-transparent hover:border-border"
                  on:click={() => toggleCategory(cat.id)}
                >
                  <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconMap[cat.id] || iconMap.productivity} />
                    </svg>
                    <span class="text-sm font-medium">{cat.label}</span>
                    {#if selectedInCat > 0}
                      <Badge variant="secondary">{selectedInCat}</Badge>
                    {/if}
                  </div>
                  <ChevronDown class="w-4 h-4 text-muted-foreground transition-transform {expandedCategories[cat.id] ? 'rotate-180' : ''}" />
                </button>
                {#if expandedCategories[cat.id]}
                  <div class="grid grid-cols-2 gap-2 mt-2 ml-2">
                    {#each catApps as app}
                      <button
                        type="button"
                        class="text-left p-3 rounded-lg border transition-colors {selectedApps.includes(app.id)
                          ? 'bg-primary/5 border-primary'
                          : 'bg-muted border-transparent hover:border-border'}"
                        on:click={() => toggleApp(app.id)}
                      >
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-medium">{app.name}</span>
                          <div class="w-4 h-4 rounded border flex items-center justify-center shrink-0 {selectedApps.includes(app.id) ? 'bg-primary border-primary' : 'border-border'}">
                            {#if selectedApps.includes(app.id)}
                              <Check class="w-2.5 h-2.5 text-primary-foreground" />
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
            <div class="mt-4 text-xs text-muted-foreground">
              {selectedApps.length} app{selectedApps.length !== 1 ? 's' : ''} selected
            </div>
          {/if}

        {:else}
          <h2 class="text-xl font-semibold mb-1">Review & Create</h2>
          <p class="text-sm text-muted-foreground mb-6">Confirm your organization setup</p>

          <div class="space-y-4">
            <div class="rounded-lg p-4 bg-muted">
              <div class="text-xs uppercase tracking-wider text-muted-foreground mb-2">Organization</div>
              <div class="text-sm font-medium">{orgName}</div>
              {#if industry}<div class="text-xs text-muted-foreground mt-1">{industry} {companySize ? `- ${companySize}` : ''}</div>{/if}
            </div>
            <div class="rounded-lg p-4 bg-muted">
              <div class="text-xs uppercase tracking-wider text-muted-foreground mb-2">Owner</div>
              <div class="text-sm font-medium">{ownerName || ownerEmail}</div>
              <div class="text-xs text-muted-foreground mt-1">{ownerEmail}</div>
            </div>
            {#if frameworks.length > 0}
              <div class="rounded-lg p-4 bg-muted">
                <div class="text-xs uppercase tracking-wider text-muted-foreground mb-2">Frameworks</div>
                <div class="flex flex-wrap gap-2">
                  {#each frameworks as fw}
                    <Badge variant="secondary">{fw}</Badge>
                  {/each}
                </div>
              </div>
            {/if}
            {#if selectedIdp}
              <div class="rounded-lg p-4 bg-muted">
                <div class="text-xs uppercase tracking-wider text-muted-foreground mb-2">Identity Provider</div>
                <div class="text-sm font-medium">
                  {selectedIdp === 'okta' ? 'Okta' : selectedIdp === 'google_workspace' ? 'Google Workspace' : 'Microsoft 365 / Entra ID'}
                </div>
                {#if selectedIdp === 'okta' && selectedIdpDomain}
                  <div class="text-xs text-muted-foreground mt-1">{selectedIdpDomain}</div>
                {/if}
              </div>
            {/if}
            {#if selectedApps.length > 0}
              <div class="rounded-lg p-4 bg-muted">
                <div class="text-xs uppercase tracking-wider text-muted-foreground mb-2">Apps</div>
                <div class="flex flex-wrap gap-2">
                  {#each selectedApps as appId}
                    {@const app = integrations.find((i) => i.id === appId)}
                    <Badge variant="success">{app?.name || appId}</Badge>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}

        {#if step === 7}
          <div class="text-center py-4 space-y-6">
            <h2 class="text-xl font-semibold">Setting up your compliance engine</h2>
            <div class="space-y-3">
              {#each NARRATION_STEPS as ns, i}
                <div class="flex items-center gap-3 {i <= narrationPhase ? 'opacity-100' : 'opacity-30'} transition-opacity">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 {i < narrationPhase ? 'bg-green-500 text-white' : i === narrationPhase ? 'bg-primary text-white' : 'bg-muted'}">
                    {#if i < narrationPhase}
                      <Check class="w-3.5 h-3.5" />
                    {:else if i === narrationPhase}
                      <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    {:else}
                      <span class="text-[10px]">{i + 1}</span>
                    {/if}
                  </div>
                  <span class="text-sm">{ns.label}</span>
                </div>
              {/each}
            </div>

            {#if narrationPhase >= 2}
              <div class="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div class="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div class="text-2xl font-bold text-primary">{narrationEvidenceCount}</div>
                    <div class="text-xs text-muted-foreground">Evidence Items</div>
                  </div>
                  <div>
                    <div class="text-2xl font-bold text-primary">{narrationControlsCount}</div>
                    <div class="text-xs text-muted-foreground">Controls Covered</div>
                  </div>
                  <div>
                    <div class="text-2xl font-bold {narrationScore >= 25 ? 'text-green-500' : 'text-primary'}">{narrationScore}%</div>
                    <div class="text-xs text-muted-foreground">Compliance Score</div>
                  </div>
                </div>
                {#if narrationScore > 0}
                  <div class="h-2 rounded-full bg-muted overflow-hidden">
                    <div class="h-full bg-green-500 rounded-full transition-all" style="width: {narrationScore}%"></div>
                  </div>
                {/if}
              </div>
            {/if}

            {#if narrationPhase >= 4}
              <p class="text-sm text-muted-foreground">Your first compliance evidence was collected automatically. Redirecting to dashboard...</p>
            {/if}
          </div>

        {:else if error}
          <Alert variant="destructive" class="mt-4">
            <AlertTriangle class="h-4 w-4" />
            <p class="pl-7">{error}</p>
          </Alert>
        {/if}

        <div class="flex justify-between mt-8">
          {#if step > 1}
            <Button variant="outline" on:click={prevStep}>
              <ArrowLeft class="h-4 w-4 mr-1.5" />
              Back
            </Button>
          {:else}
            <a href="/console/login">
              <Button variant="outline">Sign In Instead</Button>
            </a>
          {/if}

          {#if step < 6}
            <Button on:click={nextStep}>
              {step === 4 ? (selectedIdp ? "Continue" : "Skip") : step === 5 ? (selectedApps.length > 0 ? "Continue" : "Skip") : "Continue"}
              <ArrowRight class="h-4 w-4 ml-1.5" />
            </Button>
          {:else}
            <Button on:click={finish} disabled={loading}>
              {loading ? "Creating..." : "Create Organization"}
            </Button>
          {/if}
        </div>
      </CardContent>
    </Card>
  </div>
</div>
