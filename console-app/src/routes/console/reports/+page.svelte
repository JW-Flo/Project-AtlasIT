<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import {
    FileText,
    Download,
    Calendar,
    Shield,
    Activity,
    Users,
    FileCheck,
    Clock,
  } from "lucide-svelte";

  interface Report {
    id: string;
    name: string;
    description: string;
    icon: any;
    format: "pdf" | "csv" | "json";
    frequency?: "daily" | "weekly" | "monthly";
    lastGenerated?: string;
  }

  const availableReports: Report[] = [
    {
      id: "compliance-summary",
      name: "Compliance Summary",
      description: "Executive summary of compliance posture across all frameworks",
      icon: Shield,
      format: "pdf",
      frequency: "weekly",
    },
    {
      id: "audit-log",
      name: "Audit Log Export",
      description: "Detailed audit trail of all tenant activities and changes",
      icon: Activity,
      format: "csv",
      frequency: "daily",
    },
    {
      id: "evidence-package",
      name: "Evidence Package",
      description: "Complete evidence archive for audit submission",
      icon: FileCheck,
      format: "pdf",
      frequency: "monthly",
    },
    {
      id: "access-review-summary",
      name: "Access Review Summary",
      description: "Summary of access reviews, decisions, and pending actions",
      icon: Users,
      format: "pdf",
      frequency: "monthly",
    },
    {
      id: "incident-report",
      name: "Incident Report",
      description: "Security incidents, response actions, and resolution status",
      icon: Activity,
      format: "pdf",
      frequency: "weekly",
    },
    {
      id: "policy-compliance",
      name: "Policy Compliance Report",
      description: "Policy coverage, exceptions, and compliance metrics",
      icon: FileText,
      format: "pdf",
      frequency: "monthly",
    },
  ];

  let generating: Record<string, boolean> = {};
  let dateRange = "30";

  async function generateReport(report: Report) {
    generating[report.id] = true;
    generating = { ...generating };

    try {
      const res = await fetch(`/api/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          format: report.format,
          dateRange: parseInt(dateRange),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.id}-${new Date().toISOString().split("T")[0]}.${report.format}`;
      a.click();
      URL.revokeObjectURL(url);

      pushToast({
        type: "success",
        message: `${report.name} generated successfully`,
      });
    } catch (e: any) {
      pushToast({
        type: "error",
        message: `Failed to generate report: ${e.message}`,
      });
    } finally {
      generating[report.id] = false;
      generating = { ...generating };
    }
  }

  function formatFrequency(freq?: string): string {
    if (!freq) return "";
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  }
</script>

<div class="animate-fade-in">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-foreground">Reports</h1>
    <p class="mt-2 text-muted-foreground">
      Generate compliance, audit, and security reports for stakeholders and auditors
    </p>
  </div>

  <!-- Date Range Selector -->
  <Card class="mb-6">
    <CardContent class="pt-6">
      <div class="flex items-center gap-4">
        <Calendar class="h-5 w-5 text-muted-foreground" />
        <label for="dateRange" class="text-sm font-medium text-foreground">Report Period:</label>
        <select
          id="dateRange"
          bind:value={dateRange}
          class="w-48 px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last 12 months</option>
        </select>
      </div>
    </CardContent>
  </Card>

  <!-- Report Cards -->
  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {#each availableReports as report (report.id)}
      <Card class="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-primary/10 text-primary">
                <svelte:component this={report.icon} class="h-5 w-5" />
              </div>
              <div>
                <CardTitle class="text-base">{report.name}</CardTitle>
                {#if report.frequency}
                  <Badge variant="secondary" class="mt-1 text-xs">
                    {formatFrequency(report.frequency)}
                  </Badge>
                {/if}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground mb-4">
            {report.description}
          </p>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText class="h-3 w-3" />
              <span class="uppercase">{report.format}</span>
            </div>
            <Button
              variant="default"
              size="sm"
              disabled={generating[report.id]}
              on:click={() => generateReport(report)}
              class="gap-2"
            >
              {#if generating[report.id]}
                <Clock class="h-4 w-4 animate-spin" />
                Generating...
              {:else}
                <Download class="h-4 w-4" />
                Generate
              {/if}
            </Button>
          </div>
        </CardContent>
      </Card>
    {/each}
  </div>

  <!-- Scheduled Reports Section -->
  <Card class="mt-8">
    <CardHeader>
      <CardTitle>Scheduled Reports</CardTitle>
    </CardHeader>
    <CardContent>
      <p class="text-sm text-muted-foreground mb-4">
        Configure automatic report generation and delivery on a schedule.
      </p>
      <Button variant="outline" size="sm" disabled class="gap-2">
        <Clock class="h-4 w-4" />
        Configure Schedules (Coming Soon)
      </Button>
    </CardContent>
  </Card>
</div>
