<script lang="ts">
  import "../app.css";
  import AppFrame from "$lib/components/layout/AppFrame.svelte";
</script>

<svelte:head>
  <title>AtlasIT Console</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<AppFrame>
  <slot />
</AppFrame>
