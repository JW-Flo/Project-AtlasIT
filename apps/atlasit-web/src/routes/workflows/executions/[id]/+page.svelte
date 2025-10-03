<script lang="ts">
  import { page } from "$app/stores";
  $: id = $page.params.id;
</script>

<h1>Workflow Execution</h1>
<p>Execution ID: <code>{id}</code></p>
<p>Detail view placeholder – show steps, status timeline, metrics.</p>
