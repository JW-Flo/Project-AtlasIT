<script lang="ts">
  import { page } from "$app/stores";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import { CreditCard } from "lucide-svelte";

  const settingsTabs = [
    { href: "/console/settings", label: "General" },
    { href: "/console/settings/users", label: "Users" },
    { href: "/console/settings/audit-log", label: "Audit Log" },
    { href: "/console/settings/billing", label: "Billing" },
  ];
  $: current = $page.url.pathname;
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

  <Card>
    <CardHeader>
      <div class="flex items-center gap-3">
        <CreditCard class="h-5 w-5 text-muted-foreground" />
        <div>
          <CardTitle>Plan: Starter (Pilot)</CardTitle>
        </div>
        <Badge variant="secondary" class="ml-auto">Active</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <p class="text-sm text-muted-foreground">
        Billing management will be available in a future release.
        Contact <a href="mailto:support@atlasit.pro" class="text-primary hover:underline">support@atlasit.pro</a> for billing inquiries.
      </p>
    </CardContent>
  </Card>
</div>
