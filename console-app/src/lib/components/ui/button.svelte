<script lang="ts">
  import { cn } from "$lib/utils";

  type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "link";
  type Size = "xs" | "sm" | "md" | "lg" | "icon-sm" | "icon" | "icon-lg";

  export let variant: Variant = "primary";
  export let size: Size = "md";
  export let href: string | undefined = undefined;
  export let target: string | undefined = undefined;
  export let rel: string | undefined = undefined;
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let type: "button" | "submit" | "reset" = "button";
  export let fullWidth: boolean = false;
  let className: string = "";
  export { className as class };

  const variants: Record<Variant, string> = {
    primary:
      "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover active:bg-primary-hover/90 focus-visible:shadow-ring-primary",
    secondary:
      "bg-secondary text-secondary-foreground border border-border hover:bg-accent hover:border-border-strong",
    outline:
      "bg-transparent text-foreground border border-border hover:bg-accent hover:border-border-strong",
    ghost: "bg-transparent text-foreground hover:bg-accent",
    destructive:
      "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
    success: "bg-success text-success-foreground shadow-xs hover:bg-success/90",
    link: "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
  };

  const sizes: Record<Size, string> = {
    xs: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
    sm: "h-8 px-3 text-sm gap-1.5 rounded-md",
    md: "h-9 px-4 text-sm gap-2",
    lg: "h-11 px-5 text-md gap-2.5",
    "icon-sm": "h-7 w-7 rounded-md",
    icon: "h-9 w-9",
    "icon-lg": "h-11 w-11",
  };

  $: classes = cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium",
    "transition-all duration-fast ease-out-quart",
    "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
    "focus-visible:outline-none",
    fullWidth && "w-full",
    variants[variant],
    sizes[size],
    className,
  );
</script>

{#if href}
  <a {href} {target} {rel} class={classes} aria-disabled={disabled}>
    {#if loading}
      <svg
        class="animate-spin h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
        <path
          d="M22 12a10 10 0 00-10-10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    {/if}
    <slot />
  </a>
{:else}
  <button {type} disabled={disabled || loading} class={classes} on:click on:focus on:blur>
    {#if loading}
      <svg
        class="animate-spin h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
        <path
          d="M22 12a10 10 0 00-10-10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    {/if}
    <slot />
  </button>
{/if}
