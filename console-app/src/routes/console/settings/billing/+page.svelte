<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import {
    CreditCard,
    ArrowUpRight,
    Download,
    Users,
    AppWindow,
    ShieldCheck,
    Zap,
    AlertTriangle,
    CheckCircle,
  } from "lucide-svelte";

  const settingsTabs = [
    { href: "/console/settings", label: "General" },
    { href: "/console/settings/users", label: "Users" },
    { href: "/console/settings/audit-log", label: "Audit Log" },
    { href: "/console/settings/billing", label: "Billing" },
    { href: "/console/settings/trust", label: "Trust Center" },
    { href: "/console/settings/incidents", label: "Incidents" },
    { href: "/console/settings/security", label: "Security" },
    { href: "/console/settings/notifications", label: "Notifications" },
  ];
  $: current = $page.url.pathname;

  let loading = true;
  let billing: any = null;
  let usage: any = null;
  let invoices: any[] = [];
  let upgrading = false;
  let upgradeCycle: "monthly" | "annual" = "annual";

  // Seat management
  let seatInfo: { seats: number; activeUsers: number; hasSubscription: boolean } | null = null;
  let seatInput = 5;
  let updatingSeats = false;
  let seatError = "";

  // Per-user pricing per plan/cycle
  const perUserPrice: Record<string, Record<string, number>> = {
    starter:      { monthly: 4, annual: 3 },
    professional: { monthly: 6, annual: 5 },
    enterprise:   { monthly: 0, annual: 0 },
  };

  $: seatDelta = seatInfo ? seatInput - seatInfo.seats : 0;
  $: monthlyCost = billing && perUserPrice[billing.plan]
    ? perUserPrice[billing.plan][billing.billingCycle || "monthly"] * seatInput
    : 0;

  const planColors: Record<string, string> = {
    free: "secondary",
    starter: "default",
    professional: "success",
    enterprise: "success",
  };

  const planNames: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  const planLimits: Record<string, any> = {
    free: { users: 10, adapters: 3, frameworks: 1, automationRules: 5 },
    starter: { users: 50, adapters: 10, frameworks: 2, automationRules: 25 },
    professional: { users: 500, adapters: null, frameworks: null, automationRules: null },
    enterprise: { users: null, adapters: null, frameworks: null, automationRules: null },
  };

  onMount(async () => {
    // Check for checkout result
    const checkout = $page.url.searchParams.get("checkout");
    if (checkout === "success") {
      pushToast({ message: "Subscription activated! Welcome to your new plan.", variant: "success" });
    } else if (checkout === "canceled") {
      pushToast({ message: "Checkout canceled.", variant: "info" });
    }

    await loadBilling();

    // Auto-trigger checkout if redirected from pricing page with plan param
    const planParam = $page.url.searchParams.get("plan");
    const cycleParam = $page.url.searchParams.get("cycle");
    if (planParam && ["starter", "professional", "enterprise"].includes(planParam) && !checkout) {
      if (cycleParam === "monthly" || cycleParam === "annual") {
        upgradeCycle = cycleParam;
      }
      handleUpgrade(planParam);
    }
  });

  async function loadBilling() {
    loading = true;
    try {
      const [billingRes, seatRes] = await Promise.all([
        fetch("/api/billing"),
        fetch("/api/billing/seats"),
      ]);
      if (billingRes.ok) {
        const data = await billingRes.json();
        billing = data.billing;
        usage = data.usage;
        invoices = data.invoices || [];
      }
      if (seatRes.ok) {
        seatInfo = await seatRes.json();
        seatInput = seatInfo?.seats ?? 5;
      }
    } catch (err) {
      console.error("Failed to load billing:", err);
    }
    loading = false;
  }

  async function updateSeats() {
    if (!seatInfo || seatInput === seatInfo.seats) return;
    updatingSeats = true;
    seatError = "";
    try {
      const res = await fetch("/api/billing/seats", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seats: seatInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        seatError = data.error || "Failed to update seats";
        pushToast({ message: seatError, variant: "error" });
      } else {
        seatInfo = { ...seatInfo!, seats: data.seats };
        pushToast({ message: `Seat count updated to ${data.seats}`, variant: "success" });
      }
    } catch {
      seatError = "Failed to update seats";
      pushToast({ message: seatError, variant: "error" });
    }
    updatingSeats = false;
  }

  async function handleUpgrade(plan: string) {
    upgrading = true;
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, cycle: upgradeCycle }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      pushToast({ message: data.error || "Failed to start checkout", variant: "error" });
    } catch {
      pushToast({ message: "Failed to start checkout", variant: "error" });
    }
    upgrading = false;
  }

  async function openPortal() {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      pushToast({ message: data.error || "Failed to open billing portal", variant: "error" });
    } catch {
      pushToast({ message: "Failed to open billing portal", variant: "error" });
    }
  }

  function usagePercent(current: number, limit: number | null): number {
    if (!limit) return 0;
    return Math.min(Math.round((current / limit) * 100), 100);
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatCents(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-semibold tracking-tight">Billing</h1>

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

  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-40 w-full" />
      <Skeleton class="h-32 w-full" />
    </div>
  {:else}
    <!-- Current plan -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <CreditCard class="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>
                Plan: {planNames[billing?.plan] || "Free"}
              </CardTitle>
              <p class="text-sm text-muted-foreground mt-1">
                {#if billing?.billingCycle === "annual"}
                  Billed annually
                {:else if billing?.plan !== "free"}
                  Billed monthly
                {:else}
                  No charge
                {/if}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant={billing?.status === "active" || billing?.status === "trialing" ? "success" : billing?.status === "past_due" ? "warning" : "secondary"}>
              {#if billing?.status === "trialing"}
                Trial (ends {formatDate(billing?.trialEndsAt)})
              {:else if billing?.status === "past_due"}
                Past Due
              {:else if billing?.status === "canceled"}
                Canceled
              {:else}
                Active
              {/if}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {#if billing?.status === "past_due"}
          <div class="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 mb-4">
            <AlertTriangle class="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div class="text-sm">
              <p class="font-medium text-warning">Payment failed</p>
              <p class="text-muted-foreground">Please update your payment method to avoid service interruption.</p>
            </div>
          </div>
        {/if}

        <div class="space-y-3">
          {#if billing?.plan === "free" || billing?.plan === "starter"}
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">Billing cycle:</span>
              <div class="inline-flex items-center gap-1 bg-muted rounded-full p-0.5">
                <button
                  class="px-3 py-1 rounded-full text-xs font-medium transition-colors {upgradeCycle === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}"
                  on:click={() => upgradeCycle = 'monthly'}
                >Monthly</button>
                <button
                  class="px-3 py-1 rounded-full text-xs font-medium transition-colors {upgradeCycle === 'annual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}"
                  on:click={() => upgradeCycle = 'annual'}
                >Annual <Badge variant="success" class="ml-1 text-[10px]">Save</Badge></button>
              </div>
            </div>
          {/if}
          <div class="flex flex-wrap gap-3">
          {#if billing?.plan === "free"}
            <Button on:click={() => handleUpgrade("starter")} disabled={upgrading}>
              Upgrade to Starter — {upgradeCycle === 'annual' ? '$3' : '$4'}/user/mo
              <ArrowUpRight class="w-4 h-4 ml-1" />
            </Button>
            <Button variant="outline" on:click={() => handleUpgrade("professional")} disabled={upgrading}>
              Upgrade to Professional — {upgradeCycle === 'annual' ? '$5' : '$6'}/user/mo
            </Button>
          {:else if billing?.plan === "starter"}
            <Button on:click={() => handleUpgrade("professional")} disabled={upgrading}>
              Upgrade to Professional — {upgradeCycle === 'annual' ? '$5' : '$6'}/user/mo
              <ArrowUpRight class="w-4 h-4 ml-1" />
            </Button>
          {/if}
          {#if billing?.hasPaymentMethod}
            <Button variant="outline" on:click={openPortal}>
              Manage subscription
              <ArrowUpRight class="w-4 h-4 ml-1" />
            </Button>
          {/if}
          <Button variant="outline" on:click={() => window.location.href = "/pricing"}>
            Compare plans
          </Button>
        </div>
        </div>

        {#if billing?.currentPeriodEnd}
          <p class="text-xs text-muted-foreground mt-4">
            Current period: {formatDate(billing.currentPeriodStart)} – {formatDate(billing.currentPeriodEnd)}
          </p>
        {/if}
      </CardContent>
    </Card>

    <!-- Seat management -->
    {#if seatInfo && billing?.plan !== "free"}
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Users class="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Seats</CardTitle>
                <p class="text-sm text-muted-foreground mt-1">
                  {seatInfo.activeUsers} active user{seatInfo.activeUsers === 1 ? '' : 's'} of {seatInfo.seats} seats
                </p>
              </div>
            </div>
            {#if seatInfo.hasSubscription}
              <Badge variant="success">Per-seat billing</Badge>
            {/if}
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- Seat usage bar -->
            <div class="space-y-1.5">
              <div class="w-full bg-muted rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all {usagePercent(seatInfo.activeUsers, seatInfo.seats) >= 90 ? 'bg-warning' : 'bg-primary'}"
                  style="width: {usagePercent(seatInfo.activeUsers, seatInfo.seats)}%"
                ></div>
              </div>
              <p class="text-xs text-muted-foreground">
                {seatInfo.seats - seatInfo.activeUsers} seat{seatInfo.seats - seatInfo.activeUsers === 1 ? '' : 's'} available
              </p>
            </div>

            {#if seatInfo.hasSubscription}
              <!-- Adjust seats -->
              <div class="flex flex-col sm:flex-row items-start sm:items-end gap-3 pt-2 border-t">
                <div class="space-y-1.5">
                  <label for="seat-count" class="text-sm font-medium">Adjust seat count</label>
                  <div class="flex items-center gap-2">
                    <button
                      class="h-9 w-9 rounded-md border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                      disabled={seatInput <= Math.max(seatInfo.activeUsers, 5) || updatingSeats}
                      on:click={() => seatInput = Math.max(seatInput - 1, Math.max(seatInfo?.activeUsers ?? 5, 5))}
                    >-</button>
                    <input
                      id="seat-count"
                      type="number"
                      min={Math.max(seatInfo.activeUsers, 5)}
                      max="10000"
                      class="h-9 w-20 rounded-md border bg-background px-3 text-center text-sm"
                      bind:value={seatInput}
                    />
                    <button
                      class="h-9 w-9 rounded-md border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                      disabled={seatInput >= 10000 || updatingSeats}
                      on:click={() => seatInput = Math.min(seatInput + 1, 10000)}
                    >+</button>
                  </div>
                  <p class="text-xs text-muted-foreground">
                    Minimum {Math.max(seatInfo.activeUsers, 5)} (5 or your active user count)
                  </p>
                </div>

                <div class="flex flex-col gap-1.5">
                  {#if seatDelta !== 0 && monthlyCost > 0}
                    <p class="text-sm">
                      {seatInput} seats &times; ${perUserPrice[billing.plan]?.[billing.billingCycle || "monthly"] ?? 0}/user/mo = <span class="font-semibold">${monthlyCost}/mo</span>
                    </p>
                    {#if seatDelta > 0}
                      <p class="text-xs text-muted-foreground">Adding {seatDelta} seat{seatDelta === 1 ? '' : 's'} &mdash; prorated for current period</p>
                    {:else}
                      <p class="text-xs text-muted-foreground">Removing {Math.abs(seatDelta)} seat{Math.abs(seatDelta) === 1 ? '' : 's'} &mdash; credit applied to next invoice</p>
                    {/if}
                  {/if}
                  <Button
                    size="sm"
                    disabled={seatDelta === 0 || updatingSeats || seatInput < Math.max(seatInfo.activeUsers, 5)}
                    on:click={updateSeats}
                  >
                    {#if updatingSeats}
                      Updating...
                    {:else}
                      Update seats
                    {/if}
                  </Button>
                </div>
              </div>

              {#if seatError}
                <div class="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle class="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p class="text-sm text-destructive">{seatError}</p>
                </div>
              {/if}
            {:else}
              <p class="text-sm text-muted-foreground">Subscribe to a paid plan to manage seats.</p>
            {/if}
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Usage summary -->
    {#if usage}
      {@const limits = planLimits[billing?.plan || "free"]}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm">
                <Users class="w-4 h-4 text-muted-foreground" />
                <span>Active users</span>
              </div>
              <div class="text-2xl font-semibold">{usage.activeUsers}</div>
              {#if limits.users}
                <div class="w-full bg-muted rounded-full h-1.5">
                  <div
                    class="h-1.5 rounded-full transition-all {usagePercent(usage.activeUsers, limits.users) >= 90 ? 'bg-warning' : 'bg-primary'}"
                    style="width: {usagePercent(usage.activeUsers, limits.users)}%"
                  ></div>
                </div>
                <p class="text-xs text-muted-foreground">{usage.activeUsers} of {limits.users}</p>
              {:else}
                <p class="text-xs text-muted-foreground">Unlimited</p>
              {/if}
            </div>

            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm">
                <AppWindow class="w-4 h-4 text-muted-foreground" />
                <span>Integrations</span>
              </div>
              <div class="text-2xl font-semibold">{usage.connectedAdapters}</div>
              {#if limits.adapters}
                <div class="w-full bg-muted rounded-full h-1.5">
                  <div
                    class="h-1.5 rounded-full transition-all {usagePercent(usage.connectedAdapters, limits.adapters) >= 90 ? 'bg-warning' : 'bg-primary'}"
                    style="width: {usagePercent(usage.connectedAdapters, limits.adapters)}%"
                  ></div>
                </div>
                <p class="text-xs text-muted-foreground">{usage.connectedAdapters} of {limits.adapters}</p>
              {:else}
                <p class="text-xs text-muted-foreground">Unlimited</p>
              {/if}
            </div>

            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm">
                <ShieldCheck class="w-4 h-4 text-muted-foreground" />
                <span>Frameworks</span>
              </div>
              <div class="text-2xl font-semibold">{usage.complianceFrameworks}</div>
              {#if limits.frameworks}
                <div class="w-full bg-muted rounded-full h-1.5">
                  <div
                    class="h-1.5 rounded-full transition-all {usagePercent(usage.complianceFrameworks, limits.frameworks) >= 90 ? 'bg-warning' : 'bg-primary'}"
                    style="width: {usagePercent(usage.complianceFrameworks, limits.frameworks)}%"
                  ></div>
                </div>
                <p class="text-xs text-muted-foreground">{usage.complianceFrameworks} of {limits.frameworks}</p>
              {:else}
                <p class="text-xs text-muted-foreground">Unlimited</p>
              {/if}
            </div>

            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm">
                <Zap class="w-4 h-4 text-muted-foreground" />
                <span>Automation rules</span>
              </div>
              <div class="text-2xl font-semibold">{usage.automationRules}</div>
              {#if limits.automationRules}
                <div class="w-full bg-muted rounded-full h-1.5">
                  <div
                    class="h-1.5 rounded-full transition-all {usagePercent(usage.automationRules, limits.automationRules) >= 90 ? 'bg-warning' : 'bg-primary'}"
                    style="width: {usagePercent(usage.automationRules, limits.automationRules)}%"
                  ></div>
                </div>
                <p class="text-xs text-muted-foreground">{usage.automationRules} of {limits.automationRules}</p>
              {:else}
                <p class="text-xs text-muted-foreground">Unlimited</p>
              {/if}
            </div>
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Invoice history -->
    <Card>
      <CardHeader>
        <CardTitle>Invoice History</CardTitle>
      </CardHeader>
      <CardContent>
        {#if invoices.length === 0}
          <p class="text-sm text-muted-foreground">No invoices yet.</p>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                  <th class="text-left py-2 px-3 font-medium text-muted-foreground">Period</th>
                  <th class="text-left py-2 px-3 font-medium text-muted-foreground">Amount</th>
                  <th class="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                  <th class="text-right py-2 px-3 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {#each invoices as inv}
                  <tr class="border-b border-border/50">
                    <td class="py-2 px-3">{formatDate(inv.createdAt)}</td>
                    <td class="py-2 px-3 text-muted-foreground">{formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}</td>
                    <td class="py-2 px-3">{formatCents(inv.amountCents)}</td>
                    <td class="py-2 px-3">
                      <Badge variant={inv.status === "paid" ? "success" : inv.status === "open" ? "warning" : "secondary"}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td class="py-2 px-3 text-right">
                      {#if inv.pdfUrl}
                        <a href={inv.pdfUrl} target="_blank" rel="noopener" class="text-primary hover:underline inline-flex items-center gap-1">
                          <Download class="w-3 h-3" />
                          PDF
                        </a>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
