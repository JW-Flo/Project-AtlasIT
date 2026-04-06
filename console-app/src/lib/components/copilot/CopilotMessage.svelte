<script lang="ts">
  import { Sparkles, User, ArrowRight } from "lucide-svelte";

  export let message: {
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
  };

  // Simple markdown-ish rendering: bold, code, links, lists
  function renderContent(text: string): string {
    return text
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-md p-3 text-xs overflow-x-auto my-2"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // Headers
      .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-3 mb-1">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="font-semibold mt-3 mb-1">$1</h3>')
      // Numbered lists
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      // Bullet lists
      .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      // Tables (basic)
      .replace(/^\|(.+)\|$/gm, (match) => {
        const cells = match.split("|").filter(Boolean).map((c) => c.trim());
        if (cells.every((c) => /^[-:]+$/.test(c))) return ""; // separator row
        return `<tr>${cells.map((c) => `<td class="border px-2 py-1 text-xs">${c}</td>`).join("")}</tr>`;
      })
      // Line breaks
      .replace(/\n\n/g, "</p><p class='mt-2'>")
      .replace(/\n/g, "<br>");
  }

  $: isUser = message.role === "user";
  $: rendered = renderContent(message.content);
</script>

<div class="flex items-start gap-3 {isUser ? 'flex-row-reverse' : ''}">
  {#if !isUser}
    <div class="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
      <Sparkles class="h-3.5 w-3.5 text-primary" />
    </div>
  {:else}
    <div class="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
      <User class="h-3.5 w-3.5 text-muted-foreground" />
    </div>
  {/if}

  <div class="flex-1 min-w-0 {isUser ? 'text-right' : ''}">
    <div
      class="inline-block rounded-lg px-3 py-2 text-sm leading-relaxed {isUser
        ? 'bg-primary text-primary-foreground max-w-[85%]'
        : 'bg-muted/50 max-w-full text-left'}"
    >
      {#if isUser}
        {message.content}
      {:else}
        <div class="copilot-content prose prose-sm dark:prose-invert max-w-none">
          {@html rendered}
        </div>
      {/if}
    </div>

    <!-- Action buttons -->
    {#if message.actions && message.actions.length > 0}
      <div class="flex flex-wrap gap-1.5 mt-2">
        {#each message.actions as action}
          {#if action.href}
            <a
              href={action.href}
              class="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
            >
              {action.label}
              <ArrowRight class="h-3 w-3" />
            </a>
          {/if}
        {/each}
      </div>
    {/if}

    <div class="text-[10px] text-muted-foreground mt-1 {isUser ? '' : ''}">
      {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </div>
  </div>
</div>

<style>
  :global(.copilot-content table) {
    border-collapse: collapse;
    width: 100%;
    margin: 0.5rem 0;
    font-size: 0.75rem;
  }
</style>
