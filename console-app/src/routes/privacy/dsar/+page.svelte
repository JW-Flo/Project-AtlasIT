<script lang="ts">
  import { ArrowLeft, ShieldCheck, Send } from "lucide-svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";

  let formName = "";
  let formEmail = "";
  let formOrganization = "";
  let formRequestType = "access";
  let formDetails = "";
  let formState: "idle" | "submitting" | "success" | "error" = "idle";
  let formError = "";
  let refId = "";

  const requestTypes = [
    { value: "access", label: "Access my personal data", desc: "Receive a copy of all personal data we hold about you" },
    { value: "deletion", label: "Delete my personal data", desc: "Request permanent deletion of your data from our systems" },
    { value: "correction", label: "Correct inaccurate data", desc: "Update or correct personal information we hold" },
    { value: "portability", label: "Export / transfer my data", desc: "Receive your data in a portable, machine-readable format" },
    { value: "restriction", label: "Restrict processing", desc: "Limit how we process your personal data" },
    { value: "objection", label: "Object to processing", desc: "Object to specific types of data processing" },
  ];

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (formState === "submitting") return;
    formState = "submitting";
    formError = "";

    try {
      const res = await fetch("/api/privacy/dsar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          organization: formOrganization,
          requestType: formRequestType,
          details: formDetails,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        refId = (data as any).refId || "";
        formState = "success";
      } else {
        const data = await res.json().catch(() => ({}));
        formError = (data as any).error || "Failed to submit request. Please try again.";
        formState = "error";
      }
    } catch {
      formError = "Network error. Please check your connection and try again.";
      formState = "error";
    }
  }
</script>

<svelte:head>
  <title>Data Privacy Request — AtlasIT</title>
  <meta name="description" content="Submit a data subject access request (DSAR) to exercise your privacy rights under GDPR, CCPA, and other regulations." />
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
  <div class="max-w-3xl mx-auto px-4 py-12">
    <a href="/privacy" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
      <ArrowLeft class="h-4 w-4" /> Privacy Policy
    </a>

    <div class="flex items-center gap-3 mb-2">
      <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <ShieldCheck class="h-5 w-5 text-primary" />
      </div>
      <h1 class="text-3xl font-bold">Data Privacy Request</h1>
    </div>
    <p class="text-sm text-muted-foreground mb-10 ml-[52px]">
      Exercise your data privacy rights under GDPR, CCPA, and other applicable regulations.
      We will respond within 30 days of receiving your request.
    </p>

    {#if formState === "success"}
      <Card>
        <CardContent class="py-12 text-center">
          <div class="h-14 w-14 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck class="h-7 w-7 text-success" />
          </div>
          <h2 class="text-xl font-bold mb-2">Request submitted</h2>
          {#if refId}
            <p class="text-sm text-muted-foreground mb-1">Your reference number:</p>
            <p class="text-lg font-mono font-semibold text-primary mb-4">{refId}</p>
          {/if}
          <p class="text-sm text-muted-foreground max-w-md mx-auto">
            We've received your privacy request and will respond to <strong>{formEmail}</strong> within 30 days.
            Please save your reference number for tracking purposes.
          </p>
        </CardContent>
      </Card>
    {:else}
      <Card>
        <CardContent class="p-8">
          <form class="space-y-6" on:submit={handleSubmit}>
            <!-- Identity -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <Label htmlFor="dsar-name">Full name *</Label>
                <Input id="dsar-name" type="text" placeholder="Your legal name" bind:value={formName} disabled={formState === "submitting"} required />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label htmlFor="dsar-email">Email address *</Label>
                <Input id="dsar-email" type="email" placeholder="you@example.com" bind:value={formEmail} disabled={formState === "submitting"} required />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <Label htmlFor="dsar-org">Organization (optional)</Label>
              <Input id="dsar-org" type="text" placeholder="Company or tenant name" bind:value={formOrganization} disabled={formState === "submitting"} />
            </div>

            <!-- Request type -->
            <div class="flex flex-col gap-2">
              <Label>Request type *</Label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {#each requestTypes as rt}
                  <label
                    class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors {formRequestType === rt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}"
                  >
                    <input
                      type="radio"
                      name="requestType"
                      value={rt.value}
                      bind:group={formRequestType}
                      disabled={formState === "submitting"}
                      class="mt-0.5"
                    />
                    <div>
                      <div class="text-sm font-medium">{rt.label}</div>
                      <div class="text-xs text-muted-foreground mt-0.5">{rt.desc}</div>
                    </div>
                  </label>
                {/each}
              </div>
            </div>

            <!-- Additional details -->
            <div class="flex flex-col gap-1.5">
              <Label htmlFor="dsar-details">Additional details (optional)</Label>
              <textarea
                id="dsar-details"
                placeholder="Provide any additional context that may help us process your request..."
                bind:value={formDetails}
                disabled={formState === "submitting"}
                rows="4"
                class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[80px]"
              ></textarea>
            </div>

            {#if formState === "error" && formError}
              <p class="text-sm text-destructive">{formError}</p>
            {/if}

            <div class="flex items-center justify-between pt-2">
              <p class="text-xs text-muted-foreground max-w-sm">
                We verify your identity before processing requests. You may be asked to provide additional verification.
              </p>
              <Button type="submit" disabled={formState === "submitting"} class="gap-1.5">
                {#if formState === "submitting"}
                  Submitting...
                {:else}
                  Submit request
                  <Send class="h-3.5 w-3.5" />
                {/if}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    {/if}

    <!-- Info section -->
    <div class="mt-10 space-y-6 text-sm text-muted-foreground">
      <div>
        <h3 class="font-semibold text-foreground mb-1">What happens next?</h3>
        <ol class="list-decimal pl-5 space-y-1">
          <li>We acknowledge your request within 3 business days</li>
          <li>We verify your identity to protect your privacy</li>
          <li>We process your request and respond within 30 days</li>
          <li>If we need more time, we'll notify you of the extension (up to 60 additional days)</li>
        </ol>
      </div>

      <div>
        <h3 class="font-semibold text-foreground mb-1">Your rights</h3>
        <p>
          Under GDPR, CCPA, and similar regulations, you have the right to access, correct, delete, restrict, port, and object to the processing of your personal data. For more information, see our <a href="/privacy" class="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </div>

      <p>
        You can also contact us directly at <a href="mailto:privacy@atlasit.pro" class="text-primary hover:underline">privacy@atlasit.pro</a>.
      </p>
    </div>
  </div>
</div>
