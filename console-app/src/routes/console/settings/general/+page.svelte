<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import { Building2, Save, ArrowLeft } from "lucide-svelte";

  interface TenantInfo {
    id: string;
    name: string;
    slug: string;
    ownerEmail: string;
    industry: string | null;
    size: string | null;
    status: string;
    tier: string;
    createdAt: string;
    logoUrl: string;
    accentColor: string;
    frameworks: string[];
  }

  const INDUSTRIES = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Retail",
    "Manufacturing",
    "Government",
    "Nonprofit",
    "Consulting",
    "Media",
    "Energy",
    "Transportation",
    "Other",
  ];

  const SIZES = [
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1001-5000",
    "5000+",
  ];

  const FRAMEWORKS = ["SOC2", "ISO27001", "NIST CSF", "HIPAA", "GDPR"];

  let info: TenantInfo | null = null;
  let loading = true;
  let saving = false;
  let error: string | null = null;

  // Form state
  let name = "";
  let industry = "";
  let size = "";
  let logoUrl = "";
  let accentColor = "";
  let frameworks: string[] = [];

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/tenant/settings");
      if (!res.ok) {
        error = `Failed to load settings (HTTP ${res.status})`;
        return;
      }
      const data = (await res.json()) as TenantInfo;
      info = data;
      name = data.name ?? "";
      industry = data.industry ?? "";
      size = data.size ?? "";
      logoUrl = data.logoUrl ?? "";
      accentColor = data.accentColor ?? "";
      frameworks = data.frameworks ?? [];
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function save() {
    saving = true;
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, industry, size, logoUrl, accentColor, frameworks }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        pushToast({ type: "error", message: (err as any).error ?? "Save failed" });
        return;
      }
      pushToast({ type: "success", message: "Settings saved" });
      await load();
    } catch (e) {
      pushToast({ type: "error", message: (e as Error).message });
    } finally {
      saving = false;
    }
  }

  function toggleFramework(fw: string) {
    if (frameworks.includes(fw)) {
      frameworks = frameworks.filter((f) => f !== fw);
    } else {
      frameworks = [...frameworks, fw];
    }
  }

  onMount(() => {
    load();
  });
</script>

<div class="animate-fade-in max-w-3xl mx-auto">
  <div class="mb-6">
    <a
      href="/console/settings"
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
    >
      <ArrowLeft class="w-4 h-4" />
      Back to Settings
    </a>
    <h1 class="text-2xl font-bold text-foreground flex items-center gap-2">
      <Building2 class="w-6 h-6 text-primary" />
      Tenant Info
    </h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Organization name, industry, company size, and compliance frameworks.
    </p>
  </div>

  {#if loading}
    <div class="space-y-4">
      {#each Array(3) as _}
        <div class="h-20 bg-muted rounded-lg animate-pulse"></div>
      {/each}
    </div>
  {:else if error}
    <div class="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
      <p class="text-destructive text-sm">{error}</p>
      <button
        on:click={load}
        class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md"
      >
        Retry
      </button>
    </div>
  {:else}
    <form on:submit|preventDefault={save} class="space-y-6">
      <!-- Organization Details -->
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-1.5">
            <Label for="name">Organization Name</Label>
            <Input
              id="name"
              type="text"
              bind:value={name}
              required
              placeholder="Acme Corp"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label for="industry">Industry</Label>
              <select
                id="industry"
                bind:value={industry}
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select industry...</option>
                {#each INDUSTRIES as ind}
                  <option value={ind}>{ind}</option>
                {/each}
              </select>
            </div>

            <div class="space-y-1.5">
              <Label for="size">Company Size</Label>
              <select
                id="size"
                bind:value={size}
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select size...</option>
                {#each SIZES as s}
                  <option value={s}>{s} employees</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              bind:value={logoUrl}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </CardContent>
      </Card>

      <!-- Compliance Frameworks -->
      <Card>
        <CardHeader>
          <CardTitle>Active Compliance Frameworks</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground mb-4">
            Select the frameworks your organization tracks. Controls will be updated accordingly.
          </p>
          <div class="flex flex-wrap gap-2">
            {#each FRAMEWORKS as fw}
              <button
                type="button"
                on:click={() => toggleFramework(fw)}
                class="px-4 py-2 rounded-full text-sm font-medium border transition-colors {frameworks.includes(fw)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground'}"
              >
                {fw}
              </button>
            {/each}
          </div>
        </CardContent>
      </Card>

      <!-- Account Info (read-only) -->
      {#if info}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Slug</span>
              <span class="font-mono text-foreground">{info.slug}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Owner Email</span>
              <span class="text-foreground">{info.ownerEmail}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Plan Tier</span>
              <span class="capitalize text-foreground">{info.tier}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Status</span>
              <span class="capitalize text-foreground">{info.status}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Created</span>
              <span class="text-foreground">{new Date(info.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      {/if}

      <div class="flex justify-end">
        <Button type="submit" disabled={saving} class="flex items-center gap-2">
          <Save class="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  {/if}
</div>
