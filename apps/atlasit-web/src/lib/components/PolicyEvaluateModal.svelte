<script lang="ts">
  import AccessibleDialog from "./AccessibleDialog.svelte";
  import { ComplianceAPI } from "$lib/api/client";
  import type { EvaluatePolicyResponse } from "$lib/api/types";
  export let open = false;
  export let onClose: () => void;
  export let onEvaluated: (r: EvaluatePolicyResponse) => void;
  let policyKey = "";
  let inputJson = "{}";
  let evaluating = false;
  let error: string | null = null;
  let result: EvaluatePolicyResponse | null = null;
  function parseInput() {
    try {
      return JSON.parse(inputJson);
    } catch {
      return {};
    }
  }
  async function submit() {
    if (!policyKey) return;
    evaluating = true;
    error = null;
    result = null;
    try {
      const r = await ComplianceAPI.evaluatePolicy({
        policyKey,
        input: parseInput(),
      });
      result = r;
      onEvaluated(r);
    } catch (e: any) {
      error = e.body?.error || e.message;
    } finally {
      evaluating = false;
    }
  }
</script>

<AccessibleDialog {open} title="Evaluate Policy" {onClose} initialFocus="input">
  {#if error}<p class="error">{error}</p>{/if}
  <form on:submit|preventDefault={submit} class="form">
    <label
      >Policy Key<input
        bind:value={policyKey}
        placeholder="policy.hash or key"
        required
      /></label
    >
    <label
      >Input JSON<textarea
        bind:value={inputJson}
        class="json"
        spellcheck="false"
      /></label
    >
    <div class="actions">
      <button type="submit" disabled={!policyKey || evaluating}
        >{evaluating ? "Evaluating…" : "Evaluate"}</button
      >
      <button type="button" class="secondary" on:click={onClose}>Cancel</button>
    </div>
  </form>
  {#if result}
    <div class="result">
      <p class="meta">
        Hash: {result.hash} (deterministic: {String(
          result.meta?.deterministic
        )})
      </p>
      <pre>{JSON.stringify(result.result, null, 2)}</pre>
    </div>
  {/if}
</AccessibleDialog>
<!-- TODO: JSON validation + inline error, pretty/compact toggle, copy result button -->

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
  input,
  textarea {
    background: #111;
    border: 1px solid #333;
    color: #e2e8f0;
    padding: 0.5rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
  }
  textarea.json {
    min-height: 140px;
    font-family: monospace;
    line-height: 1.3;
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
  .result pre {
    background: #0f172a;
    padding: 0.75rem;
    border-radius: 6px;
    max-height: 260px;
    overflow: auto;
    font-size: 0.65rem;
  }
  .meta {
    font-size: 0.6rem;
    color: #64748b;
    margin: 0.25rem 0 0.5rem;
  }
</style>
