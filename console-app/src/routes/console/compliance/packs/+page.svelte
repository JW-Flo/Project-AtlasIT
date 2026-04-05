<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { session, fetchSession } from "$lib/stores/session";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { Package, Plus, Download, Trash2, ShieldCheck, Search } from "lucide-svelte";

  interface CompliancePack {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    author: string;
    version: string;
    framework_id: string;
    controls_count: number;
    status: "draft" | "published" | "deprecated";
    is_builtin: boolean;
    installed: boolean;
  }

  let loading = true;
  let error: string | null = null;
  let packs: CompliancePack[] = [];
  let searchQuery = "";
  let frameworkFilter = "all";
  let showCreateForm = false;
  let creating = false;
  let togglingPackId: string | null = null;

  // Create form state
  let newName = "";
  let newSlug = "";
  let newDescription = "";
  let newFrameworkId = "";
  let createError: string | null = null;

  $: isAdmin =
    $session?.superAdmin ||
    $session?.roles?.includes("owner") ||
    $session?.roles?.includes("admin") ||
    false;

  $: frameworks = [...new Set(packs.map((p) => p.framework_id))].sort();

  $: filteredPacks = packs.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFramework =
      frameworkFilter === "all" || p.framework_id === frameworkFilter;
    return matchesSearch && matchesFramework;
  });

  $: installedCount = packs.filter((p) => p.installed).length;

  async function loadPacks() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/compliance-packs");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to load packs (${res.status})`);
      }
      const data = await res.json();
      packs = data.packs ?? [];
    } catch (e: any) {
      error = e.message ?? "Failed to load compliance packs";
    } finally {
      loading = false;
    }
  }

  async function installPack(pack: CompliancePack) {
    togglingPackId = pack.id;
    try {
      const res = await fetch("/api/compliance-packs/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Install failed");
      packs = packs.map((p) => (p.id === pack.id ? { ...p, installed: true } : p));
      pushToast({ type: "success", message: `"${pack.name}" installed successfully` });
    } catch (e: any) {
      pushToast({ type: "error", message: e.message ?? "Failed to install pack" });
    } finally {
      togglingPackId = null;
    }
  }

  async function uninstallPack(pack: CompliancePack) {
    togglingPackId = pack.id;
    try {
      const res = await fetch("/api/compliance-packs/install", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Uninstall failed");
      packs = packs.map((p) => (p.id === pack.id ? { ...p, installed: false } : p));
      pushToast({ type: "success", message: `"${pack.name}" uninstalled` });
    } catch (e: any) {
      pushToast({ type: "error", message: e.message ?? "Failed to uninstall pack" });
    } finally {
      togglingPackId = null;
    }
  }

  async function createPack() {
    createError = null;
    if (!newName.trim() || !newSlug.trim() || !newFrameworkId.trim()) {
      createError = "Name, slug, and framework are required";
      return;
    }
    creating = true;
    try {
      const res = await fetch("/api/compliance-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim(),
          description: newDescription.trim() || undefined,
          frameworkId: newFrameworkId.trim(),
          controls: [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      pushToast({ type: "success", message: `"${newName}" pack created` });
      resetCreateForm();
      await loadPacks();
    } catch (e: any) {
      createError = e.message ?? "Failed to create pack";
    } finally {
      creating = false;
    }
  }

  function resetCreateForm() {
    newName = "";
    newSlug = "";
    newDescription = "";
    newFrameworkId = "";
    createError = null;
    showCreateForm = false;
  }

  function slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
  }

  function handleNameInput() {
    if (!newSlug || newSlug === slugify(newName.slice(0, -1))) {
      newSlug = slugify(newName);
    }
  }

  onMount(async () => {
    await fetchSession();
    await loadPacks();
  });
</script>

<svelte:head>
  <title>Compliance Packs — AtlasIT</title>
</svelte:head>

<div class="space-y-6 p-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Compliance Packs</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Browse and install third-party compliance packs to extend your coverage.
        {#if installedCount > 0}
          <span class="font-medium">{installedCount} installed.</span>
        {/if}
      </p>
    </div>
    {#if isAdmin}
      <Button on:click={() => (showCreateForm = !showCreateForm)} variant="default">
        <Plus class="mr-2 h-4 w-4" />
        Create Pack
      </Button>
    {/if}
  </div>

  <!-- Create Pack Form -->
  {#if showCreateForm && isAdmin}
    <Card>
      <CardHeader>
        <CardTitle>New Compliance Pack</CardTitle>
      </CardHeader>
      <CardContent>
        {#if createError}
          <Alert variant="destructive" class="mb-4">{createError}</Alert>
        {/if}
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1">
            <Label for="pack-name">Name</Label>
            <Input
              id="pack-name"
              bind:value={newName}
              on:input={handleNameInput}
              placeholder="My Custom Pack"
            />
          </div>
          <div class="space-y-1">
            <Label for="pack-slug">Slug</Label>
            <Input
              id="pack-slug"
              bind:value={newSlug}
              placeholder="my-custom-pack"
            />
          </div>
          <div class="space-y-1">
            <Label for="pack-framework">Framework ID</Label>
            <Input
              id="pack-framework"
              bind:value={newFrameworkId}
              placeholder="SOC2, ISO27001, NIST-CSF…"
            />
          </div>
          <div class="space-y-1 sm:col-span-2">
            <Label for="pack-description">Description (optional)</Label>
            <Input
              id="pack-description"
              bind:value={newDescription}
              placeholder="Brief description of this pack"
            />
          </div>
        </div>
        <div class="mt-4 flex gap-2">
          <Button on:click={createPack} disabled={creating}>
            {#if creating}Creating…{:else}Create Pack{/if}
          </Button>
          <Button variant="outline" on:click={resetCreateForm} disabled={creating}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Filters -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
    <div class="relative flex-1">
      <Search class="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      <Input
        bind:value={searchQuery}
        placeholder="Search packs…"
        class="pl-9"
      />
    </div>
    <div class="flex gap-2">
      <select
        bind:value={frameworkFilter}
        class="border-input bg-background ring-offset-background focus:ring-ring h-9 rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        <option value="all">All frameworks</option>
        {#each frameworks as fw}
          <option value={fw}>{fw}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Pack Grid -->
  {#if loading}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each Array(6) as _}
        <Card>
          <CardHeader>
            <Skeleton class="h-5 w-2/3" />
          </CardHeader>
          <CardContent class="space-y-2">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-4/5" />
            <Skeleton class="mt-4 h-8 w-24" />
          </CardContent>
        </Card>
      {/each}
    </div>
  {:else if error}
    <Alert variant="destructive">{error}</Alert>
  {:else if filteredPacks.length === 0}
    <div class="text-muted-foreground flex flex-col items-center justify-center py-16 text-center">
      <Package class="mb-3 h-10 w-10 opacity-40" />
      <p class="text-base font-medium">No packs found</p>
      <p class="mt-1 text-sm">
        {#if searchQuery || frameworkFilter !== "all"}
          Try adjusting your search or filter.
        {:else}
          No compliance packs are available yet.
        {/if}
      </p>
    </div>
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each filteredPacks as pack (pack.id)}
        <Card class="flex flex-col">
          <CardHeader class="pb-2">
            <div class="flex items-start justify-between gap-2">
              <CardTitle class="text-base leading-tight">{pack.name}</CardTitle>
              <div class="flex shrink-0 flex-wrap gap-1">
                {#if pack.installed}
                  <Badge variant="success">Installed</Badge>
                {/if}
                {#if pack.is_builtin}
                  <Badge variant="secondary">Built-in</Badge>
                {/if}
                {#if pack.status === "deprecated"}
                  <Badge variant="destructive">Deprecated</Badge>
                {:else if pack.status === "draft"}
                  <Badge variant="outline">Draft</Badge>
                {/if}
              </div>
            </div>
          </CardHeader>
          <CardContent class="flex flex-1 flex-col justify-between gap-4">
            <div class="space-y-2">
              {#if pack.description}
                <p class="text-muted-foreground text-sm leading-relaxed">
                  {pack.description}
                </p>
              {/if}
              <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span class="flex items-center gap-1">
                  <ShieldCheck class="h-3.5 w-3.5" />
                  {pack.framework_id}
                </span>
                <span>{pack.controls_count} control{pack.controls_count !== 1 ? "s" : ""}</span>
                <span>v{pack.version}</span>
              </div>
              <p class="text-muted-foreground text-xs">
                By <span class="font-medium">{pack.author}</span>
              </p>
            </div>
            <div class="flex gap-2">
              {#if pack.installed}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={togglingPackId === pack.id}
                  on:click={() => uninstallPack(pack)}
                >
                  <Trash2 class="mr-1.5 h-3.5 w-3.5" />
                  {togglingPackId === pack.id ? "Removing…" : "Uninstall"}
                </Button>
              {:else}
                <Button
                  variant="default"
                  size="sm"
                  disabled={togglingPackId === pack.id || pack.status !== "published"}
                  on:click={() => installPack(pack)}
                >
                  <Download class="mr-1.5 h-3.5 w-3.5" />
                  {togglingPackId === pack.id ? "Installing…" : "Install"}
                </Button>
              {/if}
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>
