<script lang="ts">
  import { cn } from "$lib/utils";

  export let value: string = "";
  export let type: string = "text";
  export let placeholder: string = "";
  export let disabled: boolean = false;
  export let readonly: boolean = false;
  export let required: boolean = false;
  export let id: string = "";
  export let name: string = "";
  export let autocomplete: string | undefined = undefined;
  export let inputmode:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search"
    | undefined = undefined;
  export let min: string | number | undefined = undefined;
  export let max: string | number | undefined = undefined;
  export let step: string | number | undefined = undefined;
  export let invalid: boolean = false;
  export let size: "sm" | "md" | "lg" = "md";
  let className: string = "";
  export { className as class };

  const sizes = {
    sm: "h-8 px-2.5 text-xs rounded-md",
    md: "h-9 px-3 text-sm",
    lg: "h-11 px-4 text-base",
  };
</script>

<input
  {id}
  {name}
  {type}
  {placeholder}
  {disabled}
  {readonly}
  {required}
  {autocomplete}
  {inputmode}
  {min}
  {max}
  {step}
  bind:value
  aria-invalid={invalid || undefined}
  class={cn(
    "flex w-full rounded-lg border bg-background text-foreground",
    "transition-colors duration-fast",
    "placeholder:text-muted-foreground/70",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground file:mr-3",
    "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-ring-primary",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
    "read-only:bg-muted read-only:cursor-not-allowed",
    invalid
      ? "border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_3px_hsl(var(--destructive)/0.18)]"
      : "border-input",
    sizes[size],
    className,
  )}
  on:input
  on:change
  on:blur
  on:focus
  on:keydown
/>
