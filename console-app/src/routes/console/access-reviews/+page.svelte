<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import DialogFooter from "$lib/components/ui/dialog-footer.svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { AlertTriangle, ArrowLeft, CheckCircle, XCircle, Clock, Users, ChevronRight } from "lucide-svelte";

  // ── Types ──────────────────────────────────────────────────────────────────

  interface Campaign {
    id: string;
    name: string;
    status: "active" | "completed" | "expired" | string;
    scope: string;
    totalItems: number;
    decidedItems: number;
    approvedItems: number;
    revokedItems: number;
    createdBy: string;
    dueDate: string | null;
    createdAt: string;
    completedAt: string | null;
  }

  interface ReviewItem {
    id: string;
    userId: string;
    userEmail: string;
    appId: string;
    role: string;
    status: "pending" | "decided" | string;
    decision: "approved" | "revoked" | null;
    decidedBy: string | null;
    decidedAt: string | null;
    notes: string | null;
  }

  // ── State: list view ───────────────────────────────────────────────────────

  let campaigns: Campaign[] = [];
  let loadingCampaigns = true;
  let campaignError: string | null = null;

  // ── State: detail view ────────────────────────────────────────────────────

  let selectedCampaign: Campaign | null = null;
  let reviewItems: ReviewItem[] = [];
  let loadingItems = false;
  let itemsError: string | null = null;

  // ── State: decision inline form ───────────────────────────────────────────

  let decidingItemId: string | null = null;
  let decisionNotes = "";
  let submittingDecision = false;

  // ── State: new campaign dialog ────────────────────────────────────────────

  let showNewDialog = false;
  let newName = "";
  let newDueDate = "";
  let newGracePeriodDays = "";
  let newScope: "all_apps" | "specific_app" = "all_apps";
  let creatingCampaign = false;

  // ── Derived ───────────────────────────────────────────────────────────────

  $: pendingItems = reviewItems.filter((i) => i.status === "pending");
  $: decidedItems = reviewItems.filter((i) => i.status !== "pending");

  $: progressPct = selectedCampaign
    ? selectedCampaign.totalItems > 0
      ? Math.round((selectedCampaign.decidedItems / selectedCampaign.totalItems) * 100)
      : 0
    : 0;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function statusVariant(status: string): "success" | "secondary" | "destructive" | "warning" {
    if (status === "completed") return "success";
    if (status === "active") return "default" as any;
    if (status === "expired") return "destructive";
    return "secondary";
  }

  function decisionVariant(decision: string | null): "success" | "destructive" | "secondary" {
    if (decision === "approved") return "success";
    if (decision === "revoked") return "destructive";
    return "secondary";
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function campaignProgress(c: Campaign): string {
    return `${c.decidedItems} / ${c.totalItems}`;
  }

  // ── API calls ─────────────────────────────────────────────────────────────

  async function loadCampaigns() {
    loadingCampaigns = true;
    campaignError = null;
    try {
      const res = await fetch("/api/access-reviews");
      if (!res.ok) throw new Error(`Failed to load campaigns (${res.status})`);
      const data = await res.json();
      campaigns = Array.isArray(data?.campaigns) ? data.campaigns : [];
    } catch (e: any) {
      campaignError = e?.message || "Failed to load campaigns";
      campaigns = [];
    } finally {
      loadingCampaigns = false;
    }
  }

  async function selectCampaign(campaign: Campaign) {
    selectedCampaign = campaign;
    decidingItemId = null;
    decisionNotes = "";
    reviewItems = [];
    itemsError = null;
    loadingItems = true;
    try {
      const res = await fetch(`/api/access-reviews/${campaign.id}/items`);
      if (!res.ok) throw new Error(`Failed to load items (${res.status})`);
      const data = await res.json();
      reviewItems = Array.isArray(data?.items) ? data.items : [];
    } catch (e: any) {
      itemsError = e?.message || "Failed to load review items";
      reviewItems = [];
    } finally {
      loadingItems = false;
    }
  }

  function backToList() {
    selectedCampaign = null;
    reviewItems = [];
    itemsError = null;
    decidingItemId = null;
    decisionNotes = "";
  }

  function startDecision(itemId: string) {
    decidingItemId = itemId;
    decisionNotes = "";
  }

  function cancelDecision() {
    decidingItemId = null;
    decisionNotes = "";
  }

  async function submitDecision(itemId: string, decision: "approved" | "revoked") {
    if (!selectedCampaign) return;
    submittingDecision = true;
    try {
      const res = await fetch(`/api/access-reviews/${selectedCampaign.id}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, decision, notes: decisionNotes || undefined }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Decision failed (${res.status})`);
      }
      pushToast({
        message: decision === "approved" ? "Access approved" : "Access revoked",
        variant: "success",
      });
      decidingItemId = null;
      decisionNotes = "";
      // Optimistic update: mark item as decided locally while re-fetching in background
      reviewItems = reviewItems.map((i) =>
        i.id === itemId ? { ...i, status: "decided", decision, decidedAt: new Date().toISOString() } : i
      );
      // Refresh full item list and campaign stats
      await selectCampaign(selectedCampaign);
      await loadCampaigns();
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to submit decision", variant: "error" });
    } finally {
      submittingDecision = false;
    }
  }

  async function createCampaign() {
    if (!newName.trim()) return;
    creatingCampaign = true;
    try {
      const body: Record<string, any> = { name: newName.trim(), scope: newScope };
      if (newDueDate) body.dueDate = newDueDate;
      if (newGracePeriodDays) body.gracePeriodDays = parseInt(newGracePeriodDays, 10);

      const res = await fetch("/api/access-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Failed to create campaign (${res.status})`);
      }
      pushToast({ message: "Campaign created successfully", variant: "success" });
      showNewDialog = false;
      newName = "";
      newDueDate = "";
      newGracePeriodDays = "";
      newScope = "all_apps";
      await loadCampaigns();
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to create campaign", variant: "error" });
    } finally {
      creatingCampaign = false;
    }
  }

  function openNewDialog() {
    newName = "";
    newDueDate = "";
    newGracePeriodDays = "";
    newScope = "all_apps";
    showNewDialog = true;
  }

  onMount(loadCampaigns);
</script>

<!-- ═══════════════════════════════════════════════════════════════════════════
     CAMPAIGN LIST VIEW
════════════════════════════════════════════════════════════════════════════ -->
{#if !selectedCampaign}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Access Reviews</h1>
        <p class="text-sm text-muted-foreground">
          Run periodic access certification campaigns to ensure least-privilege.
        </p>
      </div>
      <Button on:click={openNewDialog}>
        <Users class="h-4 w-4 mr-2" />
        New Campaign
      </Button>
    </div>

    <!-- Loading -->
    {#if loadingCampaigns}
      <div class="space-y-3">
        {#each [1, 2, 3] as _}
          <Skeleton class="h-20 rounded-lg" />
        {/each}
      </div>

    <!-- Error -->
    {:else if campaignError}
      <Alert variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <p class="pl-7">{campaignError}</p>
      </Alert>

    <!-- Empty state -->
    {:else if campaigns.length === 0}
      <Card class="border-dashed">
        <CardContent class="py-16 flex flex-col items-center gap-3 text-center">
          <Users class="h-12 w-12 text-muted-foreground opacity-40" />
          <p class="text-sm font-medium text-muted-foreground">No access review campaigns yet.</p>
          <p class="text-xs text-muted-foreground">Create a campaign to start certifying user access.</p>
          <Button variant="outline" size="sm" on:click={openNewDialog} class="mt-2">New Campaign</Button>
        </CardContent>
      </Card>

    <!-- Campaign list -->
    {:else}
      <Card>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-4 py-3 font-medium">Campaign</th>
                  <th class="px-4 py-3 font-medium">Status</th>
                  <th class="px-4 py-3 font-medium">Progress</th>
                  <th class="px-4 py-3 font-medium hidden sm:table-cell">Scope</th>
                  <th class="px-4 py-3 font-medium hidden md:table-cell">Due Date</th>
                  <th class="px-4 py-3 font-medium hidden lg:table-cell">Created By</th>
                  <th class="px-4 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {#each campaigns as campaign}
                  <tr
                    class="border-t hover:bg-muted/50 cursor-pointer transition-colors"
                    on:click={() => selectCampaign(campaign)}
                  >
                    <td class="px-4 py-3">
                      <div class="font-medium text-foreground">{campaign.name}</div>
                      <div class="text-xs text-muted-foreground mt-0.5">
                        Created {formatDate(campaign.createdAt)}
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <Badge variant={statusVariant(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex flex-col gap-1 min-w-[100px]">
                        <span class="text-xs text-muted-foreground">{campaignProgress(campaign)}</span>
                        <div class="w-full bg-muted rounded-full h-1.5">
                          <div
                            class="h-1.5 rounded-full transition-all {campaign.status === 'completed'
                              ? 'bg-success'
                              : 'bg-primary'}"
                            style="width: {campaign.totalItems > 0
                              ? Math.round((campaign.decidedItems / campaign.totalItems) * 100)
                              : 0}%"
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {campaign.scope ?? "—"}
                    </td>
                    <td class="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {#if campaign.dueDate}
                        <span class="{new Date(campaign.dueDate) < new Date() && campaign.status === 'active' ? 'text-destructive' : ''}">
                          {formatDate(campaign.dueDate)}
                        </span>
                      {:else}
                        —
                      {/if}
                    </td>
                    <td class="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                      {campaign.createdBy}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <ChevronRight class="h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    {/if}
  </div>

<!-- ═══════════════════════════════════════════════════════════════════════════
     CAMPAIGN DETAIL VIEW
════════════════════════════════════════════════════════════════════════════ -->
{:else}
  <div class="space-y-6">
    <!-- Back nav + header -->
    <div>
      <button
        type="button"
        class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        on:click={backToList}
      >
        <ArrowLeft class="h-4 w-4" />
        Back to Campaigns
      </button>

      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-2xl font-semibold tracking-tight">{selectedCampaign.name}</h1>
            <Badge variant={statusVariant(selectedCampaign.status)}>{selectedCampaign.status}</Badge>
          </div>
          <p class="text-sm text-muted-foreground">
            Scope: {selectedCampaign.scope ?? "all apps"}
            {#if selectedCampaign.dueDate}
              · Due {formatDate(selectedCampaign.dueDate)}
            {/if}
            · Created by {selectedCampaign.createdBy}
          </p>
        </div>

        <!-- Progress summary cards -->
        <div class="flex gap-3 flex-shrink-0">
          <div class="text-center px-4 py-2 rounded-lg bg-muted/60 border">
            <div class="text-lg font-bold">{selectedCampaign.totalItems}</div>
            <div class="text-xs text-muted-foreground">Total</div>
          </div>
          <div class="text-center px-4 py-2 rounded-lg bg-success/10 border border-success/20">
            <div class="text-lg font-bold text-success">{selectedCampaign.approvedItems}</div>
            <div class="text-xs text-muted-foreground">Approved</div>
          </div>
          <div class="text-center px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <div class="text-lg font-bold text-destructive">{selectedCampaign.revokedItems}</div>
            <div class="text-xs text-muted-foreground">Revoked</div>
          </div>
          <div class="text-center px-4 py-2 rounded-lg bg-muted/60 border">
            <div class="text-lg font-bold">{selectedCampaign.totalItems - selectedCampaign.decidedItems}</div>
            <div class="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>
      </div>

      <!-- Overall progress bar -->
      <div class="mt-4 space-y-1">
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>{selectedCampaign.decidedItems} of {selectedCampaign.totalItems} items decided</span>
          <span>{progressPct}%</span>
        </div>
        <div class="w-full bg-muted rounded-full h-2">
          <div
            class="h-2 rounded-full transition-all duration-500 {selectedCampaign.status === 'completed' ? 'bg-success' : 'bg-primary'}"
            style="width: {progressPct}%"
          ></div>
        </div>
      </div>
    </div>

    <!-- Items table -->
    {#if loadingItems}
      <div class="space-y-3">
        {#each [1, 2, 3, 4, 5] as _}
          <Skeleton class="h-14 rounded-lg" />
        {/each}
      </div>

    {:else if itemsError}
      <Alert variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <p class="pl-7">{itemsError}</p>
      </Alert>

    {:else if reviewItems.length === 0}
      <Card class="border-dashed">
        <CardContent class="py-12 text-center text-sm text-muted-foreground">
          No review items found for this campaign.
        </CardContent>
      </Card>

    {:else}
      <!-- Pending items -->
      {#if pendingItems.length > 0}
        <Card>
          <CardHeader>
            <CardTitle>
              <div class="flex items-center gap-2">
                <Clock class="h-4 w-4 text-warning" />
                Pending Review
                <Badge variant="secondary">{pendingItems.length}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                    <th class="px-4 py-3 font-medium">User</th>
                    <th class="px-4 py-3 font-medium">App</th>
                    <th class="px-4 py-3 font-medium">Role</th>
                    <th class="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each pendingItems as item}
                    <tr class="border-t hover:bg-muted/30 transition-colors">
                      <td class="px-4 py-3">
                        <div class="font-medium text-foreground">{item.userEmail}</div>
                        <div class="text-xs text-muted-foreground">{item.userId}</div>
                      </td>
                      <td class="px-4 py-3 text-muted-foreground">{item.appId}</td>
                      <td class="px-4 py-3">
                        <code class="text-xs bg-muted px-1.5 py-0.5 rounded">{item.role}</code>
                      </td>
                      <td class="px-4 py-3">
                        {#if decidingItemId === item.id}
                          <!-- Inline decision form -->
                          <div class="flex flex-col gap-2 max-w-sm">
                            <textarea
                              rows="2"
                              placeholder="Notes (optional)..."
                              bind:value={decisionNotes}
                              class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                            ></textarea>
                            <div class="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                disabled={submittingDecision}
                                on:click={() => submitDecision(item.id, "approved")}
                              >
                                <CheckCircle class="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={submittingDecision}
                                on:click={() => submitDecision(item.id, "revoked")}
                              >
                                <XCircle class="h-3.5 w-3.5 mr-1" />
                                Revoke
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={submittingDecision}
                                on:click={cancelDecision}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        {:else}
                          <div class="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={selectedCampaign.status !== "active"}
                              on:click={() => startDecision(item.id)}
                            >
                              Review
                            </Button>
                          </div>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- Decided items -->
      {#if decidedItems.length > 0}
        <Card>
          <CardHeader>
            <CardTitle>
              <div class="flex items-center gap-2">
                <CheckCircle class="h-4 w-4 text-success" />
                Decided
                <Badge variant="secondary">{decidedItems.length}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                    <th class="px-4 py-3 font-medium">User</th>
                    <th class="px-4 py-3 font-medium">App</th>
                    <th class="px-4 py-3 font-medium">Role</th>
                    <th class="px-4 py-3 font-medium">Decision</th>
                    <th class="px-4 py-3 font-medium hidden md:table-cell">Decided By</th>
                    <th class="px-4 py-3 font-medium hidden md:table-cell">Date</th>
                    <th class="px-4 py-3 font-medium hidden lg:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {#each decidedItems as item}
                    <tr class="border-t hover:bg-muted/30 transition-colors opacity-80">
                      <td class="px-4 py-3">
                        <div class="font-medium text-foreground">{item.userEmail}</div>
                        <div class="text-xs text-muted-foreground">{item.userId}</div>
                      </td>
                      <td class="px-4 py-3 text-muted-foreground">{item.appId}</td>
                      <td class="px-4 py-3">
                        <code class="text-xs bg-muted px-1.5 py-0.5 rounded">{item.role}</code>
                      </td>
                      <td class="px-4 py-3">
                        <Badge variant={decisionVariant(item.decision)}>
                          {item.decision ?? "—"}
                        </Badge>
                      </td>
                      <td class="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                        {item.decidedBy ?? "—"}
                      </td>
                      <td class="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                        {formatDate(item.decidedAt)}
                      </td>
                      <td class="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell max-w-[200px] truncate">
                        {item.notes ?? "—"}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      {/if}
    {/if}
  </div>
{/if}

<!-- ═══════════════════════════════════════════════════════════════════════════
     NEW CAMPAIGN DIALOG
════════════════════════════════════════════════════════════════════════════ -->
<Dialog
  open={showNewDialog}
  title="New Access Review Campaign"
  onClose={() => { showNewDialog = false; }}
>
  <form
    class="space-y-4"
    on:submit|preventDefault={createCampaign}
  >
    <div class="space-y-2">
      <Label htmlFor="campaign-name">Campaign Name <span class="text-destructive">*</span></Label>
      <Input
        id="campaign-name"
        type="text"
        bind:value={newName}
        placeholder="Q2 2026 Access Review"
        required
      />
    </div>

    <div class="space-y-2">
      <Label htmlFor="campaign-scope">Scope</Label>
      <select
        id="campaign-scope"
        bind:value={newScope}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="all_apps">All Applications</option>
        <option value="specific_app">Specific Application</option>
      </select>
    </div>

    <div class="space-y-2">
      <Label htmlFor="campaign-due">Due Date <span class="text-muted-foreground text-xs">(optional)</span></Label>
      <Input
        id="campaign-due"
        type="date"
        bind:value={newDueDate}
      />
    </div>

    <div class="space-y-2">
      <Label htmlFor="campaign-grace">Grace Period (days) <span class="text-muted-foreground text-xs">(optional)</span></Label>
      <Input
        id="campaign-grace"
        type="number"
        min="0"
        max="90"
        bind:value={newGracePeriodDays}
        placeholder="e.g. 7"
      />
    </div>

    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        disabled={creatingCampaign}
        on:click={() => { showNewDialog = false; }}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={creatingCampaign || !newName.trim()}
      >
        {creatingCampaign ? "Creating..." : "Create Campaign"}
      </Button>
    </DialogFooter>
  </form>
</Dialog>
