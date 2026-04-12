<script lang="ts">
  import { onMount } from "svelte";

  interface UserProfile {
    id: string; email: string; display_name: string | null;
    role: string; last_login_at: string | null; created_at: string;
    tenant_name: string; tenant_slug: string;
  }

  let profile: UserProfile | null = null;
  let loading = true;
  let error: string | null = null;

  async function loadProfile() {
    loading = true; error = null;
    try {
      const res = await fetch("/api/v1/user/profile");
      if (!res.ok) { error = `Failed to load profile (HTTP ${res.status})`; return; }
      const result = await res.json();
      profile = result.data ?? null;
      if (!profile) error = "No profile data returned";
    } catch (e) { error = (e as Error).message; } finally { loading = false; }
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "Never";
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function roleBadgeClass(role: string): string {
    if (role === "admin" || role === "owner") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (role === "viewer") return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  }

  onMount(() => { loadProfile(); });
</script>

<div class="p-8 max-w-2xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Your account details and membership information.</p>
  </div>

  {#if loading}
    <div class="space-y-4">
      {#each Array(5) as _}<div class="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>{/each}
    </div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-300 text-sm">{error}</p>
      <button on:click={loadProfile} class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button>
    </div>
  {:else if profile}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
      <div class="px-6 py-4 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Email</span>
        <span class="text-sm text-gray-900 dark:text-white">{profile.email}</span>
      </div>
      <div class="px-6 py-4 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Display Name</span>
        <span class="text-sm text-gray-900 dark:text-white">{profile.display_name ?? "—"}</span>
      </div>
      <div class="px-6 py-4 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Role</span>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {roleBadgeClass(profile.role)}">{profile.role}</span>
      </div>
      <div class="px-6 py-4 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Organization</span>
        <span class="text-sm text-gray-900 dark:text-white">{profile.tenant_name}</span>
      </div>
      <div class="px-6 py-4 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Last Login</span>
        <span class="text-sm text-gray-600 dark:text-gray-300">{formatDate(profile.last_login_at)}</span>
      </div>
      <div class="px-6 py-4 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Member Since</span>
        <span class="text-sm text-gray-600 dark:text-gray-300">{formatDate(profile.created_at)}</span>
      </div>
    </div>
    <div class="mt-6">
      <a href="/login" class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        Change Password
      </a>
    </div>
  {/if}
</div>
