import { ac as head, ao as ensure_array_like } from './renderer-CwxN8JkH.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("1ivpdyw", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Questionnaire AI · AtlasIT</title>`);
      });
    });
    $$renderer2.push(`<div class="p-8 max-w-4xl mx-auto animate-fade-in"><div class="mb-6"><a href="/console/settings/trust" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Trust Center</a> <h1 class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Questionnaire AI</h1> <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Paste a vendor security questionnaire and get AI-generated responses grounded in your real compliance evidence and connected adapter data.</p></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex items-center justify-between mb-4"><h2 class="text-lg font-semibold text-gray-900 dark:text-white">Past questionnaires</h2> <button class="h-9 px-4 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">New questionnaire</button></div> `);
      {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="space-y-3"><!--[-->`);
        const each_array = ensure_array_like(Array(3));
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          each_array[$$index];
          $$renderer2.push(`<div class="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CfpRXRZk.js.map
