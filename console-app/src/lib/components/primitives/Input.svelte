<script lang="ts">
  export let value: string = "";
  export let placeholder: string = "";
  export let disabled: boolean = false;
  export let type: string = "text";
  export let ariaLabel: string | undefined;
  export let invalid: boolean = false;
  export let message: string | null = null; // error or helper
  export let name: string | undefined;
  export let required: boolean = false;
  function onInput(e: Event) {
    value = (e.target as HTMLInputElement).value;
  }
</script>

<div class="field-wrapper" class:invalid>
  <input
    {name}
    bind:value
    {placeholder}
    {disabled}
    {type}
    {required}
    aria-label={ariaLabel}
    class="input"
    aria-invalid={invalid}
    on:input={onInput}
  />
  {#if message}<div class="message" data-invalid={invalid}>{message}</div>{/if}
</div>

<style>
  .field-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .input {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 14px;
    color: var(--color-text);
    transition:
      border-color 0.18s ease,
      background 0.18s ease;
  }
  .input:focus {
    outline: 0;
    box-shadow: 0 0 0 3px var(--color-focus);
  }
  .field-wrapper.invalid .input {
    border-color: var(--color-critical);
  }
  .message {
    font-size: 12px;
    color: var(--color-text-dim);
  }
  .message[data-invalid="true"] {
    color: var(--color-critical);
  }
  .input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
