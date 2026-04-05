<script lang="ts">
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import { Check, X, ArrowRight, Zap } from "lucide-svelte";

  let annual = true;

  interface Plan {
    id: string;
    name: string;
    tagline: string;
    monthlyPrice: number;
    annualPrice: number;
    features: string[];
    highlighted?: boolean;
    cta: string;
    ctaVariant: "default" | "outline";
  }

  const plans: Plan[] = [
    {
      id: "free",
      name: "Free",
      tagline: "SaaS discovery & compliance assessment",
      monthlyPrice: 0,
      annualPrice: 0,
      cta: "Get started free",
      ctaVariant: "outline",
      features: [
        "SaaS discovery & shadow IT detection",
        "Compliance assessment for 1 framework",
        "Up to 10 users",
        "3 app integrations",
        "Community support",
        "7-day evidence retention",
      ],
    },
    {
      id: "starter",
      name: "Starter",
      tagline: "IT ops automation for growing teams",
      monthlyPrice: 3,
      annualPrice: 2,
      cta: "Start 30-day free trial",
      ctaVariant: "outline",
      features: [
        "Everything in Free",
        "Up to 50 users",
        "10 app integrations",
        "JML automation & provisioning",
        "2 compliance frameworks",
        "30-day evidence retention",
        "Email support",
      ],
    },
    {
      id: "professional",
      name: "Professional",
      tagline: "Full compliance & governance platform",
      monthlyPrice: 5,
      annualPrice: 4,
      highlighted: true,
      cta: "Start 14-day free trial",
      ctaVariant: "default",
      features: [
        "Everything in Starter",
        "Up to 500 users",
        "Unlimited integrations",
        "All compliance frameworks",
        "Custom automation rules",
        "Access reviews & NHI governance",
        "1-year evidence retention",
        "SSO included",
        "Priority support",
        "Audit-ready reports",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      tagline: "Custom deployment & dedicated support",
      monthlyPrice: -1,
      annualPrice: -1,
      cta: "Contact sales",
      ctaVariant: "outline",
      features: [
        "Everything in Professional",
        "Unlimited users & integrations",
        "Custom compliance packs",
        "Plugin API access",
        "Dedicated account manager",
        "99.99% SLA",
        "Custom integrations",
        "On-premise deployment option",
      ],
    },
  ];

  const comparisonFeatures = [
    { name: "Users", free: "10", starter: "50", pro: "500", enterprise: "Unlimited" },
    { name: "App integrations", free: "3", starter: "10", pro: "Unlimited", enterprise: "Unlimited" },
    { name: "Compliance frameworks", free: "1", starter: "2", pro: "All", enterprise: "All + Custom" },
    { name: "Evidence retention", free: "7 days", starter: "30 days", pro: "1 year", enterprise: "2 years" },
    { name: "Automation rules", free: "5", starter: "25", pro: "Unlimited", enterprise: "Unlimited" },
    { name: "SaaS discovery", free: true, starter: true, pro: true, enterprise: true },
    { name: "JML automation", free: false, starter: true, pro: true, enterprise: true },
    { name: "Access reviews", free: false, starter: false, pro: true, enterprise: true },
    { name: "NHI governance", free: false, starter: false, pro: true, enterprise: true },
    { name: "SSO / SAML", free: false, starter: false, pro: true, enterprise: true },
    { name: "Audit-ready reports", free: false, starter: false, pro: true, enterprise: true },
    { name: "Trend analytics", free: false, starter: false, pro: true, enterprise: true },
    { name: "Custom compliance packs", free: false, starter: false, pro: true, enterprise: true },
    { name: "Plugin API", free: false, starter: false, pro: false, enterprise: true },
    { name: "Dedicated support", free: false, starter: false, pro: false, enterprise: true },
    { name: "On-premise option", free: false, starter: false, pro: false, enterprise: true },
  ];

  function selectPlan(planId: string) {
    if (planId === "enterprise") {
      window.location.href = "mailto:sales@atlasit.pro?subject=AtlasIT Enterprise Inquiry";
      return;
    }
    if (planId === "free") {
      goto("/console/onboarding");
      return;
    }
    goto(`/console/onboarding?plan=${planId}&cycle=${annual ? "annual" : "monthly"}`);
  }

  function formatPrice(price: number): string {
    if (price === -1) return "Custom";
    if (price === 0) return "$0";
    return `$${price}`;
  }
</script>

<svelte:head>
  <title>Pricing - AtlasIT</title>
  <meta name="description" content="Transparent pricing for IT automation and compliance. Start free, upgrade as you grow." />
</svelte:head>

<div class="min-h-screen bg-background">
  <!-- Header -->
  <header class="border-b">
    <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="/" class="text-2xl font-bold text-primary">AtlasIT</a>
      <div class="flex items-center gap-4">
        <a href="/console/login" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</a>
        <Button on:click={() => goto("/console/onboarding")}>Get started</Button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-16">
    <!-- Hero -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold tracking-tight mb-4">
        Simple, transparent pricing
      </h1>
      <p class="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
        No sales calls required. Start free, see your compliance score in under 10 minutes, and upgrade when you're ready.
      </p>

      <!-- Billing toggle -->
      <div class="inline-flex items-center gap-3 bg-muted rounded-full p-1">
        <button
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors {!annual ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}"
          on:click={() => annual = false}
        >Monthly</button>
        <button
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors {annual ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}"
          on:click={() => annual = true}
        >
          Annual
          <Badge variant="success" class="ml-1.5 text-xs">Save 25%</Badge>
        </button>
      </div>
    </div>

    <!-- Plan cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
      {#each plans as plan}
        <Card class="relative flex flex-col {plan.highlighted ? 'border-primary shadow-lg ring-1 ring-primary' : ''}">
          {#if plan.highlighted}
            <div class="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="default" class="text-xs">Most Popular</Badge>
            </div>
          {/if}
          <CardHeader class="pb-4">
            <div class="space-y-2">
              <h3 class="text-lg font-semibold">{plan.name}</h3>
              <p class="text-sm text-muted-foreground">{plan.tagline}</p>
            </div>
            <div class="mt-4">
              {#if plan.monthlyPrice === -1}
                <span class="text-3xl font-bold">Custom</span>
              {:else if plan.monthlyPrice === 0}
                <span class="text-3xl font-bold">$0</span>
                <span class="text-sm text-muted-foreground">/forever</span>
              {:else}
                <span class="text-3xl font-bold">{formatPrice(annual ? plan.annualPrice : plan.monthlyPrice)}</span>
                <span class="text-sm text-muted-foreground">/user/month</span>
                {#if annual && plan.monthlyPrice > 0}
                  <div class="text-xs text-muted-foreground mt-1">billed annually</div>
                {/if}
              {/if}
            </div>
          </CardHeader>
          <CardContent class="flex-1 flex flex-col">
            <Button
              variant={plan.ctaVariant}
              class="w-full mb-6 {plan.highlighted ? '' : ''}"
              on:click={() => selectPlan(plan.id)}
            >
              {plan.cta}
              <ArrowRight class="w-4 h-4 ml-1" />
            </Button>
            <ul class="space-y-3 text-sm">
              {#each plan.features as feature}
                <li class="flex items-start gap-2">
                  <Check class="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              {/each}
            </ul>
          </CardContent>
        </Card>
      {/each}
    </div>

    <!-- Feature comparison table -->
    <div class="mb-24">
      <h2 class="text-2xl font-bold text-center mb-8">Compare plans</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left py-3 px-4 font-medium text-muted-foreground w-1/5">Feature</th>
              <th class="text-center py-3 px-4 font-medium w-1/5">Free</th>
              <th class="text-center py-3 px-4 font-medium w-1/5">Starter</th>
              <th class="text-center py-3 px-4 font-medium text-primary w-1/5">Professional</th>
              <th class="text-center py-3 px-4 font-medium w-1/5">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {#each comparisonFeatures as row}
              <tr class="border-b border-border/50">
                <td class="py-3 px-4 font-medium">{row.name}</td>
                {#each [row.free, row.starter, row.pro, row.enterprise] as val}
                  <td class="text-center py-3 px-4">
                    {#if typeof val === "boolean"}
                      {#if val}
                        <Check class="w-4 h-4 text-primary mx-auto" />
                      {:else}
                        <X class="w-4 h-4 text-muted-foreground/40 mx-auto" />
                      {/if}
                    {:else}
                      <span class="text-sm">{val}</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- FAQ -->
    <div class="max-w-3xl mx-auto mb-16">
      <h2 class="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
      <div class="space-y-6">
        <div>
          <h3 class="font-medium mb-2">Can I try before I buy?</h3>
          <p class="text-sm text-muted-foreground">
            Yes! The free tier includes SaaS discovery and one compliance framework with no credit card required.
            Starter includes a 30-day free trial and Professional includes a 14-day free trial, both with full access.
          </p>
        </div>
        <div>
          <h3 class="font-medium mb-2">How does per-user pricing work?</h3>
          <p class="text-sm text-muted-foreground">
            You're billed based on the number of active users in your directory.
            Users who are deactivated or removed don't count toward your limit.
          </p>
        </div>
        <div>
          <h3 class="font-medium mb-2">Can I change plans at any time?</h3>
          <p class="text-sm text-muted-foreground">
            Absolutely. Upgrade or downgrade at any time. Upgrades take effect immediately with prorated billing.
            Downgrades take effect at the end of your current billing period.
          </p>
        </div>
        <div>
          <h3 class="font-medium mb-2">What compliance frameworks are supported?</h3>
          <p class="text-sm text-muted-foreground">
            We support SOC 2, ISO 27001, NIST CSF, HIPAA, and GDPR out of the box.
            Professional and Enterprise plans can use custom compliance packs via the Plugin API.
          </p>
        </div>
        <div>
          <h3 class="font-medium mb-2">Do you offer discounts for nonprofits or startups?</h3>
          <p class="text-sm text-muted-foreground">
            Yes. Contact us at sales@atlasit.pro for special pricing for nonprofits,
            educational institutions, and early-stage startups.
          </p>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="text-center py-12 border-t">
      <div class="flex items-center justify-center gap-2 mb-4">
        <Zap class="w-5 h-5 text-primary" />
        <span class="font-semibold">Connect your first app and see your compliance score in under 10 minutes</span>
      </div>
      <Button on:click={() => goto("/console/onboarding")} class="px-8">
        Get started free
        <ArrowRight class="w-4 h-4 ml-1" />
      </Button>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t py-8 text-center text-sm text-muted-foreground">
    <p>&copy; {new Date().getFullYear()} AtlasIT. All rights reserved.</p>
  </footer>
</div>
