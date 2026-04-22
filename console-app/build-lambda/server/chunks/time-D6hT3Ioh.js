import { af as fallback, ab as store_get, ad as slot, ae as unsubscribe_stores, ag as bind_props, an as escape_html, ah as sanitize_props, ai as spread_props } from './renderer-CwxN8JkH.js';
import { o as onDestroy } from './index-server-C1ubzO3x.js';
import { p as page } from './stores-emli2svW.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import { B as Button } from './button-BXPyX210.js';
import { C as Card } from './card-1P6BfRcm.js';
import { T as Triangle_alert } from './triangle-alert-BIxAVWgG.js';
import { I as Icon } from './Icon-DQFqITWq.js';

function House($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      { "d": "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" }
    ],
    [
      "path",
      {
        "d": "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "house" },
    $$sanitized_props,
    {
      /**
       * @component @name House
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUgMjF2LThhMSAxIDAgMCAwLTEtMWgtNGExIDEgMCAwIDAtMSAxdjgiIC8+CiAgPHBhdGggZD0iTTMgMTBhMiAyIDAgMCAxIC43MDktMS41MjhsNy02YTIgMiAwIDAgMSAyLjU4MiAwbDcgNkEyIDIgMCAwIDEgMjEgMTB2OWEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnoiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/house
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Refresh_ccw($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      { "d": "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }
    ],
    ["path", { "d": "M3 3v5h5" }],
    [
      "path",
      { "d": "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }
    ],
    ["path", { "d": "M16 16h5v5" }]
  ];
  Icon($$renderer, spread_props([
    { name: "refresh-ccw" },
    $$sanitized_props,
    {
      /**
       * @component @name RefreshCcw
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEgMTJhOSA5IDAgMCAwLTktOSA5Ljc1IDkuNzUgMCAwIDAtNi43NCAyLjc0TDMgOCIgLz4KICA8cGF0aCBkPSJNMyAzdjVoNSIgLz4KICA8cGF0aCBkPSJNMyAxMmE5IDkgMCAwIDAgOSA5IDkuNzUgOS43NSAwIDAgMCA2Ljc0LTIuNzRMMjEgMTYiIC8+CiAgPHBhdGggZD0iTTE2IDE2aDV2NSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/refresh-ccw
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function classifyError(error, context) {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      type: "network",
      message: "Connection failed",
      actionable: "Check your network connection and try again.",
      retryable: true
    };
  }
  if (error && typeof error === "object" && "status" in error) {
    const status = error.status;
    if (status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `/login?return=${returnUrl}`;
      }
      return {
        type: "auth",
        message: "Redirecting to login",
        actionable: "Your session has expired. Redirecting to login...",
        retryable: false,
        httpStatus: 401
      };
    }
    if (status === 403) {
      return {
        type: "permission",
        message: "Access denied",
        actionable: "You don't have permission to perform this action. Contact your administrator.",
        retryable: false,
        httpStatus: 403
      };
    }
    if (status === 404) {
      return {
        type: "validation",
        message: "Resource not found",
        actionable: context ? `${context} was not found. It may have been deleted or moved.` : "The requested resource was not found.",
        retryable: false,
        httpStatus: 404
      };
    }
    if (status === 422) {
      return {
        type: "validation",
        message: "Validation failed",
        actionable: "Please check your input and try again.",
        retryable: false,
        httpStatus: 422
      };
    }
    if (status === 429) {
      return {
        type: "validation",
        message: "Rate limit exceeded",
        actionable: "Too many requests. Please wait a moment and try again.",
        retryable: true,
        httpStatus: 429
      };
    }
    if (status >= 500) {
      const retriable = [502, 503, 504].includes(status);
      return {
        type: "server",
        message: retriable ? "Service temporarily unavailable" : "Server error",
        actionable: retriable ? "Our servers are temporarily unavailable. Please try again in a moment." : "Something went wrong on our end. Please contact support if this persists.",
        retryable: retriable,
        httpStatus: status
      };
    }
    if (status >= 400) {
      return {
        type: "validation",
        message: "Request failed",
        actionable: "Invalid request. Please check your input.",
        retryable: false,
        httpStatus: status
      };
    }
  }
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("timeout")) {
    return {
      type: "network",
      message: "Request timeout",
      actionable: "The request took too long. Please try again.",
      retryable: true
    };
  }
  if (message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("not authenticated")) {
    return {
      type: "auth",
      message: "Authentication required",
      actionable: "Your session has expired. Please sign in again.",
      retryable: false
    };
  }
  if (message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("permission denied")) {
    return {
      type: "permission",
      message: "Access denied",
      actionable: "You don't have permission to perform this action. Contact your administrator.",
      retryable: false
    };
  }
  return {
    type: "unknown",
    message: "An error occurred",
    actionable: context ? `Failed to ${context}. Please try again or contact support if the problem persists.` : "Something went wrong. Please try again or contact support if the problem persists.",
    retryable: true
  };
}
async function retryWithBackoff(fn, options = {}) {
  const { maxAttempts = 3, initialDelayMs = 1e3, maxDelayMs = 1e4, context } = options;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const classified = classifyError(error, context);
      lastError = classified;
      if (!classified.retryable) {
        throw classified;
      }
      if (attempt === maxAttempts) {
        throw classified;
      }
      const baseDelay = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      const jitter = Math.random() * baseDelay * 0.1;
      const delay = baseDelay + jitter;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError || new Error("Retry failed");
}
async function safeFetch(url, options = {}) {
  const { retry = false, context, ...fetchOptions } = options;
  const fetchFn = async () => {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      const errorWithStatus = new Error(`HTTP ${response.status}`);
      errorWithStatus.status = response.status;
      throw errorWithStatus;
    }
    const data = await response.json();
    return data;
  };
  try {
    const data = retry ? await retryWithBackoff(fetchFn, { context }) : await fetchFn();
    return { ok: true, data };
  } catch (error) {
    const classified = error && typeof error === "object" && "type" in error ? error : classifyError(error, context);
    return { ok: false, error: classified };
  }
}
async function logError(error, metadata) {
  try {
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: error.type,
        message: error.message,
        httpStatus: error.httpStatus,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        // URL sanitized on server - only send full URL, backend strips query params
        url: window.location.href,
        metadata
      })
    }).catch(() => {
    });
  } catch {
  }
}
function ErrorBoundary($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let fallbackMessage = fallback($$props["fallbackMessage"], "Something went wrong");
    let showHomeButton = fallback($$props["showHomeButton"], true);
    let showRetryButton = fallback($$props["showRetryButton"], true);
    let onRetry = fallback($$props["onRetry"], void 0);
    let error = null;
    let errorCount = 0;
    function handleError(event) {
      event.preventDefault();
      const classified = classifyError(event.error, "page load");
      error = classified;
      errorCount++;
      logError(classified, { errorCount });
    }
    function handleUnhandledRejection(event) {
      event.preventDefault();
      const classified = classifyError(event.reason, "async operation");
      error = classified;
      errorCount++;
      logError(classified, { errorCount, promiseRejection: true });
    }
    onDestroy(() => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    });
    if (store_get($$store_subs ??= {}, "$page", page).url.pathname) {
      error = null;
      errorCount = 0;
    }
    if (
      // Log to CloudWatch (without stack traces - security risk)
      // Log to CloudWatch
      // Use goto() instead of window.location.reload() to preserve SvelteKit state (F-06 fix)
      error
    ) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="min-h-screen flex items-center justify-center p-4 bg-muted/20">`);
      Card($$renderer2, {
        padding: "xl",
        class: "max-w-lg w-full border-destructive/20 bg-destructive-muted",
        children: ($$renderer3) => {
          $$renderer3.push(`<div class="flex flex-col items-center text-center"><div class="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">`);
          Triangle_alert($$renderer3, { class: "h-8 w-8 text-destructive", strokeWidth: 2 });
          $$renderer3.push(`<!----></div> <h1 class="text-2xl font-semibold text-foreground mb-2">${escape_html(error.message || fallbackMessage)}</h1> <p class="text-sm text-muted-foreground mb-6 max-w-md">${escape_html(error.actionable)}</p> `);
          if (errorCount > 1) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<p class="text-xs text-destructive mb-4">This error has occurred ${escape_html(errorCount)} times. Consider refreshing the page or contacting support.</p>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> <div class="flex gap-3 flex-wrap justify-center">`);
          if (showRetryButton && error.retryable) {
            $$renderer3.push("<!--[0-->");
            Button($$renderer3, {
              variant: "primary",
              size: "md",
              children: ($$renderer4) => {
                Refresh_ccw($$renderer4, { class: "h-4 w-4", strokeWidth: 2 });
                $$renderer4.push(`<!----> Try again`);
              },
              $$slots: { default: true }
            });
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (showHomeButton) {
            $$renderer3.push("<!--[0-->");
            Button($$renderer3, {
              variant: "outline",
              size: "md",
              children: ($$renderer4) => {
                House($$renderer4, { class: "h-4 w-4", strokeWidth: 2 });
                $$renderer4.push(`<!----> Go to dashboard`);
              },
              $$slots: { default: true }
            });
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></div> `);
          if (error.httpStatus) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<p class="mt-6 text-xs text-muted-foreground font-mono">Error code: ${escape_html(error.httpStatus)}</p>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></div>`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { fallbackMessage, showHomeButton, showRetryButton, onRetry });
  });
}
function relativeTime(iso) {
  if (!iso) return "--";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "--";
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1e3);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export { ErrorBoundary as E, relativeTime as r, safeFetch as s };
//# sourceMappingURL=time-D6hT3Ioh.js.map
