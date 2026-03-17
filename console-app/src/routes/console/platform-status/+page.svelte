<script lang="ts">
  import { onMount } from "svelte";
  import { fetchPlatformStatus } from "$lib/platformStatus";
  import type {
    PlatformHealthResponse,
    PlatformUsageSummary,
  } from "$lib/types/platform";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { AlertTriangle, RefreshCw, Activity, Server, Zap, Users } from "lucide-svelte";

  let health: PlatformHealthResponse | null = null;
  let usage: PlatformUsageSummary | null = null;
  let loading = true;
  let error = "";

  async function loadStatus() {
    try {
      const data = await fetchPlatformStatus();
      health = data.health;
      usage = data.usage;
      error = "";
    } catch (e) {
      error = "Failed to load status";
      console.error(e);
    }
    loading = false;
  }

  onMount(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  });

  function statusLabel(ok: boolean) {
    return ok ? "Operational" : "Down";
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Platform Status</h1>
      <p class="text-sm text-muted-foreground">Service health and usage metrics</p>
    </div>
    <Button variant="outline" size="sm" on:click={loadStatus} disabled={loading}>
      <RefreshCw class="h-4 w-4 mr-1.5 {loading ? 'animate-spin' : ''}" />
      {loading ? "Refreshing..." : "Refresh"}
    </Button>
  </div>

  {#if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>
  {/if}

  <!-- Service Status Cards -->
  <section>
    <h2 class="text-lg font-semibold mb-4">Service Health</h2>
    {#if health?.services}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {#each Object.entries(health.services) as [service, status]}
          <Card>
            <CardContent class="pt-5">
              <div class="flex items-center gap-2 mb-3">
                <span class="w-2.5 h-2.5 rounded-full {status.ok ? 'bg-green-500' : 'bg-destructive'}"></span>
                <h3 class="font-medium capitalize">{service}</h3>
              </div>
              <div class="text-sm space-y-1.5">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Status</span>
                  <Badge variant={status.ok ? 'success' : 'destructive'}>
                    {statusLabel(status.ok)}
                  </Badge>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Latency</span>
                  <span>{status.latencyMs ? `${status.latencyMs}ms` : "N/A"}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">HTTP</span>
                  <span>{status.status || "---"}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Checked</span>
                  <span class="text-xs text-muted-foreground">{new Date(status.lastChecked).toLocaleTimeString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        {/each}
      </div>
    {:else if !loading}
      <Card>
        <CardContent class="py-4">
          <p class="text-sm text-muted-foreground">No service data available</p>
        </CardContent>
      </Card>
    {/if}
  </section>

  <!-- Usage Summary -->
  <section>
    <h2 class="text-lg font-semibold mb-4">Usage Summary</h2>
    {#if usage?.ok}
      <Card>
        <CardContent class="pt-5">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <Server class="h-4 w-4 text-primary" />
              </div>
              <div class="text-2xl font-bold text-primary">{usage.total || 0}</div>
              <div class="text-sm text-muted-foreground">Total Scripts</div>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <AlertTriangle class="h-4 w-4 text-destructive" />
              </div>
              <div class="text-2xl font-bold text-destructive">{usage.failures || 0}</div>
              <div class="text-sm text-muted-foreground">Failures</div>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <Activity class="h-4 w-4 text-warning" />
              </div>
              <div class="text-2xl font-bold text-warning">
                {((usage.failureRate || 0) * 100).toFixed(1)}%
              </div>
              <div class="text-sm text-muted-foreground">Failure Rate</div>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <Users class="h-4 w-4 text-green-500" />
              </div>
              <div class="text-2xl font-bold text-green-500">{usage.tenants || 0}</div>
              <div class="text-sm text-muted-foreground">Tenants</div>
            </div>
          </div>

          {#if usage.breakerOpenScripts && usage.breakerOpenScripts > 0}
            <Alert variant="warning" class="mb-4">
              <AlertTriangle class="h-4 w-4" />
              <div class="pl-7">
                <p class="font-medium">Circuit Breaker Open</p>
                <p class="text-sm">{usage.breakerOpenScripts} scripts have circuit breakers open</p>
              </div>
            </Alert>
          {/if}

          {#if usage.topScripts && usage.topScripts.length > 0}
            <div>
              <h4 class="font-medium mb-2 text-muted-foreground">Top Scripts by Invocations</h4>
              <div class="space-y-1">
                {#each usage.topScripts.slice(0, 5) as script}
                  <div class="flex justify-between text-sm">
                    <span>{script.name}</span>
                    <span class="font-mono text-muted-foreground">{script.invocations}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </CardContent>
      </Card>
    {:else}
      <Card>
        <CardContent class="py-4">
          <p class="text-sm text-muted-foreground">
            No usage data available. This may indicate the platform is still initializing.
          </p>
        </CardContent>
      </Card>
    {/if}
  </section>
</div>
