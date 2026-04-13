<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { AlertTriangle, Save, Bell, Mail, MessageSquare, Zap } from "lucide-svelte";

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
  let saving = false;
  let error = "";
  let slackWebhook = "";
  let slackWebhookSaved = false;

  // Digest preferences
  let weeklyDigestEnabled = true;
  let weeklyDigestDay = 0; // 0 = Sunday
  let smartAlertsEnabled = true;
  let smartAlertMinSeverity: "info" | "warning" | "critical" = "warning";

  // Channels
  let channelInApp = true;
  let channelSlack = false;
  let channelEmail = true;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  async function loadPreferences() {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/user/preferences");
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const prefs = await res.json();

      if (prefs.digest_preferences) {
        try {
          const dp = JSON.parse(prefs.digest_preferences);
          weeklyDigestEnabled = dp.weeklyDigestEnabled ?? true;
          weeklyDigestDay = dp.weeklyDigestDay ?? 0;
          smartAlertsEnabled = dp.smartAlertsEnabled ?? true;
          smartAlertMinSeverity = dp.smartAlertMinSeverity ?? "warning";
          channelInApp = dp.channels?.inApp ?? true;
          channelSlack = dp.channels?.slack ?? false;
          channelEmail = dp.channels?.email ?? true;
        } catch {}
      }

      // Load tenant slack webhook
      const tenantRes = await fetch("/api/tenants/preferences");
      if (tenantRes.ok) {
        const tenantPrefs = await tenantRes.json();
        if (tenantPrefs.slack_webhook_url) {
          slackWebhook = tenantPrefs.slack_webhook_url;
          slackWebhookSaved = true;
        }
      }
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function savePreferences() {
    saving = true;
    error = "";
    try {
      const digestPrefs = JSON.stringify({
        weeklyDigestEnabled,
        weeklyDigestDay,
        smartAlertsEnabled,
        smartAlertMinSeverity,
        channels: {
          inApp: channelInApp,
          slack: channelSlack,
          email: channelEmail,
        },
      });

      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digest_preferences: digestPrefs }),
      });

      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      pushToast({ message: "Notification preferences saved", variant: "success" });
    } catch (e: any) {
      error = e.message;
      pushToast({ message: `Failed to save: ${e.message}`, variant: "error" });
    } finally {
      saving = false;
    }
  }

  async function saveSlackWebhook() {
    if (!slackWebhook.startsWith("https://hooks.slack.com/")) {
      pushToast({ message: "Invalid Slack webhook URL", variant: "error" });
      return;
    }

    try {
      const res = await fetch("/api/tenants/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "slack_webhook_url", value: slackWebhook }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      slackWebhookSaved = true;
      pushToast({ message: "Slack webhook saved", variant: "success" });
    } catch (e: any) {
      pushToast({ message: `Failed to save webhook: ${e.message}`, variant: "error" });
    }
  }

  onMount(loadPreferences);
</script>

<svelte:head>
  <title>Notification Settings | AtlasIT</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Settings</h1>
    <p class="text-muted-foreground">Manage your organization and notification preferences.</p>
  </div>

  <!-- Settings tabs -->
  <nav class="flex gap-1 border-b border-border overflow-x-auto">
    {#each settingsTabs as tab}
      <a
        href={tab.href}
        class="px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors {current === tab.href
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'}"
      >
        {tab.label}
      </a>
    {/each}
  </nav>

  {#if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <span>{error}</span>
    </Alert>
  {/if}

  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-48 w-full" />
      <Skeleton class="h-48 w-full" />
    </div>
  {:else}
    <!-- Weekly Digest Card -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Bell class="h-5 w-5" />
          Weekly Compliance Digest
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Receive an AI-generated summary every week with score changes, new evidence, upcoming deadlines, and drift alerts.
        </p>

        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            id="weekly-digest"
            bind:checked={weeklyDigestEnabled}
            class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <Label for="weekly-digest">Enable weekly digest</Label>
        </div>

        {#if weeklyDigestEnabled}
          <div class="ml-7 space-y-3">
            <div>
              <Label for="digest-day">Delivery day</Label>
              <select
                id="digest-day"
                bind:value={weeklyDigestDay}
                class="mt-1 block w-48 rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {#each dayNames as day, i}
                  <option value={i}>{day}</option>
                {/each}
              </select>
              <p class="text-xs text-muted-foreground mt-1">Digest generated at 08:00 UTC</p>
            </div>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Smart Alerts Card -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Zap class="h-5 w-5" />
          Smart Alerts
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Predictive alerts that detect issues before they impact your scores — like evidence collection gaps, score regression trends, and adapter health issues.
        </p>

        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            id="smart-alerts"
            bind:checked={smartAlertsEnabled}
            class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <Label for="smart-alerts">Enable smart alerts</Label>
        </div>

        {#if smartAlertsEnabled}
          <div class="ml-7">
            <Label for="min-severity">Minimum severity</Label>
            <select
              id="min-severity"
              bind:value={smartAlertMinSeverity}
              class="mt-1 block w-48 rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="info">All (info + warning + critical)</option>
              <option value="warning">Warning + Critical only</option>
              <option value="critical">Critical only</option>
            </select>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Delivery Channels Card -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Mail class="h-5 w-5" />
          Delivery Channels
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Choose how you receive digests and alerts.
        </p>

        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              id="ch-inapp"
              bind:checked={channelInApp}
              class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <Label for="ch-inapp">In-app notifications</Label>
          </div>

          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              id="ch-email"
              bind:checked={channelEmail}
              class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <Label for="ch-email">Email</Label>
          </div>

          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              id="ch-slack"
              bind:checked={channelSlack}
              class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <Label for="ch-slack">Slack</Label>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Slack Webhook Configuration -->
    {#if channelSlack}
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <MessageSquare class="h-5 w-5" />
            Slack Integration
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-sm text-muted-foreground">
            Enter your Slack incoming webhook URL to receive digests and critical alerts in a channel.
          </p>

          <div class="flex gap-2">
            <input
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              bind:value={slackWebhook}
              class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Button on:click={saveSlackWebhook} variant="outline" size="sm">
              {slackWebhookSaved ? "Update" : "Save"}
            </Button>
          </div>

          {#if slackWebhookSaved}
            <p class="text-xs text-success">Webhook configured</p>
          {/if}
        </CardContent>
      </Card>
    {/if}

    <!-- Save Button -->
    <div class="flex justify-end">
      <Button on:click={savePreferences} disabled={saving}>
        <Save class="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  {/if}
</div>
