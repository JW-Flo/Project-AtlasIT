<script lang="ts">
  import Button from '../primitives/Button.svelte';
  import { theme, setTheme } from '../../stores/theme';
  import { onMount } from 'svelte';

  interface NavItem { href: string; label: string; }
  export let nav: NavItem[] = [
    { href: '/console', label: 'Console' },
    { href: '/api/mock/compliance/snapshot', label: 'Raw JSON' }
  ];

  let current: string = '';
  onMount(() => current = location.pathname);
  let t: 'light' | 'dark' = 'dark';
  const unsub = theme.subscribe(v => t = v);
  function toggleTheme(){ setTheme(t === 'dark' ? 'light' : 'dark'); }
  onMount(() => () => unsub());
</script>

<div class="app-frame">
  <aside class="sidebar">
    <div class="logo">AtlasIT</div>
    <nav>
      {#each nav as item}
        <a href={item.href} class:item-active={current.startsWith(item.href)}>{item.label}</a>
      {/each}
    </nav>
  <div class="grow"></div>
  <Button size="sm" variant="subtle" ariaLabel="Toggle theme" on:click={toggleTheme}>{t === 'dark' ? 'Light Mode' : 'Dark Mode'}</Button>
  </aside>
  <main class="main">
    <slot />
  </main>
</div>

<style>
.app-frame { display:flex; min-height:100dvh; background:var(--color-bg); color:var(--color-text); }
.sidebar { width:200px; display:flex; flex-direction:column; gap:12px; padding:16px 14px; background:var(--color-surface-alt); border-right:1px solid var(--color-border); }
.logo { font-weight:600; font-size:18px; letter-spacing:.5px; margin-bottom:4px; }
.sidebar nav { display:flex; flex-direction:column; gap:6px; }
.sidebar a { text-decoration:none; font-size:13px; padding:6px 10px; border-radius:6px; color:var(--color-text-dim); transition:background .18s ease, color .18s ease; }
.sidebar a:hover { background:var(--color-surface); color:var(--color-text); }
.sidebar a.item-active { background:var(--color-accent); color:#fff; }
.main { flex:1; min-width:0; }
.grow { flex:1; }
@media (max-width:860px) { .sidebar { position:fixed; inset:0 auto 0 0; transform:translateX(0); width:170px; } .main { margin-left:170px; } }
</style>
