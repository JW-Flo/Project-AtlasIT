<script lang="ts">
  import { onMount } from "svelte";
  let online = true;
  function update() {
    online = navigator.onLine;
  }
  onMount(() => {
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  });
</script>

{#if !online}
  <div class="offline" role="status" aria-live="polite">
    You are offline. Some data may be stale.
  </div>
{/if}

<style>
  .offline {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background: #7e22ce;
    color: #fff;
    padding: 0.5rem 1rem;
    font-size: 0.7rem;
    border-radius: 0 0 0.6rem 0.6rem;
    z-index: 600;
    box-shadow: 0 4px 14px -4px rgba(0, 0, 0, 0.4);
    letter-spacing: 0.05em;
  }
</style>
