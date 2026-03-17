<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Avatar from "$lib/components/ui/avatar.svelte";
  import { session, fetchSession } from "$lib/stores/session";
  import { setTheme, theme } from "$lib/stores/theme";
  import { User, Bell, Shield, Save, Sun, Moon, AlertTriangle } from "lucide-svelte";

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];
  let activeTab = "profile";

  // Profile state
  let loading = true;
  let displayName = "";
  let email = "";
  let roles: string[] = [];
  let tenantId = "";
  let savingProfile = false;

  // Preferences state
  let prefsLoading = true;
  let emailOnSync = false;
  let emailOnCompliance = false;
  let inAppAlerts = true;
  let savingPrefs = false;

  // Password state
  let currentPassword = "";
  let newPassword = "";
  let confirmPassword = "";
  let passwordError = "";
  let savingPassword = false;

  // Theme
  let t: "light" | "dark" = "dark";
  const unsub = theme.subscribe((v) => (t = v));

  $: initials = displayName
    ? displayName
        .split(/[\s@]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0].toUpperCase())
        .join("")
    : "?";

  async function loadProfile() {
    loading = true;
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      const data: { displayName?: string; email?: string; roles?: string[]; tenantId?: string } = await res.json();
      displayName = data.displayName || "";
      email = data.email || "";
      roles = data.roles || [];
      tenantId = data.tenantId || "";
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to load profile", variant: "error" });
    } finally {
      loading = false;
    }
  }

  async function loadPreferences() {
    prefsLoading = true;
    try {
      const res = await fetch("/api/user/preferences");
      if (!res.ok) throw new Error("Failed to load preferences");
      const prefs: Record<string, string> = await res.json();
      emailOnSync = prefs.notification_email_on_sync === "true";
      emailOnCompliance = prefs.notification_email_on_compliance === "true";
      inAppAlerts = prefs.notification_in_app_alerts !== "false";
    } catch {
    } finally {
      prefsLoading = false;
    }
  }

  async function saveProfile() {
    savingProfile = true;
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save profile");
      }
      pushToast({ message: "Profile updated", variant: "success" });
      // Refresh session store so AppFrame updates
      session.update((s) => (s ? { ...s, displayName } : s));
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to save", variant: "error" });
    } finally {
      savingProfile = false;
    }
  }

  async function saveNotificationPrefs() {
    savingPrefs = true;
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          notification_email_on_sync: String(emailOnSync),
          notification_email_on_compliance: String(emailOnCompliance),
          notification_in_app_alerts: String(inAppAlerts),
        }),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      pushToast({ message: "Preferences saved", variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to save", variant: "error" });
    } finally {
      savingPrefs = false;
    }
  }

  async function changePassword() {
    passwordError = "";
    if (newPassword.length < 8) {
      passwordError = "New password must be at least 8 characters";
      return;
    }
    if (newPassword !== confirmPassword) {
      passwordError = "Passwords do not match";
      return;
    }
    savingPassword = true;
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        passwordError = data.error || "Failed to change password";
        return;
      }
      pushToast({ message: "Password changed successfully", variant: "success" });
      currentPassword = "";
      newPassword = "";
      confirmPassword = "";
    } catch (e: any) {
      passwordError = e?.message || "Failed to change password";
    } finally {
      savingPassword = false;
    }
  }

  onMount(() => {
    loadProfile();
    loadPreferences();
    return () => unsub();
  });
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-semibold tracking-tight">My Account</h1>

  <div class="flex gap-1 border-b">
    {#each tabs as tab}
      <button
        class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px {activeTab === tab.id
          ? 'text-foreground border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground'}"
        on:click={() => (activeTab = tab.id)}
      >
        <svelte:component this={tab.icon} class="h-4 w-4" />
        {tab.label}
      </button>
    {/each}
  </div>

  {#if activeTab === "profile"}
    {#if loading}
      <div class="space-y-4">
        {#each [1, 2, 3] as _}
          <Skeleton class="h-12 rounded-lg" />
        {/each}
      </div>
    {:else}
      <Card>
        <CardContent class="pt-6 space-y-5">
          <div class="flex items-center gap-4">
            <Avatar {initials} size="lg" class="h-16 w-16 text-xl" />
            <div>
              <div class="text-lg font-semibold">{displayName || email}</div>
              <div class="text-sm text-muted-foreground">{tenantId}</div>
            </div>
          </div>

          <div class="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input id="display-name" bind:value={displayName} placeholder="Your name" />
          </div>

          <div class="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
            <p class="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {#if roles.length > 0}
            <div class="space-y-2">
              <Label>Roles</Label>
              <div class="flex gap-2 flex-wrap">
                {#each roles as role}
                  <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {role}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <div class="pt-2">
            <Button on:click={saveProfile} disabled={savingProfile}>
              <Save class="h-4 w-4 mr-1.5" />
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    {/if}
  {/if}

  {#if activeTab === "preferences"}
    <Card>
      <CardContent class="pt-6 space-y-6">
        <!-- Theme -->
        <div class="space-y-3">
          <Label>Theme</Label>
          <div class="flex gap-2">
            <Button
              variant={t === "light" ? "default" : "outline"}
              on:click={() => setTheme("light")}
            >
              <Sun class="h-4 w-4 mr-1.5" />
              Light
            </Button>
            <Button
              variant={t === "dark" ? "default" : "outline"}
              on:click={() => setTheme("dark")}
            >
              <Moon class="h-4 w-4 mr-1.5" />
              Dark
            </Button>
          </div>
        </div>

        <!-- Notification preferences -->
        <div class="space-y-3">
          <Label>Notification Preferences</Label>
          {#if prefsLoading}
            <Skeleton class="h-24 rounded-lg" />
          {:else}
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" bind:checked={emailOnSync} class="h-4 w-4 rounded border-input" />
                <span class="text-sm">Email on directory sync events</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" bind:checked={emailOnCompliance} class="h-4 w-4 rounded border-input" />
                <span class="text-sm">Email on compliance score changes</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" bind:checked={inAppAlerts} class="h-4 w-4 rounded border-input" />
                <span class="text-sm">In-app alert notifications</span>
              </label>
            </div>
            <div class="pt-2">
              <Button on:click={saveNotificationPrefs} disabled={savingPrefs}>
                <Save class="h-4 w-4 mr-1.5" />
                {savingPrefs ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          {/if}
        </div>
      </CardContent>
    </Card>
  {/if}

  {#if activeTab === "security"}
    <Card>
      <CardContent class="pt-6 space-y-5">
        <div class="space-y-1">
          <h3 class="text-base font-semibold">Change Password</h3>
          <p class="text-sm text-muted-foreground">Update your account password</p>
        </div>

        {#if passwordError}
          <Alert variant="destructive">
            <AlertTriangle class="h-4 w-4" />
            <p class="pl-7">{passwordError}</p>
          </Alert>
        {/if}

        <div class="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input id="current-password" type="password" bind:value={currentPassword} />
        </div>

        <div class="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input id="new-password" type="password" bind:value={newPassword} placeholder="At least 8 characters" />
        </div>

        <div class="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input id="confirm-password" type="password" bind:value={confirmPassword} />
        </div>

        <div class="pt-2">
          <Button on:click={changePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}>
            <Shield class="h-4 w-4 mr-1.5" />
            {savingPassword ? "Changing..." : "Change Password"}
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
