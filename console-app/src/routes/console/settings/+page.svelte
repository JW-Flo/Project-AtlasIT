<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { refreshComplianceScore } from "$lib/stores/compliance";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { AlertTriangle, Save, ShieldCheck } from "lucide-svelte";

  const availableFrameworks = [
    { id: "SOC2", name: "SOC 2", desc: "Service Organization Controls" },
    { id: "ISO27001", name: "ISO 27001", desc: "Information Security Management" },
    { id: "NIST CSF", name: "NIST CSF", desc: "Cybersecurity Framework" },
    { id: "HIPAA", name: "HIPAA", desc: "Health Insurance Portability" },
    { id: "GDPR", name: "GDPR", desc: "General Data Protection Regulation" },
  ];

  const settingsTabs = [
    { href: "/console/settings", label: "General" },
    { href: "/console/settings/users", label: "Users" },
    { href: "/console/settings/audit-log", label: "Audit Log" },
    { href: "/console/settings/billing", label: "Billing" },
    { href: "/console/settings/trust", label: "Trust Center" },
    { href: "/console/settings/incidents", label: "Incidents" },
    { href: "/console/settings/security", label: "Security" },
  ];
  $: current = $page.url.pathname;

  let loading = true;
  let error = "";
  let saving = false;

  let name = "";
  let industry = "";
  let size = "";
  let logoUrl = "";
  let accentColor = "";
  let selectedFrameworks: string[] = [];

  const sizeOptions = ["1-10", "11-50", "51-200", "201-500", "500+"];

  async function loadSettings() {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/tenant/settings");
      if (!res.ok) throw new Error(`Failed to load settings (${res.status})`);
      const data: { name?: string; industry?: string; size?: string; logoUrl?: string; accentColor?: string; frameworks?: string[] } = await res.json();
      name = data.name || "";
      industry = data.industry || "";
      size = data.size || "";
      logoUrl = data.logoUrl || "";
      accentColor = data.accentColor || "";
      selectedFrameworks = data.frameworks || [];
    } catch (e: any) {
      error = e?.message || "Failed to load settings";
    } finally {
      loading = false;
    }
  }

  async function saveSettings() {
    saving = true;
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, industry, size, logoUrl, accentColor, frameworks: selectedFrameworks }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      pushToast({ message: "Settings saved", variant: "success" });
      // Refresh compliance scores so sidebar tooltip reflects updated frameworks
      refreshComplianceScore();
      // Signal AppFrame with the saved branding values directly
      window.dispatchEvent(new CustomEvent("branding-updated", {
        detail: { logoUrl, accentColor },
      }));
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to save settings", variant: "error" });
    } finally {
      saving = false;
    }
  }

  onMount(loadSettings);
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-semibold tracking-tight">Organization Settings</h1>

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
    <div class="space-y-4">
      {#each [1, 2, 3] as _}
        <Skeleton class="h-12 rounded-lg" />
      {/each}
    </div>
  {:else}
    <Card>
      <CardContent class="pt-6 space-y-5">
        <div class="space-y-2">
          <Label htmlFor="org-name">Organization Name</Label>
          <Input id="org-name" bind:value={name} />
        </div>

        <div class="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" bind:value={industry} />
        </div>

        <div class="space-y-2">
          <Label htmlFor="company-size">Company Size</Label>
          <select
            id="company-size"
            bind:value={size}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select size...</option>
            {#each sizeOptions as opt}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
        </div>

        <div class="pt-2">
          <Button on:click={saveSettings} disabled={saving}>
            <Save class="h-4 w-4 mr-1.5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
      </CardHeader>
      <CardContent class="space-y-5">
        <div class="space-y-2">
          <Label htmlFor="logo-url">Logo URL</Label>
          <Input id="logo-url" bind:value={logoUrl} placeholder="https://example.com/logo.png" />
          <p class="text-xs text-muted-foreground">Displayed in the sidebar and Trust Center. Use a square image for best results.</p>
        </div>

        {#if logoUrl}
          <div class="flex items-center gap-3">
            <img src={logoUrl} alt="Logo preview" class="h-10 w-10 rounded-lg object-cover border" />
            <span class="text-sm text-muted-foreground">Preview</span>
          </div>
        {/if}

        <div class="space-y-2">
          <Label htmlFor="accent-color">Accent Color</Label>
          <div class="flex items-center gap-3">
            <input
              id="accent-color"
              type="color"
              bind:value={accentColor}
              class="h-10 w-10 rounded-md border border-input cursor-pointer"
            />
            <Input bind:value={accentColor} placeholder="#3b82f6" class="max-w-[160px]" />
          </div>
          <p class="text-xs text-muted-foreground">Used for the sidebar brand icon when no logo is set.</p>
        </div>

        <div class="pt-2">
          <Button on:click={saveSettings} disabled={saving}>
            <Save class="h-4 w-4 mr-1.5" />
            {saving ? "Saving..." : "Save Branding"}
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <ShieldCheck class="h-5 w-5" />
          Compliance Frameworks
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Select the compliance frameworks relevant to your organization. The Compliance Manager will only show controls and scores for your selected frameworks.
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          {#each availableFrameworks as fw}
            <label
              class="flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors {selectedFrameworks.includes(fw.id) ? 'border-primary bg-primary/5' : 'hover:bg-accent'}"
            >
              <input
                type="checkbox"
                checked={selectedFrameworks.includes(fw.id)}
                on:change={() => {
                  if (selectedFrameworks.includes(fw.id)) {
                    selectedFrameworks = selectedFrameworks.filter((f) => f !== fw.id);
                  } else {
                    selectedFrameworks = [...selectedFrameworks, fw.id];
                  }
                }}
                class="mt-0.5 h-4 w-4 rounded border-input"
              />
              <div>
                <div class="font-medium text-sm">{fw.name}</div>
                <div class="text-xs text-muted-foreground">{fw.desc}</div>
              </div>
            </label>
          {/each}
        </div>

        {#if selectedFrameworks.length === 0}
          <Alert variant="destructive">
            <AlertTriangle class="h-4 w-4" />
            <p class="pl-7">Select at least one framework. Without a selection, defaults (SOC 2, ISO 27001, NIST CSF) will be used.</p>
          </Alert>
        {/if}

        <div class="pt-2">
          <Button on:click={saveSettings} disabled={saving}>
            <Save class="h-4 w-4 mr-1.5" />
            {saving ? "Saving..." : "Save Frameworks"}
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
