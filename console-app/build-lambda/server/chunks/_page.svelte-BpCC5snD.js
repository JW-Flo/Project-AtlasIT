import { ao as ensure_array_like, an as escape_html } from './renderer-CwxN8JkH.js';
import './toastStore-X6rW096m.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_header } from './card-header-DkXf0dG2.js';
import { C as Card_title } from './card-title-CntIWcKQ.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { B as Badge } from './badge-CdvwjGCK.js';
import { C as Calendar } from './calendar-5wZWtuQ3.js';
import { S as Shield } from './shield-DkMnJ1a-.js';
import { A as Activity } from './activity-BZT1Fpfp.js';
import { F as File_check } from './file-check-nCfSdN0B.js';
import { U as Users } from './users-B6QpDkaK.js';
import { F as File_text } from './file-text-ONGDnfqP.js';
import { C as Clock } from './clock-DtsFhFWK.js';
import { D as Download } from './download-BKS59Bcj.js';
import './index-C1X1AO8K.js';
import './utils2-BgZmMgq3.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const availableReports = [
      {
        id: "compliance-summary",
        name: "Compliance Summary",
        description: "Executive summary of compliance posture across all frameworks",
        icon: Shield,
        format: "pdf",
        frequency: "weekly"
      },
      {
        id: "audit-log",
        name: "Audit Log Export",
        description: "Detailed audit trail of all tenant activities and changes",
        icon: Activity,
        format: "csv",
        frequency: "daily"
      },
      {
        id: "evidence-package",
        name: "Evidence Package",
        description: "Complete evidence archive for audit submission",
        icon: File_check,
        format: "pdf",
        frequency: "monthly"
      },
      {
        id: "access-review-summary",
        name: "Access Review Summary",
        description: "Summary of access reviews, decisions, and pending actions",
        icon: Users,
        format: "pdf",
        frequency: "monthly"
      },
      {
        id: "incident-report",
        name: "Incident Report",
        description: "Security incidents, response actions, and resolution status",
        icon: Activity,
        format: "pdf",
        frequency: "weekly"
      },
      {
        id: "policy-compliance",
        name: "Policy Compliance Report",
        description: "Policy coverage, exceptions, and compliance metrics",
        icon: File_text,
        format: "pdf",
        frequency: "monthly"
      }
    ];
    let generating = {};
    let dateRange = "30";
    function formatFrequency(freq) {
      if (!freq) return "";
      return freq.charAt(0).toUpperCase() + freq.slice(1);
    }
    $$renderer2.push(`<div class="animate-fade-in"><div class="mb-6"><h1 class="text-3xl font-bold text-foreground">Reports</h1> <p class="mt-2 text-muted-foreground">Generate compliance, audit, and security reports for stakeholders and auditors</p></div> `);
    Card($$renderer2, {
      class: "mb-6",
      children: ($$renderer3) => {
        Card_content($$renderer3, {
          class: "pt-6",
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="flex items-center gap-4">`);
            Calendar($$renderer4, { class: "h-5 w-5 text-muted-foreground" });
            $$renderer4.push(`<!----> <label for="dateRange" class="text-sm font-medium text-foreground">Report Period:</label> `);
            $$renderer4.select(
              {
                id: "dateRange",
                value: dateRange,
                class: "w-48 px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              },
              ($$renderer5) => {
                $$renderer5.option({ value: "7" }, ($$renderer6) => {
                  $$renderer6.push(`Last 7 days`);
                });
                $$renderer5.option({ value: "30" }, ($$renderer6) => {
                  $$renderer6.push(`Last 30 days`);
                });
                $$renderer5.option({ value: "90" }, ($$renderer6) => {
                  $$renderer6.push(`Last 90 days`);
                });
                $$renderer5.option({ value: "365" }, ($$renderer6) => {
                  $$renderer6.push(`Last 12 months`);
                });
              }
            );
            $$renderer4.push(`</div>`);
          },
          $$slots: { default: true }
        });
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
    const each_array = ensure_array_like(availableReports);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let report = each_array[$$index];
      Card($$renderer2, {
        class: "hover:shadow-lg transition-shadow",
        children: ($$renderer3) => {
          Card_header($$renderer3, {
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex items-start justify-between"><div class="flex items-center gap-3"><div class="p-2 rounded-lg bg-primary/10 text-primary">`);
              if (report.icon) {
                $$renderer4.push("<!--[-->");
                report.icon($$renderer4, { class: "h-5 w-5" });
                $$renderer4.push("<!--]-->");
              } else {
                $$renderer4.push("<!--[!-->");
                $$renderer4.push("<!--]-->");
              }
              $$renderer4.push(`</div> <div>`);
              Card_title($$renderer4, {
                class: "text-base",
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->${escape_html(report.name)}`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----> `);
              if (report.frequency) {
                $$renderer4.push("<!--[0-->");
                Badge($$renderer4, {
                  variant: "secondary",
                  class: "mt-1 text-xs",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->${escape_html(formatFrequency(report.frequency))}`);
                  },
                  $$slots: { default: true }
                });
              } else {
                $$renderer4.push("<!--[-1-->");
              }
              $$renderer4.push(`<!--]--></div></div></div>`);
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!----> `);
          Card_content($$renderer3, {
            children: ($$renderer4) => {
              $$renderer4.push(`<p class="text-sm text-muted-foreground mb-4">${escape_html(report.description)}</p> <div class="flex items-center justify-between"><div class="flex items-center gap-2 text-xs text-muted-foreground">`);
              File_text($$renderer4, { class: "h-3 w-3" });
              $$renderer4.push(`<!----> <span class="uppercase">${escape_html(report.format)}</span></div> `);
              Button($$renderer4, {
                variant: "default",
                size: "sm",
                disabled: generating[report.id],
                class: "gap-2",
                children: ($$renderer5) => {
                  if (generating[report.id]) {
                    $$renderer5.push("<!--[0-->");
                    Clock($$renderer5, { class: "h-4 w-4 animate-spin" });
                    $$renderer5.push(`<!----> Generating...`);
                  } else {
                    $$renderer5.push("<!--[-1-->");
                    Download($$renderer5, { class: "h-4 w-4" });
                    $$renderer5.push(`<!----> Generate`);
                  }
                  $$renderer5.push(`<!--]-->`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----></div>`);
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!---->`);
        },
        $$slots: { default: true }
      });
    }
    $$renderer2.push(`<!--]--></div> `);
    Card($$renderer2, {
      class: "mt-8",
      children: ($$renderer3) => {
        Card_header($$renderer3, {
          children: ($$renderer4) => {
            Card_title($$renderer4, {
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->Scheduled Reports`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> `);
        Card_content($$renderer3, {
          children: ($$renderer4) => {
            $$renderer4.push(`<p class="text-sm text-muted-foreground mb-4">Configure automatic report generation and delivery on a schedule.</p> `);
            Button($$renderer4, {
              variant: "outline",
              size: "sm",
              disabled: true,
              class: "gap-2",
              children: ($$renderer5) => {
                Clock($$renderer5, { class: "h-4 w-4" });
                $$renderer5.push(`<!----> Configure Schedules (Coming Soon)`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!---->`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!---->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BpCC5snD.js.map
