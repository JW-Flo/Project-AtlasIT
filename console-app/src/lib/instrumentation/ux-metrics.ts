// Basic UX metrics & custom event pipeline. Can be extended for real analytics endpoint.
interface UXEventBase {
  name: string;
  t: number;
  props?: Record<string, any>;
}
const queue: UXEventBase[] = [];
let flushed = false;

function push(e: UXEventBase) {
  queue.push(e);
}

export function mark(name: string, props?: Record<string, any>) {
  push({ name, t: performance.now(), props });
}

export function flush(post?: (events: UXEventBase[]) => void) {
  if (flushed) return;
  flushed = true;
  try {
    if (post) post(queue);
    else {
      // Fallback: log to console (replace with fetch to analytics endpoint)
      // console.debug('[ux]', queue);
    }
  } catch {}
}

// Core Web Vitals lite approximations (FirstPaint, HydrationComplete if possible)
export function init() {
  mark("init");
  if (document.readyState === "complete") mark("doc_complete");
  else
    window.addEventListener("load", () => mark("doc_complete"), { once: true });
  requestAnimationFrame(() => mark("raf_1"));
  requestIdleCallback?.(
    () => {
      mark("idle");
      flush();
    },
    { timeout: 3000 },
  );
}

export function trackInteraction(
  el: HTMLElement,
  event: string,
  name: string,
  extra?: Record<string, any>,
) {
  el.addEventListener(event, () => mark(`ui:${name}`, extra), {
    passive: true,
  });
}
