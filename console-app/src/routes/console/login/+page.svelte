<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let email = "";
  let password = "";
  let error = "";
  let loading = false;

  async function login() {
    loading = true;
    error = "";
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (resp.ok) {
        goto("/console");
      } else {
        const data = await resp.json();
        if (resp.status === 410) {
          error =
            data.error +
            " This endpoint is deprecated. Ensure Cloudflare Access SSO is configured.";
        } else {
          error = data.error || "Login failed";
        }
      }
    } catch (e) {
      error = "Network error";
    }
    loading = false;
  }

  onMount(() => {
    // Check if already logged in
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          goto("/console");
        }
      });
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        AtlasIT Console Login
      </h2>
    </div>
    {#if import.meta.env.VITE_USE_CF_ACCESS === "true"}
      <div
        class="p-4 bg-white shadow rounded border border-indigo-100 space-y-3"
      >
        <p class="text-sm text-gray-700">
          Cloudflare Access SSO is enabled. If you reached this page without
          being automatically signed in, ensure your Access policy includes your
          email (<span class="font-mono"
            >{import.meta.env.VITE_SUPER_ADMIN_EMAIL || "super-admin"}</span
          >) and reload.
        </p>
        <button
          type="button"
          class="text-indigo-600 underline text-sm"
          on:click={() => location.reload()}>Reload</button
        >
      </div>
    {:else}
      <form class="mt-8 space-y-6" on:submit|preventDefault={login}>
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              bind:value={email}
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              bind:value={password}
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        {#if error}
          <div class="text-red-600 text-sm">{error}</div>
        {/if}

        <div>
          <button
            type="submit"
            disabled={loading}
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>
