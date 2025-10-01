<script lang="ts">
  export let width: string = "100%";
  export let height: string = "16px";
  export let radius: string = "4px";
</script>

<div
  class="skeleton"
  style={`width:${width};height:${height};border-radius:${radius}`}
></div>

<style>
  .skeleton {
    position: relative;
    overflow: hidden;
    background: linear-gradient(
      90deg,
      var(--color-surface) 0%,
      var(--color-surface-alt) 50%,
      var(--color-surface) 100%
    );
    background-size: 200% 100%;
    animation: skeleton 1.4s ease infinite;
  }
  @keyframes skeleton {
    0% {
      background-position: 0% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>
