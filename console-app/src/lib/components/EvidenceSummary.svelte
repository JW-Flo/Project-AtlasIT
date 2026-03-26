<script context="module" lang="ts">
  export interface EvidenceSummaryItem {
    hash: string;
    pack: string;
    subject?: string | null;
    createdAt: string;
  }
</script>

<script lang="ts">
  export let items: EvidenceSummaryItem[] = [];
  export let error: string | null = null;

  function shortHash(hash: string) {
    if (!hash) return hash;
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
  }

  function formatDate(value: string) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }
</script>

<div class="card" aria-live="polite">
  <div class="card-header">
    <h3>Recent Evidence</h3>
  </div>
  {#if error}
    <p class="error">{error}</p>
  {:else if !items.length}
    <p class="empty">No evidence records yet.</p>
  {:else}
    <ul>
      {#each items as item}
        <li>
          <div class="hash" title={item.hash}>{shortHash(item.hash)}</div>
          <div class="meta">
            <span class="pack">{item.pack}</span>
            {#if item.subject}
              <span class="subject">{item.subject}</span>
            {/if}
            <span class="time">{formatDate(item.createdAt)}</span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
.card {
  background: var(--color-surface);
  border-radius: 10px;
  padding: 16px;
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-header h3 { margin: 0; font-size: 1rem; font-weight: 600; }
.error { color: #f87171; font-size: 0.9rem; }
.empty { color: var(--color-text-dim); font-size: 0.9rem; }
ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
li { display: flex; flex-direction: column; gap: 4px; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.04); }
.hash { font-family: var(--font-mono, "JetBrains Mono", monospace); font-size: 0.85rem; }
.meta { display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.78rem; color: var(--color-text-dim); }
.pack { font-weight: 500; color: var(--color-text); }
.subject { background: rgba(59,130,246,0.15); color: #93c5fd; padding: 2px 6px; border-radius: 999px; }
.time { opacity: 0.8; }
</style>
