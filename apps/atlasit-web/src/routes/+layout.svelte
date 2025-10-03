<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import ToastHost from "$lib/components/ToastHost.svelte";
  import OfflineBanner from "$lib/components/OfflineBanner.svelte";
  let mobileOpen = false;
  $: current = $page.url.pathname;
  const isActive = (p: string) =>
    current === p || (p !== "/" && current.startsWith(p + "/"));
  function toggleMobile() {
    mobileOpen = !mobileOpen;
  }
  // Close mobile on navigation change
  $: if (mobileOpen) {
    current; /* reactive dependency */
  }
  onMount(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("resize", () => {
        if (window.innerWidth > 860) mobileOpen = false;
      });
    }
  });
</script>

<header class="shell">
  <nav class="nav-bar">
    <div class="left">
      <a href="/" class="logo">
        <span class="badge">AI</span>
        <span class="name">AtlasIT</span>
      </a>
      <!-- Desktop Navigation -->
      <div class="desktop-links">
        <a
          href="/governance/compliance"
          class="nav-link"
          class:active={isActive("/governance/compliance")}>Dashboard</a
        >
        <a
          href="/onboarding"
          class="nav-link"
          class:active={isActive("/onboarding")}>Onboarding</a
        >
        <a
          href="/marketplace/slack"
          class="nav-link"
          class:active={isActive("/marketplace")}>Marketplace</a
        >
        <a
          href="/orchestrator"
          class="nav-link"
          class:active={isActive("/orchestrator")}>Orchestrator</a
        >
        <a
          href="/api-manager"
          class="nav-link"
          class:active={isActive("/api-manager")}>API Manager</a
        >
        <a
          href="/workflows"
          class="nav-link gradient"
          class:active={isActive("/workflows")}>JML Demo</a
        >
        <!-- IT Dropdown -->
        <div class="dd" data-label="IT">
          <button class="nav-link dd-btn"
            >IT <svg viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg
            ></button
          >
          <div class="dd-menu">
            <a
              href="/it/policies/templates"
              class:active={isActive("/it/policies/templates")}>Policies</a
            >
            <a href="/it/backup" class:active={isActive("/it/backup")}
              >Backup & Recovery</a
            >
          </div>
        </div>
        <!-- Security Dropdown -->
        <div class="dd" data-label="Security">
          <button class="nav-link dd-btn"
            >Security <svg viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg
            ></button
          >
          <div class="dd-menu">
            <a
              href="/security/incidents"
              class:active={isActive("/security/incidents")}>Security Center</a
            >
            <a
              href="/security/activity"
              class:active={isActive("/security/activity")}>Scanner</a
            >
          </div>
        </div>
        <!-- Governance Dropdown -->
        <div class="dd" data-label="Governance">
          <button class="nav-link dd-btn"
            >Governance <svg viewBox="0 0 24 24"
              ><path d="M19 9l-7 7-7-7" /></svg
            ></button
          >
          <div class="dd-menu">
            <a
              href="/governance/compliance"
              class:active={isActive("/governance/compliance")}>Compliance</a
            >
            <a
              href="/governance/evidence"
              class:active={isActive("/governance/evidence")}>Evidence</a
            >
          </div>
        </div>
      </div>
    </div>
    <div class="right">
      <div class="divider"></div>
      <a href="/login" class="btn blue">Login</a>
      <a href="/register" class="btn purple">Register</a>
      <button class="mobile-toggle" on:click={toggleMobile} aria-label="Menu">
        <svg viewBox="0 0 24 24"
          ><path
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          /></svg
        >
      </button>
    </div>
  </nav>
  <!-- Mobile Menu -->
  <div class="mobile-menu" class:open={mobileOpen}>
    <a
      href="/governance/compliance"
      class:active={isActive("/governance/compliance")}>Dashboard</a
    >
    <a href="/onboarding" class:active={isActive("/onboarding")}>Onboarding</a>
    <a href="/marketplace/slack" class:active={isActive("/marketplace")}
      >Marketplace</a
    >
    <a href="/orchestrator" class:active={isActive("/orchestrator")}
      >Orchestrator</a
    >
    <a href="/api-manager" class:active={isActive("/api-manager")}
      >API Manager</a
    >
    <a
      href="/it/policies/templates"
      class:active={isActive("/it/policies/templates")}>IT Policies</a
    >
    <a href="/it/backup" class:active={isActive("/it/backup")}
      >Backup & Recovery</a
    >
    <a href="/security/incidents" class:active={isActive("/security/incidents")}
      >Security Center</a
    >
    <a href="/security/activity" class:active={isActive("/security/activity")}
      >Scanner</a
    >
    <a
      href="/governance/compliance"
      class:active={isActive("/governance/compliance")}>Compliance</a
    >
    <a
      href="/governance/evidence"
      class:active={isActive("/governance/evidence")}>Evidence</a
    >
    <div class="mobile-auth">
      <a href="/login" class="block btn blue">Login</a>
      <a href="/register" class="block btn purple">Register</a>
    </div>
  </div>
  <div class="demo-banner">
    DEMO MODE · SAMPLE DATA RESETS REGULARLY AND IS NOT PRODUCTION
  </div>
</header>

<main class="main-container">
  <slot />
</main>

<ToastHost />
<OfflineBanner />

<style>
  :global(body) {
    background: #0f172a;
    color: #e2e8f0;
    margin: 0;
    font-family:
      system-ui,
      -apple-system,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      Arial,
      "Noto Sans",
      sans-serif;
  }
  header.shell {
    background: linear-gradient(90deg, #1e2633, #1f2937);
    border-bottom: 1px solid #283346;
  }
  .nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.55rem 1.25rem;
  }
  .left {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    text-decoration: none;
  }
  .badge {
    background: linear-gradient(90deg, #2563eb, #7e22ce);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.45rem 0.55rem;
    border-radius: 0.6rem;
    letter-spacing: 0.5px;
  }
  .name {
    font-weight: 600;
    font-size: 1rem;
    background: linear-gradient(90deg, #94a3b8, #cbd5e1);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .desktop-links {
    display: none;
    gap: 0.25rem;
    align-items: center;
  }
  @media (min-width: 900px) {
    .desktop-links {
      display: flex;
    }
    .mobile-toggle {
      display: none;
    }
  }
  .nav-link {
    position: relative;
    font-size: 0.78rem;
    padding: 0.55rem 0.9rem;
    border-radius: 0.7rem;
    color: #94a3b8;
    text-decoration: none;
    font-weight: 500;
    letter-spacing: 0.3px;
    transition:
      background 0.18s,
      color 0.18s;
  }
  .nav-link:hover {
    background: rgba(255, 255, 255, 0.07);
    color: #fff;
  }
  .nav-link.active,
  .nav-link.gradient {
    background: linear-gradient(90deg, #2563eb, #4f46e5);
    color: #fff;
  }
  .gradient {
    color: #fff;
  }
  .dd {
    position: relative;
  }
  .dd-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .dd-btn svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    fill: none;
  }
  .dd-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.35rem;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 0.6rem;
    padding: 0.4rem 0;
    display: none;
    min-width: 190px;
    box-shadow: 0 6px 18px -4px rgba(0, 0, 0, 0.4);
  }
  .dd:hover .dd-menu {
    display: block;
  }
  .dd-menu a {
    display: block;
    padding: 0.55rem 0.9rem;
    font-size: 0.75rem;
    color: #94a3b8;
    text-decoration: none;
  }
  .dd-menu a:hover,
  .dd-menu a.active {
    background: #334155;
    color: #fff;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }
  .divider {
    width: 1px;
    height: 28px;
    background: #334155;
  }
  .btn {
    font-size: 0.72rem;
    padding: 0.55rem 1rem;
    border-radius: 0.65rem;
    text-decoration: none;
    font-weight: 500;
    letter-spacing: 0.4px;
    display: inline-block;
  }
  .btn.blue {
    background: #2563eb;
    color: #fff;
  }
  .btn.blue:hover {
    background: #1d4ed8;
  }
  .btn.purple {
    background: #7e22ce;
    color: #fff;
  }
  .btn.purple:hover {
    background: #6d21b5;
  }
  .btn.block {
    display: block;
    text-align: center;
  }
  .mobile-toggle {
    background: transparent;
    border: none;
    color: #94a3b8;
    padding: 0.4rem;
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  .mobile-toggle:hover {
    color: #fff;
  }
  .mobile-toggle svg {
    width: 26px;
    height: 26px;
  }
  .mobile-menu {
    display: none;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.75rem 1.25rem 1.25rem;
    background: #1e293b;
    border-top: 1px solid #334155;
  }
  .mobile-menu a {
    text-decoration: none;
    font-size: 0.78rem;
    padding: 0.55rem 0.75rem;
    color: #94a3b8;
    border-radius: 0.55rem;
  }
  .mobile-menu a:hover,
  .mobile-menu a.active {
    background: #334155;
    color: #fff;
  }
  .mobile-menu.open {
    display: flex;
  }
  @media (min-width: 900px) {
    .mobile-menu {
      display: none !important;
    }
  }
  .mobile-auth {
    border-top: 1px solid #334155;
    margin-top: 0.65rem;
    padding-top: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .demo-banner {
    margin: 0 auto;
    margin-top: 0.65rem;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    background: linear-gradient(90deg, #1e293b, #312e81);
    border: 1px solid #283346;
    color: #cbd5e1;
    padding: 0.65rem 1rem;
    border-radius: 0.65rem;
    max-width: 980px;
    text-align: center;
    font-weight: 500;
  }
  .main-container {
    max-width: 1200px;
    margin: 1.4rem auto 3rem;
    padding: 0 1.4rem;
  }
</style>
