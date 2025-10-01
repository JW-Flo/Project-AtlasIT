<script lang="ts">
  import "../app.css";
</script>

<svelte:head>
  <title>AtlasIT Console</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<nav class="px-5 py-3 flex items-center gap-6 bg-[#121821] border-b border-white/5 text-sm">
  <a href="/" class="font-semibold tracking-tight">AtlasIT</a>
  <a href="/console" class="text-white/70 hover:text-white">Console</a>
  <a href="/api/mock/compliance/snapshot" class="text-white/50 hover:text-white/80">Raw JSON</a>
</nav>

<slot />
