<script lang="ts">
  export let data: any;
  let items = data.activity?.items || [];
</script>

<h1>Activity Feed</h1>
{#if data.error}
  <p class="error">{data.error}</p>
{:else}
  <ul class="feed">
    {#each items as ev}
      <li>
        <code>{ev.type}</code>
        <span>{ev.message || ev.summary || ev.detail}</span>
        <time>{ev.createdAt?.slice(0, 19).replace("T", " ")}</time>
      </li>
    {/each}
  </ul>
{/if}

<style>
  h1 {
    margin: 0 0 1rem;
  }
  .error {
    color: #dc2626;
  }
  ul.feed {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  ul.feed li {
    background: #1e1e1e;
    border: 1px solid #333;
    padding: 0.5rem 0.6rem;
    border-radius: 4px;
    display: grid;
    grid-template-columns: 120px 1fr 160px;
    gap: 0.75rem;
    align-items: center;
    font-size: 0.8rem;
  }
  code {
    background: #111;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.7rem;
    color: #93c5fd;
  }
  time {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: #888;
  }
  @media (max-width: 760px) {
    ul.feed li {
      grid-template-columns: 90px 1fr;
      grid-template-rows: auto auto;
    }
    time {
      grid-column: 1 / -1;
      text-align: left;
    }
  }
</style>
