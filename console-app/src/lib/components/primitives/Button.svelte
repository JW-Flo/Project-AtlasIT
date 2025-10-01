<script lang="ts">
  export let variant: 'primary' | 'outline' | 'subtle' | 'danger' = 'primary';
  export let size: 'sm' | 'md' = 'md';
  export let disabled: boolean = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let ariaLabel: string | undefined;
  const base = 'btn focus-ring';
  $: vClass =
    variant === 'primary' ? 'btn-primary' :
    variant === 'outline' ? 'btn-outline' :
    variant === 'danger' ? 'btn-danger' : 'btn-subtle';
  $: sClass = size === 'sm' ? 'btn-sm' : 'btn-md';
</script>

<button {type} class={`${base} ${vClass} ${sClass}`} {disabled} aria-label={ariaLabel}>
  <slot />
</button>

<style>
button { cursor: pointer; }
button:disabled { opacity:.55; cursor:not-allowed; }
</style>
