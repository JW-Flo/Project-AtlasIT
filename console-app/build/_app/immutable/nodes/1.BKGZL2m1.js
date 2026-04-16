import {
  $ as e,
  H as t,
  I as n,
  L as r,
  Tt as i,
  at as a,
  bt as o,
  gt as s,
  ht as c,
  l,
  r as u,
  st as d,
  wt as f,
  xt as p,
  z as m,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as h } from "../chunks/D8pbUplu.js";
var g = m(
  `<div class="min-h-screen flex items-center justify-center bg-background"><div class="max-w-md w-full space-y-4 px-4 text-center"><h1 class="text-2xl font-semibold">Something went wrong</h1> <p class="text-sm text-muted-foreground"> </p> <p class="text-xs text-muted-foreground"> </p> <div class="flex gap-2 justify-center"><button class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm">Reload page</button> <a href="/console" class="px-4 py-2 rounded-md border text-sm hover:bg-muted">Go to dashboard</a></div></div></div>`,
);
function _(m, _) {
  p(_, !1);
  let v = () => s(h, `$page`, y),
    [y, b] = c();
  (u(() => {
    v().error && console.error(`[SvelteKit error boundary]`, v().status, v().error);
  }),
    l());
  var x = g(),
    S = a(x),
    C = d(a(S), 2),
    w = a(C, !0);
  i(C);
  var T = d(C, 2),
    E = a(T);
  i(T);
  var D = d(T, 2),
    O = a(D);
  (f(2),
    i(D),
    i(S),
    i(x),
    e(() => {
      (n(w, v().error?.message || `An unexpected error occurred`),
        n(E, `Path: ${v().url.pathname ?? ``}`));
    }),
    t(`click`, O, () => window.location.reload()),
    r(m, x),
    o(),
    b());
}
export { _ as component };
