<script lang="ts">
  import { onMount, tick } from "svelte";
  import { fly } from "svelte/transition";
  import {
    MessageSquare,
    X,
    Send,
    Sparkles,
    ClipboardCheck,
    Zap,
    Loader2,
    ArrowRight,
    RotateCcw,
  } from "lucide-svelte";
  import CopilotMessage from "./CopilotMessage.svelte";

  export let open = false;
  export let onClose: () => void = () => {};

  interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    actions?: Array<{
      type: string;
      label: string;
      href?: string;
      payload?: Record<string, unknown>;
    }>;
  }

  let messages: Message[] = [];
  let inputValue = "";
  let loading = false;
  let conversationId: string | null = null;
  let messagesContainer: HTMLDivElement;
  let inputElement: HTMLTextAreaElement;

  const quickActions = [
    {
      id: "what_next" as const,
      label: "What should I do next?",
      description: "Get prioritized compliance actions",
      icon: Sparkles,
    },
    {
      id: "audit_prep" as const,
      label: "Prepare for audit",
      description: "Generate audit readiness checklist",
      icon: ClipboardCheck,
    },
    {
      id: "create_rule" as const,
      label: "Create automation rule",
      description: "Build a rule in plain English",
      icon: Zap,
    },
  ];

  async function sendMessage(content?: string, quickAction?: string) {
    const text = content ?? inputValue.trim();
    if (!text && !quickAction) return;

    inputValue = "";
    loading = true;

    if (!quickAction) {
      messages = [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          timestamp: new Date().toISOString(),
        },
      ];
    }

    await tick();
    scrollToBottom();

    try {
      const body: Record<string, string> = {};
      if (quickAction) {
        body.quickAction = quickAction;
        body.message = "";
      } else {
        body.message = text;
      }
      if (conversationId) body.conversationId = conversationId;

      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        messages = [
          ...messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: err.error === "Rate limit exceeded. Try again later."
              ? "You've reached the copilot rate limit. Please try again in a bit."
              : "Sorry, I'm having trouble right now. Please try again.",
            timestamp: new Date().toISOString(),
          },
        ];
        return;
      }

      const data = await res.json();
      conversationId = data.conversationId;
      messages = [...messages, data.message];
    } catch {
      messages = [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Connection error. Please check your network and try again.",
          timestamp: new Date().toISOString(),
        },
      ];
    } finally {
      loading = false;
      await tick();
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function newConversation() {
    messages = [];
    conversationId = null;
    inputValue = "";
  }

  // Focus input when panel opens
  $: if (open) {
    tick().then(() => inputElement?.focus());
  }

  // Handle Escape key
  function handleGlobalKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleGlobalKeydown} />

{#if open}
  <!-- Backdrop for mobile -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
    on:click={onClose}
  ></div>

  <aside
    class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] flex flex-col bg-card border-l shadow-2xl"
    transition:fly={{ x: 420, duration: 250, opacity: 1 }}
  >
    <!-- Header -->
    <div class="flex items-center justify-between h-14 px-4 border-b shrink-0">
      <div class="flex items-center gap-2">
        <div class="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles class="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 class="text-sm font-semibold">Compliance Copilot</h2>
          <p class="text-[10px] text-muted-foreground">AI-powered compliance assistant</p>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button
          class="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          on:click={newConversation}
          title="New conversation"
          aria-label="New conversation"
        >
          <RotateCcw class="h-4 w-4" />
        </button>
        <button
          class="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          on:click={onClose}
          aria-label="Close copilot"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div
      class="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      bind:this={messagesContainer}
    >
      {#if messages.length === 0}
        <!-- Welcome state -->
        <div class="flex flex-col items-center justify-center h-full text-center px-4">
          <div class="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <MessageSquare class="h-6 w-6 text-primary" />
          </div>
          <h3 class="text-base font-semibold mb-1">How can I help?</h3>
          <p class="text-sm text-muted-foreground mb-6">
            Ask about your compliance posture, audit readiness, or get recommendations.
          </p>

          <!-- Quick actions -->
          <div class="w-full space-y-2">
            {#each quickActions as action}
              <button
                class="flex items-center gap-3 w-full rounded-lg border px-3 py-3 text-left text-sm hover:bg-accent/50 transition-colors group"
                on:click={() => sendMessage(undefined, action.id)}
                disabled={loading}
              >
                <div class="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <svelte:component this={action.icon} class="h-4 w-4 text-primary" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium">{action.label}</div>
                  <div class="text-xs text-muted-foreground">{action.description}</div>
                </div>
                <ArrowRight class="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            {/each}
          </div>
        </div>
      {:else}
        {#each messages as msg (msg.id)}
          <CopilotMessage message={msg} />
        {/each}

        {#if loading}
          <div class="flex items-start gap-3">
            <div class="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles class="h-3.5 w-3.5 text-primary" />
            </div>
            <div class="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 class="h-4 w-4 animate-spin" />
              <span>Analyzing your compliance data...</span>
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Input -->
    <div class="border-t p-3 shrink-0">
      {#if messages.length > 0}
        <div class="flex gap-1.5 mb-2 overflow-x-auto pb-1">
          {#each quickActions as action}
            <button
              class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap hover:bg-accent/50 transition-colors shrink-0"
              on:click={() => sendMessage(undefined, action.id)}
              disabled={loading}
            >
              <svelte:component this={action.icon} class="h-3 w-3" />
              {action.label}
            </button>
          {/each}
        </div>
      {/if}

      <div class="flex items-end gap-2">
        <textarea
          bind:this={inputElement}
          bind:value={inputValue}
          on:keydown={handleKeydown}
          placeholder="Ask about your compliance..."
          class="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          rows="1"
          disabled={loading}
        ></textarea>
        <button
          class="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          on:click={() => sendMessage()}
          disabled={loading || !inputValue.trim()}
          aria-label="Send message"
        >
          <Send class="h-4 w-4" />
        </button>
      </div>
      <p class="text-[10px] text-muted-foreground mt-1.5 text-center">
        AI responses are based on your live compliance data. Always verify recommendations.
      </p>
    </div>
  </aside>
{/if}
