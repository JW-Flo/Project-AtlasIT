<script lang="ts">
  import { onMount } from "svelte";

  interface Questionnaire {
    id: string;
    name: string;
    question_count: number;
    source_format: string;
    created_at: string;
  }

  interface QuestionMapping {
    questionIndex: number;
    questionText: string;
    section: string | null;
    mappedControls: string[];
    confidence: number;
  }

  interface GeneratedResponse {
    questionIndex: number;
    questionText: string;
    response: string;
    evidenceRefs: string[];
    mappedControls: string[];
  }

  type View = "list" | "upload" | "review" | "responses";

  let view: View = $state("list");
  let questionnaires: Questionnaire[] = $state([]);
  let loading = $state(true);
  let error: string | null = $state(null);
  let banner: { type: "info" | "error"; msg: string } | null = $state(null);

  // Upload state
  let rawText = $state("");
  let questionnaireName = $state("");
  let parsing = $state(false);
  let parsedMappings: QuestionMapping[] = $state([]);
  let questionnaireId: string | null = $state(null);

  // Generate state
  let generating = $state(false);
  let generateProgress = $state(0);
  let responses: GeneratedResponse[] = $state([]);

  // Feedback state
  let feedbackSending: Record<number, boolean> = $state({});
  let editedTexts: Record<number, string> = $state({});
  let feedbackStatus: Record<number, string> = $state({});

  async function loadList() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/v1/trust/questionnaire/list");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { questionnaires?: Questionnaire[] };
      questionnaires = json.questionnaires ?? [];
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function parseText() {
    if (!rawText.trim()) return;
    parsing = true;
    banner = null;
    try {
      const res = await fetch("/api/v1/trust/questionnaire/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText,
          name: questionnaireName || "Untitled questionnaire",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json() as {
        mappings?: QuestionMapping[];
        questionnaireId?: string;
      };
      parsedMappings = json.mappings ?? [];
      questionnaireId = json.questionnaireId ?? null;
      if (parsedMappings.length === 0) {
        banner = { type: "error", msg: "No questions detected. Try pasting a longer questionnaire." };
      } else {
        view = "review";
      }
    } catch (e) {
      banner = { type: "error", msg: (e as Error).message };
    } finally {
      parsing = false;
    }
  }

  async function generateResponses() {
    generating = true;
    generateProgress = 0;
    banner = null;
    try {
      const res = await fetch("/api/v1/trust/questionnaire/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mappings: parsedMappings,
          questionnaireId,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json() as { responses?: GeneratedResponse[] };
      responses = json.responses ?? [];
      editedTexts = {};
      feedbackStatus = {};
      view = "responses";
      banner = { type: "info", msg: `Generated ${responses.length} responses. Review and provide feedback.` };
    } catch (e) {
      banner = { type: "error", msg: (e as Error).message };
    } finally {
      generating = false;
    }
  }

  async function submitFeedback(idx: number, feedback: "accepted" | "rejected" | "edited") {
    feedbackSending = { ...feedbackSending, [idx]: true };
    try {
      const body: Record<string, unknown> = {
        questionnaireId,
        questionIndex: idx,
        feedback,
      };
      if (feedback === "edited" && editedTexts[idx]) {
        body.editedText = editedTexts[idx];
      }
      const res = await fetch("/api/v1/trust/questionnaire/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      feedbackStatus = { ...feedbackStatus, [idx]: feedback };
    } catch (e) {
      banner = { type: "error", msg: `Feedback failed: ${(e as Error).message}` };
    } finally {
      feedbackSending = { ...feedbackSending, [idx]: false };
    }
  }

  function startNew() {
    view = "upload";
    rawText = "";
    questionnaireName = "";
    parsedMappings = [];
    questionnaireId = null;
    responses = [];
    editedTexts = {};
    feedbackStatus = {};
    banner = null;
  }

  function backToList() {
    view = "list";
    banner = null;
    loadList();
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  onMount(loadList);
</script>

<svelte:head>
  <title>Questionnaire AI · AtlasIT</title>
</svelte:head>

<div class="p-8 max-w-4xl mx-auto animate-fade-in">
  <div class="mb-6">
    <a href="/console/settings/trust" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
      ← Trust Center
    </a>
    <h1 class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Questionnaire AI</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      Paste a vendor security questionnaire and get AI-generated responses grounded in your real compliance evidence and connected adapter data.
    </p>
  </div>

  {#if banner}
    <div class="mb-5 rounded-lg p-4 text-sm border
      {banner.type === 'error'
        ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
        : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'}">
      {banner.msg}
    </div>
  {/if}

  {#if view === "list"}
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Past questionnaires</h2>
      <button
        onclick={startNew}
        class="h-9 px-4 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
      >
        New questionnaire
      </button>
    </div>

    {#if loading}
      <div class="space-y-3">
        {#each Array(3) as _}
          <div class="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        {/each}
      </div>
    {:else if error}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-300 text-sm">{error}</p>
        <button onclick={loadList} class="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md">Retry</button>
      </div>
    {:else if questionnaires.length === 0}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-12 text-center">
        <div class="text-4xl mb-3">📋</div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          No questionnaires yet. Paste a vendor security questionnaire to get started.
        </p>
        <button
          onclick={startNew}
          class="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          Upload your first questionnaire
        </button>
      </div>
    {:else}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        {#each questionnaires as q (q.id)}
          <div class="px-5 py-4 flex items-center justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="font-medium text-sm text-gray-900 dark:text-white truncate">{q.name}</div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {q.question_count} questions · {q.source_format ?? "text"} · {formatDate(q.created_at)}
              </p>
            </div>
          </div>
        {/each}
      </div>
    {/if}

  {:else if view === "upload"}
    <div class="flex items-center gap-3 mb-4">
      <button onclick={backToList} class="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Back</button>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Upload questionnaire</h2>
    </div>

    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div class="mb-4">
        <label for="q-name" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Questionnaire name
        </label>
        <input
          id="q-name"
          type="text"
          bind:value={questionnaireName}
          placeholder="e.g. Acme Corp Security Review 2026"
          class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div class="mb-4">
        <label for="q-text" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Paste questionnaire text
        </label>
        <textarea
          id="q-text"
          bind:value={rawText}
          rows={12}
          placeholder="Paste the full questionnaire text here. Section headers in ALL CAPS will be detected automatically. Each question should be on its own line."
          class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y font-mono"
        ></textarea>
        <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Supports CSV, plain text, or structured questionnaire formats. Questions are auto-mapped to compliance controls.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          onclick={parseText}
          disabled={parsing || !rawText.trim()}
          class="h-10 px-5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {#if parsing}
            <span class="inline-flex items-center gap-2">
              <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
                <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
              Parsing...
            </span>
          {:else}
            Parse & map controls
          {/if}
        </button>
        <button onclick={backToList} class="h-10 px-4 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Cancel
        </button>
      </div>
    </div>

  {:else if view === "review"}
    <div class="flex items-center gap-3 mb-4">
      <button onclick={() => { view = "upload"; }} class="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Edit text</button>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        Review mapped questions
        <span class="font-normal text-sm text-gray-500 dark:text-gray-400">({parsedMappings.length} questions)</span>
      </h2>
    </div>

    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 mb-4">
      {#each parsedMappings as m, i (m.questionIndex)}
        <div class="px-5 py-4">
          <div class="flex items-start gap-3">
            <span class="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5 shrink-0">Q{m.questionIndex + 1}</span>
            <div class="min-w-0 flex-1">
              {#if m.section}
                <div class="text-2xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-1">{m.section}</div>
              {/if}
              <p class="text-sm text-gray-900 dark:text-white">{m.questionText}</p>
              <div class="mt-2 flex items-center gap-2 flex-wrap">
                {#if m.mappedControls.length > 0}
                  {#each m.mappedControls as ctrl}
                    <span class="inline-flex items-center px-1.5 py-0.5 text-2xs font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {ctrl}
                    </span>
                  {/each}
                  <span class="text-2xs text-gray-400 dark:text-gray-500">
                    {Math.round(m.confidence * 100)}% confidence
                  </span>
                {:else}
                  <span class="text-2xs text-gray-400 dark:text-gray-500 italic">No controls mapped — will use fallback response</span>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div class="flex items-center gap-3">
      <button
        onclick={generateResponses}
        disabled={generating}
        class="h-10 px-5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {#if generating}
          <span class="inline-flex items-center gap-2">
            <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
              <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            </svg>
            Generating responses...
          </span>
        {:else}
          Generate AI responses
        {/if}
      </button>
      <button onclick={() => { view = "upload"; }} class="h-10 px-4 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        Back to edit
      </button>
    </div>

  {:else if view === "responses"}
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <button onclick={backToList} class="text-sm text-blue-600 dark:text-blue-400 hover:underline">← All questionnaires</button>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Review responses
          <span class="font-normal text-sm text-gray-500 dark:text-gray-400">
            ({Object.keys(feedbackStatus).length}/{responses.length} reviewed)
          </span>
        </h2>
      </div>
    </div>

    <div class="space-y-4">
      {#each responses as r, i (r.questionIndex)}
        {@const status = feedbackStatus[r.questionIndex]}
        <div class="bg-white dark:bg-gray-800 border rounded-lg p-5
          {status === 'accepted' ? 'border-green-300 dark:border-green-700' : status === 'rejected' ? 'border-red-300 dark:border-red-700' : status === 'edited' ? 'border-yellow-300 dark:border-yellow-700' : 'border-gray-200 dark:border-gray-700'}">
          <div class="flex items-start gap-3 mb-3">
            <span class="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5 shrink-0">Q{r.questionIndex + 1}</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{r.questionText}</p>
              {#if r.mappedControls.length > 0}
                <div class="mt-1 flex items-center gap-1.5 flex-wrap">
                  {#each r.mappedControls as ctrl}
                    <span class="inline-flex items-center px-1.5 py-0.5 text-2xs font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {ctrl}
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
            {#if status}
              <span class="shrink-0 text-2xs font-medium px-2 py-0.5 rounded-full
                {status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}">
                {status}
              </span>
            {/if}
          </div>

          <div class="ml-8">
            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3">
              <p class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{r.response}</p>
              {#if r.evidenceRefs.length > 0}
                <p class="mt-2 text-2xs text-gray-400 dark:text-gray-500">
                  Evidence: {r.evidenceRefs.join(", ")}
                </p>
              {/if}
            </div>

            {#if !status}
              <div class="mb-3">
                <textarea
                  bind:value={editedTexts[r.questionIndex]}
                  rows={3}
                  placeholder="Edit the response here if you want to customize it..."
                  class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
                ></textarea>
              </div>

              <div class="flex items-center gap-2">
                <button
                  onclick={() => submitFeedback(r.questionIndex, "accepted")}
                  disabled={feedbackSending[r.questionIndex]}
                  class="h-7 px-3 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-colors"
                >
                  Accept
                </button>
                {#if editedTexts[r.questionIndex]?.trim()}
                  <button
                    onclick={() => submitFeedback(r.questionIndex, "edited")}
                    disabled={feedbackSending[r.questionIndex]}
                    class="h-7 px-3 text-xs font-medium rounded-md bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50 transition-colors"
                  >
                    Save edit
                  </button>
                {/if}
                <button
                  onclick={() => submitFeedback(r.questionIndex, "rejected")}
                  disabled={feedbackSending[r.questionIndex]}
                  class="h-7 px-3 text-xs font-medium rounded-md border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                >
                  Reject
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
