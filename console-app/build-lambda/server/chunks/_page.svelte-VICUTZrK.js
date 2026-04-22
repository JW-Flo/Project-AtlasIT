import { ao as ensure_array_like, an as escape_html } from './renderer-CwxN8JkH.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Badge } from './badge-CdvwjGCK.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import { D as Dialog } from './dialog-Cs6T-I4e.js';
import './toastStore-X6rW096m.js';
import './utils2-BgZmMgq3.js';
import './index-server-C1ubzO3x.js';
import './x-BmTrGS3K.js';
import './Icon-DQFqITWq.js';
import './index-C1X1AO8K.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let selectedExecution = null;
    let loadingDetail = false;
    let statusFilter = "all";
    function statusVariant(status) {
      if (status === "success") return "success";
      if (status === "failed") return "destructive";
      return "secondary";
    }
    function closeExecutionDetail() {
      selectedExecution = null;
      loadingDetail = false;
    }
    function actionTypeLabel(type) {
      return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    $$renderer2.push(`<div class="space-y-6"><div class="flex items-center justify-between gap-3"><div><h1 class="text-2xl font-semibold tracking-tight">Automation Runs</h1> <p class="text-sm text-muted-foreground">Execution log for automation rules across your tenant.</p></div> <div class="flex items-center gap-2"><label class="text-sm text-muted-foreground" for="status-filter">Status</label> `);
    $$renderer2.select(
      {
        id: "status-filter",
        value: statusFilter,
        class: "h-9 rounded-md border border-input bg-background px-3 text-sm"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "all" }, ($$renderer4) => {
          $$renderer4.push(`All`);
        });
        $$renderer3.option({ value: "success" }, ($$renderer4) => {
          $$renderer4.push(`Success`);
        });
        $$renderer3.option({ value: "failed" }, ($$renderer4) => {
          $$renderer4.push(`Failed`);
        });
        $$renderer3.option({ value: "skipped" }, ($$renderer4) => {
          $$renderer4.push(`Skipped`);
        });
      }
    );
    $$renderer2.push(`</div></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-3"><!--[-->`);
      const each_array = ensure_array_like([1, 2, 3, 4]);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        Skeleton($$renderer2, { class: "h-14 rounded-lg" });
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    Dialog($$renderer2, {
      open: loadingDetail || selectedExecution !== null,
      onClose: closeExecutionDetail,
      title: "Execution Detail",
      children: ($$renderer3) => {
        if (loadingDetail) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="space-y-3">`);
          Skeleton($$renderer3, { class: "h-5 w-48" });
          $$renderer3.push(`<!----> `);
          Skeleton($$renderer3, { class: "h-4 w-32" });
          $$renderer3.push(`<!----> <div class="grid grid-cols-2 gap-3">`);
          Skeleton($$renderer3, { class: "h-12" });
          $$renderer3.push(`<!----> `);
          Skeleton($$renderer3, { class: "h-12" });
          $$renderer3.push(`<!----> `);
          Skeleton($$renderer3, { class: "h-12" });
          $$renderer3.push(`<!----> `);
          Skeleton($$renderer3, { class: "h-12" });
          $$renderer3.push(`<!----></div> `);
          Skeleton($$renderer3, { class: "h-24" });
          $$renderer3.push(`<!----></div>`);
        } else if (selectedExecution) {
          $$renderer3.push("<!--[1-->");
          $$renderer3.push(`<div class="mb-4"><div class="text-sm font-medium">${escape_html(selectedExecution.ruleName)}</div> `);
          if (selectedExecution.triggerType) {
            $$renderer3.push("<!--[0-->");
            Badge($$renderer3, {
              variant: "outline",
              class: "mt-1",
              children: ($$renderer4) => {
                $$renderer4.push(`<!---->${escape_html(selectedExecution.triggerType)}`);
              },
              $$slots: { default: true }
            });
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></div> <div class="grid grid-cols-2 gap-3 mb-4"><div><div class="text-xs text-muted-foreground mb-0.5">Status</div> `);
          Badge($$renderer3, {
            variant: statusVariant(selectedExecution.status),
            class: "capitalize",
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->${escape_html(selectedExecution.status)}`);
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!----></div> <div><div class="text-xs text-muted-foreground mb-0.5">Duration</div> <span class="text-sm">${escape_html(selectedExecution.durationMs ? `${selectedExecution.durationMs}ms` : "-")}</span></div> <div><div class="text-xs text-muted-foreground mb-0.5">Started</div> <span class="text-xs">${escape_html(new Date(selectedExecution.startedAt).toLocaleString())}</span></div> <div><div class="text-xs text-muted-foreground mb-0.5">Completed</div> <span class="text-xs">${escape_html(selectedExecution.completedAt ? new Date(selectedExecution.completedAt).toLocaleString() : "-")}</span></div></div> <div><div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Action Results</div> `);
          if (selectedExecution.results && selectedExecution.results.length > 0) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="space-y-2"><!--[-->`);
            const each_array_2 = ensure_array_like(selectedExecution.results);
            for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
              let result = each_array_2[$$index_2];
              Card($$renderer3, {
                children: ($$renderer4) => {
                  Card_content($$renderer4, {
                    class: "py-2 px-3",
                    children: ($$renderer5) => {
                      $$renderer5.push(`<div class="flex items-center gap-2 mb-1">`);
                      Badge($$renderer5, {
                        variant: statusVariant(result.status),
                        class: "capitalize",
                        children: ($$renderer6) => {
                          $$renderer6.push(`<!---->${escape_html(result.status)}`);
                        },
                        $$slots: { default: true }
                      });
                      $$renderer5.push(`<!----> <span class="text-xs font-medium">${escape_html(actionTypeLabel(result.actionType))}</span></div> `);
                      if (result.message) {
                        $$renderer5.push("<!--[0-->");
                        $$renderer5.push(`<div class="text-xs text-muted-foreground mt-1">${escape_html(result.message)}</div>`);
                      } else {
                        $$renderer5.push("<!--[-1-->");
                      }
                      $$renderer5.push(`<!--]-->`);
                    },
                    $$slots: { default: true }
                  });
                },
                $$slots: { default: true }
              });
            }
            $$renderer3.push(`<!--]--></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<p class="text-xs text-muted-foreground">No action results recorded.</p>`);
          }
          $$renderer3.push(`<!--]--></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]-->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!---->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-VICUTZrK.js.map
