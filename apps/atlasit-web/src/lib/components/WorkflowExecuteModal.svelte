<script lang="ts">
  import AccessibleDialog from "./AccessibleDialog.svelte";
  import { ComplianceAPI } from "$lib/api/client";
  import type { WorkflowExecutionResponse } from "$lib/api/types";
  export let open = false;
  export let onClose: () => void;
  export let onExecuted: (w: WorkflowExecutionResponse) => void;
  let type = "joiner";
  let subjectRef = "";
  let idempotencyKey = "";
  let executing = false;
  let error: string | null = null;
  let result: WorkflowExecutionResponse | null = null;
  function ensureKey() {
    if (!idempotencyKey) idempotencyKey = crypto.randomUUID();
  }
  async function submit() {
    if (!subjectRef) return;
    executing = true;
    error = null;
    result = null;
    ensureKey();
    try {
      const r = await ComplianceAPI.executeWorkflow({
        type,
        subjectRef,
        idempotencyKey,
      });
      result = r;
      onExecuted(r);
    } catch (e: any) {
      error = e.body?.error || e.message;
    } finally {
      executing = false;
    }
  }
</script>

<AccessibleDialog
  {open}
  title="Execute Workflow"
  {onClose}
  initialFocus="select"
>
  {#if error}<p class="error">{error}</p>{/if}
  <form on:submit|preventDefault={submit} class="form">
    <label
      >Type
      <select bind:value={type}>
        <option value="joiner">Joiner</option>
        <option value="mover">Mover</option>
        <option value="leaver">Leaver</option>
      </select>
    </label>
    <label
      >Subject Ref<input
        bind:value={subjectRef}
        placeholder="user@example.com"
        required
      /></label
    >
    <label
      >Idempotency Key (optional)<input
        bind:value={idempotencyKey}
        placeholder="auto-generate if blank"
      /></label
    >
    <div class="actions">
      <button type="submit" disabled={!subjectRef || executing}
        >{executing ? "Executing…" : "Execute"}</button
      >
      <button type="button" class="secondary" on:click={onClose}>Cancel</button>
    </div>
  </form>
  {#if result}
    <div class="result">
      <p class="meta">Execution ID: {result.id}</p>
      <p>Status: {result.status}</p>
    </div>
  {/if}
</AccessibleDialog>
<!-- TODO: show execution link, poll for status updates -->

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  label {
    display: flex;
    flex-direction: column;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    gap: 0.35rem;
    color: #94a3b8;
  }
  select,
  input {
    background: #111;
    border: 1px solid #333;
    color: #e2e8f0;
    padding: 0.5rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  button {
    background: #2563eb;
    color: #fff;
    border: none;
    padding: 0.55rem 0.9rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.7rem;
  }
  button.secondary {
    background: #334155;
  }
  button:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .error {
    color: #dc2626;
    font-size: 0.7rem;
  }
  .result {
    margin-top: 1rem;
  }
  .meta {
    font-size: 0.6rem;
    color: #64748b;
    margin: 0.25rem 0 0.5rem;
  }
</style>
