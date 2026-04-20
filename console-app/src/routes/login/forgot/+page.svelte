<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";

  let email = "";
  let submitted = false;
  let loading = false;
  let error = "";

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    error = "";

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      submitted = true;
    } catch (err) {
      error = (err as Error).message;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Forgot Password - AtlasIT</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-background p-4">
  <div class="w-full max-w-md">
    <div class="bg-card border border-border rounded-xl p-8 shadow-lg">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
        <p class="text-sm text-muted-foreground">
          {#if submitted}
            Check your email for reset instructions
          {:else}
            Enter your email to receive a password reset link
          {/if}
        </p>
      </div>

      {#if submitted}
        <div class="bg-success-muted border border-success text-success rounded-lg p-4 mb-6">
          <p class="text-sm">
            If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
          </p>
        </div>
        <a href="/login">
          <Button class="w-full">Back to Login</Button>
        </a>
      {:else}
        <form on:submit={handleSubmit} class="space-y-4">
          <div>
            <Label for="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              bind:value={email}
              placeholder="you@company.com"
              required
              disabled={loading}
              autocomplete="email"
            />
          </div>

          {#if error}
            <div class="bg-destructive-muted border border-destructive text-destructive rounded-lg p-3 text-sm">
              {error}
            </div>
          {/if}

          <Button type="submit" class="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>

          <div class="text-center">
            <a href="/login" class="text-sm text-muted-foreground hover:text-primary transition-colors">
              Back to Login
            </a>
          </div>
        </form>
      {/if}
    </div>

    <p class="text-center text-xs text-muted-foreground mt-6">
      Need help? Contact <a href="mailto:support@atlasit.pro" class="text-primary hover:underline">support@atlasit.pro</a>
    </p>
  </div>
</div>
