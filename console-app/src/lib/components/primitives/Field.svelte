<script lang="ts">
  export let label: string;
  export let hint: string | null = null;
  export let error: string | null = null;
  export let forId: string | undefined;
  export let required: boolean = false;
</script>

<label class="field-label" for={forId}>{label}{#if required}<span class="req">*</span>{/if}</label>
<div class="slot-wrap"><slot /></div>
{#if error}
  <div class="field-msg error" role="alert">{error}</div>
{:else if hint}
  <div class="field-msg hint">{hint}</div>
{/if}

<style>
.field-label { font-size:13px; font-weight:500; display:flex; align-items:center; gap:4px; }
.req { color: var(--color-critical); }
.slot-wrap { margin-top:4px; }
.field-msg { font-size:12px; margin-top:4px; }
.field-msg.hint { color: var(--color-text-dim); }
.field-msg.error { color: var(--color-critical); }
</style>
