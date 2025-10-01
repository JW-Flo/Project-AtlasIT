<script lang="ts">
  import { listAccessRequests, createAccessRequest, transitionAccessRequest } from '$lib/api/accessRequests';
  import type { AccessRequest } from '$lib/api/types';
  let items: AccessRequest[] = [];
  let loading = true; let error: string | null = null; let nextCursor: number | null = null;
  let form = { subjectRef: '', resource: '', justification: '' }; let submitting = false;
  async function load(reset=false){
    try { const data = await listAccessRequests({ cursor: reset? undefined : nextCursor || undefined, limit:25 });
      if(reset) items = data.items; else items = [...items, ...data.items]; nextCursor = data.nextCursor ?? null; }
    catch(e:any){ error = e?.message||'Failed'; }
    finally { loading = false; }
  }
  load(true);
  async function submit(){ if(!form.subjectRef||!form.resource) return; submitting=true; try { const created = await createAccessRequest({ subjectRef: form.subjectRef, resource: form.resource, justification: form.justification||undefined }); items=[created,...items]; form={subjectRef:'',resource:'',justification:''}; } catch(e:any){ error=e?.message||'Create failed'; } finally { submitting=false; } }
  async function act(id:number, action:'approve'|'deny'|'fulfill'){ const idx=items.findIndex(r=>r.id===id); if(idx===-1)return; const prev=items[idx]; items=items.map(r=>r.id===id?{...r,status: action==='approve'?'approved':action==='deny'?'denied':'fulfilled'}:r); try { const updated = await transitionAccessRequest(id, action); items=items.map(r=>r.id===id?updated:r);} catch{ items=items.map(r=>r.id===id?prev:r);} }
</script>
<div class="p-6 max-w-5xl mx-auto flex flex-col gap-6">
  <h1 class="text-2xl font-semibold">Access Requests</h1>
  <div class="bg-neutral-900 border border-neutral-700 rounded p-4 flex flex-col gap-3">
    <div class="flex gap-2 flex-wrap">
      <input class="px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-sm" placeholder="Subject Ref" bind:value={form.subjectRef} />
      <input class="px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-sm" placeholder="Resource" bind:value={form.resource} />
      <input class="px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-sm" placeholder="Justification" bind:value={form.justification} />
      <button class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm" disabled={submitting} on:click={submit}>{submitting?'…':'Create'}</button>
    </div>
  </div>
  {#if loading}
    <div class="text-sm text-neutral-400">Loading…</div>
  {:else if error}
    <div class="text-sm text-red-400">{error}</div>
  {:else}
    <table class="w-full text-xs border-collapse">
      <thead class="text-neutral-400">
        <tr><th class="p-2 text-left">ID</th><th class="p-2 text-left">Subject</th><th class="p-2 text-left">Resource</th><th class="p-2 text-left">Status</th><th class="p-2 text-left">Actions</th></tr>
      </thead>
      <tbody>
        {#each items as r}
          <tr class="border-t border-neutral-800">
            <td class="p-2">{r.id}</td><td class="p-2">{r.subject}</td><td class="p-2">{r.resource}</td><td class="p-2">{r.status}</td>
            <td class="p-2 flex gap-2 flex-wrap">
              {#if r.status==='pending'}
                <button class="px-2 py-0.5 bg-green-600 rounded" on:click={()=>act(r.id,'approve')}>Approve</button>
                <button class="px-2 py-0.5 bg-red-600 rounded" on:click={()=>act(r.id,'deny')}>Deny</button>
              {:else if r.status==='approved'}
                <button class="px-2 py-0.5 bg-indigo-600 rounded" on:click={()=>act(r.id,'fulfill')}>Fulfill</button>
              {:else}
                <span class="text-neutral-500">—</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if nextCursor}
      <button class="mt-4 text-sm bg-neutral-800 border border-neutral-600 px-3 py-1 rounded" on:click={()=>load(false)}>Load More</button>
    {/if}
  {/if}
</div>
