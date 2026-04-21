<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { Button, Card } from "$lib/components/ui";
  import { AlertTriangle, RefreshCcw, Home } from "lucide-svelte";
  import { classifyError, logError, type ClassifiedError } from "$lib/utils/error-handling";

  export let fallbackMessage = "Something went wrong";
  export let showHomeButton = true;
  export let showRetryButton = true;
  export let onRetry: (() => void) | undefined = undefined;

  let error: ClassifiedError | null = null;
  let errorCount = 0;

  // Reset error state on route change (F-11 fix)
  $: if ($page.url.pathname) {
    error = null;
    errorCount = 0;
  }

  function handleError(event: ErrorEvent) {
    event.preventDefault();
    const classified = classifyError(event.error, "page load");
    error = classified;
    errorCount++;

    // Log to CloudWatch (without stack traces - security risk)
    logError(classified, {
      errorCount,
    });
  }

  function handleUnhandledRejection(event: PromiseRejectionEvent) {
    event.preventDefault();
    const classified = classifyError(event.reason, "async operation");
    error = classified;
    errorCount++;

    // Log to CloudWatch
    logError(classified, {
      errorCount,
      promiseRejection: true,
    });
  }

  function retry() {
    error = null;
    errorCount = 0;
    if (onRetry) {
      onRetry();
    } else {
      // Use goto() instead of window.location.reload() to preserve SvelteKit state (F-06 fix)
      goto($page.url.pathname, { invalidateAll: true });
    }
  }

  function goHome() {
    goto("/console");
  }

  onMount(() => {
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
  });

  onDestroy(() => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  });
</script>

{#if error}
  <div class="min-h-screen flex items-center justify-center p-4 bg-muted/20">
    <Card padding="xl" class="max-w-lg w-full border-destructive/20 bg-destructive-muted">
      <div class="flex flex-col items-center text-center">
        <div class="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle class="h-8 w-8 text-destructive" strokeWidth={2} />
        </div>

        <h1 class="text-2xl font-semibold text-foreground mb-2">
          {error.message || fallbackMessage}
        </h1>

        <p class="text-sm text-muted-foreground mb-6 max-w-md">
          {error.actionable}
        </p>

        {#if errorCount > 1}
          <p class="text-xs text-destructive mb-4">
            This error has occurred {errorCount} times. Consider refreshing the page or contacting support.
          </p>
        {/if}

        <div class="flex gap-3 flex-wrap justify-center">
          {#if showRetryButton && error.retryable}
            <Button variant="primary" size="md" on:click={retry}>
              <RefreshCcw class="h-4 w-4" strokeWidth={2} />
              Try again
            </Button>
          {/if}
          {#if showHomeButton}
            <Button variant="outline" size="md" on:click={goHome}>
              <Home class="h-4 w-4" strokeWidth={2} />
              Go to dashboard
            </Button>
          {/if}
        </div>

        {#if error.httpStatus}
          <p class="mt-6 text-xs text-muted-foreground font-mono">
            Error code: {error.httpStatus}
          </p>
        {/if}
      </div>
    </Card>
  </div>
{:else}
  <slot />
{/if}
