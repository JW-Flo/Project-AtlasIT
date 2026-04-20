<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { tourState, nextStep, prevStep, skipTour, type TourState } from "./tour-store";
  import { TOUR_STEPS, type TourStep } from "./tour-steps";
  import { ArrowLeft, ArrowRight, X } from "lucide-svelte";

  let state: TourState = { active: false, currentStep: 0, completed: false };
  const unsub = tourState.subscribe((s) => (state = s));
  onDestroy(unsub);

  let targetRect: DOMRect | null = null;
  let tooltipEl: HTMLDivElement;
  let resizeObserver: ResizeObserver | null = null;
  let animating = false;

  $: step = state.active && state.currentStep < TOUR_STEPS.length ? TOUR_STEPS[state.currentStep] : null;
  $: isLastStep = state.currentStep >= TOUR_STEPS.length - 1;

  $: if (step) {
    navigateAndHighlight(step);
  }

  async function navigateAndHighlight(s: TourStep) {
    if (s.route && window.location.pathname !== s.route) {
      window.location.href = s.route + "?demo=true";
      return;
    }
    await tick();
    // Wait for DOM to settle after navigation
    setTimeout(() => findAndHighlight(s.selector), 300);
  }

  function findAndHighlight(selector: string) {
    const el = document.querySelector(selector);
    if (!el) {
      targetRect = null;
      return;
    }
    updateRect(el as HTMLElement);
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(() => updateRect(el as HTMLElement));
    resizeObserver.observe(el);

    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function updateRect(el: HTMLElement) {
    animating = true;
    targetRect = el.getBoundingClientRect();
    setTimeout(() => (animating = false), 200);
  }

  function handleNext() {
    if (isLastStep) {
      skipTour();
    } else {
      nextStep();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!state.active) return;
    if (e.key === "Escape") skipTour();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "ArrowLeft" && state.currentStep > 0) prevStep();
  }

  $: clipPath = targetRect
    ? `polygon(
        0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
        ${targetRect.left - 6}px ${targetRect.top - 6}px,
        ${targetRect.left - 6}px ${targetRect.bottom + 6}px,
        ${targetRect.right + 6}px ${targetRect.bottom + 6}px,
        ${targetRect.right + 6}px ${targetRect.top - 6}px,
        ${targetRect.left - 6}px ${targetRect.top - 6}px
      )`
    : "none";

  $: tooltipStyle = (() => {
    if (!targetRect || !step) return "display:none";
    const pad = 16;
    let top = 0;
    let left = 0;
    switch (step.placement) {
      case "bottom":
        top = targetRect.bottom + pad;
        left = targetRect.left + targetRect.width / 2;
        break;
      case "top":
        top = targetRect.top - pad;
        left = targetRect.left + targetRect.width / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - pad;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + pad;
        break;
    }
    const transform =
      step.placement === "bottom" ? "translate(-50%, 0)" :
      step.placement === "top" ? "translate(-50%, -100%)" :
      step.placement === "left" ? "translate(-100%, -50%)" :
      "translate(0, -50%)";
    return `position:fixed;top:${top}px;left:${left}px;transform:${transform};z-index:10001`;
  })();

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("scroll", () => {
      if (step) findAndHighlight(step.selector);
    }, true);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      resizeObserver?.disconnect();
    };
  });
</script>

{#if state.active && step}
  <!-- Overlay with cutout -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 z-[10000] transition-[clip-path] duration-300 ease-out"
    style="background:rgba(0,0,0,0.55);clip-path:{clipPath}"
    on:click={skipTour}
  ></div>

  <!-- Spotlight ring around target -->
  {#if targetRect}
    <div
      class="fixed z-[10000] pointer-events-none rounded-lg ring-2 ring-primary/60 transition-all duration-300"
      style="top:{targetRect.top - 6}px;left:{targetRect.left - 6}px;width:{targetRect.width + 12}px;height:{targetRect.height + 12}px"
    ></div>
  {/if}

  <!-- Tooltip -->
  <div
    bind:this={tooltipEl}
    style={tooltipStyle}
    class="w-80 max-w-[90vw] bg-popover border border-border rounded-xl shadow-2xl p-5 animate-scale-in"
    role="dialog"
    aria-label="Tour step {state.currentStep + 1} of {TOUR_STEPS.length}"
  >
    <div class="flex items-start justify-between mb-3">
      <div>
        <div class="text-2xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Step {state.currentStep + 1} of {TOUR_STEPS.length}
        </div>
        <h3 class="text-sm font-semibold text-foreground">{step.title}</h3>
      </div>
      <button
        on:click={skipTour}
        class="h-7 w-7 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center -mr-1 -mt-1"
        aria-label="Skip tour"
      >
        <X class="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
    <p class="text-xs text-muted-foreground leading-relaxed mb-4">{step.description}</p>

    <div class="flex items-center justify-between">
      <div class="flex gap-1">
        {#each TOUR_STEPS as _, i}
          <div class="h-1.5 rounded-full transition-all duration-200 {i === state.currentStep ? 'w-4 bg-primary' : i < state.currentStep ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-muted-foreground/20'}"></div>
        {/each}
      </div>
      <div class="flex items-center gap-1.5">
        {#if state.currentStep > 0}
          <button
            on:click={prevStep}
            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ArrowLeft class="h-3 w-3" strokeWidth={2.5} />
            Back
          </button>
        {/if}
        <button
          on:click={handleNext}
          class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          {isLastStep ? "Finish" : "Next"}
          {#if !isLastStep}
            <ArrowRight class="h-3 w-3" strokeWidth={2.5} />
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
