<script lang="ts">
  import Button from '../primitives/Button.svelte';
  import { theme, setTheme } from '../../stores/theme';
  import { onMount } from 'svelte';
  import { init as initUx } from '../../instrumentation/ux-metrics';
  import ToastContainer from '../feedback/ToastContainer.svelte';
  import { push as pushToast } from '../feedback/toastStore';

  import { getRuntimeConfig } from '../../config';
  interface NavItem { href: string; label: string; }
  export let nav: NavItem[] = [
    { href: '/console', label: 'Console' },
  ];

  let current: string = '';
  onMount(async () => {
    current = location.pathname;
    initUx();
    try {
      const cfg = await getRuntimeConfig();
      const base = cfg.complianceBase.replace(/\/$/, '');
      nav = [
        { href: '/console', label: 'Console' },
        { href: `${base}/snapshot`, label: 'Raw JSON' }
      ];
    } catch {
      // silent fallback keeps existing nav
    }
  });
  let t: 'light' | 'dark' = 'dark';
  const unsub = theme.subscribe(v => t = v);
  function toggleTheme(){ setTheme(t === 'dark' ? 'light' : 'dark'); }
  onMount(() => () => unsub());
</script>

<div class="app-frame">
  <a href="#main" class="skip-link">Skip to content</a>
  <aside class="sidebar">
    <div class="logo">AtlasIT</div>
    <nav>
      {#each nav as item}
        <a href={item.href} class:item-active={current.startsWith(item.href)}>{item.label}</a>
      {/each}
    </nav>
  <div class="grow"></div>
  <div class="actions">
    <Button size="sm" variant="subtle" ariaLabel="Toggle theme" on:click={toggleTheme}>{t === 'dark' ? 'Light Mode' : 'Dark Mode'}</Button>
    <Button size="sm" variant="outline" ariaLabel="Show demo toast" on:click={() => pushToast({ message: 'Demo toast', variant: 'info' })}>Toast</Button>
  </div>
  </aside>
  <main class="main" id="main">
    <slot />
  <ToastContainer />
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
.skip-link { position:absolute; left:-999px; top:0; background:var(--color-accent); color:#fff; padding:6px 10px; border-radius:6px; z-index:100; }
.skip-link:focus { left:10px; box-shadow:0 0 0 3px var(--color-focus); }
.grow { flex:1; }
.actions { display:flex; gap:8px; }
@media (max-width:860px) { .sidebar { position:fixed; inset:0 auto 0 0; transform:translateX(0); width:170px; } .main { margin-left:170px; } }
</style>
