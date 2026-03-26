import { C as B } from "../chunks/DXY25tU5.js";
import "../chunks/Bzak7iHL.js";
import "../chunks/B37ZqHvF.js";
import {
  l as $,
  aS as ee,
  aj as te,
  Y as ae,
  aT as re,
  aU as se,
  aa as ie,
  V as h,
  f as I,
  ad as n,
  ae as le,
  af as k,
  ah as _,
  d as t,
  a as x,
  ag as oe,
  s as d,
  ar as U,
  u as y,
  aV as ne,
  ai as f,
} from "../chunks/DLjC2_M2.js";
import { e as ve, s as b } from "../chunks/39A_Ntu8.js";
import { i as Y } from "../chunks/BHVF3NEQ.js";
import { e as ue, i as de } from "../chunks/B36Hb1sH.js";
import { r as fe } from "../chunks/sxWjfql8.js";
import { b as ce } from "../chunks/C2VxBUJ8.js";
import { p as _e } from "../chunks/CWmzcjye.js";
import { i as pe } from "../chunks/CLYubSJh.js";
import { p as me } from "../chunks/DXlasQxZ.js";
function E(e, i, v = !1) {
  if (e.multiple) {
    if (i == null) return;
    if (!ae(i)) return re();
    for (var l of e.options) l.selected = i.includes(j(l));
    return;
  }
  for (l of e.options) {
    var a = j(l);
    if (se(a, i)) {
      l.selected = !0;
      return;
    }
  }
  (!v || i !== void 0) && (e.selectedIndex = -1);
}
function ye(e) {
  var i = new MutationObserver(() => {
    E(e, e.__value);
  });
  (i.observe(e, {
    childList: !0,
    subtree: !0,
    attributes: !0,
    attributeFilter: ["value"],
  }),
    te(() => {
      i.disconnect();
    }));
}
function be(e, i, v = i) {
  var l = !0;
  ($(e, "change", (a) => {
    var u = a ? "[selected]" : ":checked",
      p;
    if (e.multiple) p = [].map.call(e.querySelectorAll(u), j);
    else {
      var c = e.querySelector(u) ?? e.querySelector("option:not([disabled])");
      p = c && j(c);
    }
    v(p);
  }),
    ee(() => {
      var a = i();
      if ((E(e, a, l), l && a === void 0)) {
        var u = e.querySelector(":checked");
        u !== null && ((a = j(u)), v(a));
      }
      ((e.__value = a), (l = !1));
    }),
    ye(e));
}
function j(e) {
  return "__value" in e ? e.__value : e.value;
}
const he = async ({ fetch: e, url: i }) => {
    var l;
    const v = Number(i.searchParams.get("limit") || 25);
    try {
      return { incidents: await B.listIncidents({ limit: v }, e) };
    } catch (a) {
      return {
        error:
          ((l = a == null ? void 0 : a.body) == null ? void 0 : l.error) ||
          "Failed to load incidents",
      };
    }
  },
  Le = Object.freeze(
    Object.defineProperty({ __proto__: null, load: he }, Symbol.toStringTag, {
      value: "Module",
    }),
  );
var ke = I('<p class="error svelte-k4yj4f"> </p>'),
  je = I('<p class="error svelte-k4yj4f"> </p>'),
  ge = I(
    '<tr><td class="svelte-k4yj4f"> </td><td class="svelte-k4yj4f"> </td><td class="svelte-k4yj4f"> </td><td class="svelte-k4yj4f"> </td></tr>',
  ),
  Se = I(
    '<h1 class="svelte-k4yj4f">Security Incidents</h1> <!> <form class="create svelte-k4yj4f"><input placeholder="Title" class="svelte-k4yj4f"/> <select class="svelte-k4yj4f"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select> <button class="svelte-k4yj4f">Create</button></form> <!> <table class="list svelte-k4yj4f"><thead><tr><th class="svelte-k4yj4f">Title</th><th class="svelte-k4yj4f">Severity</th><th class="svelte-k4yj4f">Status</th><th class="svelte-k4yj4f">Created</th></tr></thead><tbody></tbody></table>',
    1,
  );
function Ve(e, i) {
  var H;
  ie(i, !1);
  let v = me(i, "data", 8),
    l = h(!1),
    a = h(""),
    u = h("low"),
    p = h(null),
    c = h(((H = v().incidents) == null ? void 0 : H.items) || []);
  async function G() {
    var r;
    if (!t(a)) return;
    (d(l, !0), d(p, null));
    const s = {
      id: "tmp-" + Date.now(),
      title: t(a),
      severity: t(u),
      status: "open",
      createdAt: new Date().toISOString(),
    };
    d(c, [s, ...t(c)]);
    try {
      const o = await B.createIncident({ title: t(a), severity: t(u) });
      (d(
        c,
        t(c).map((m) => (m.id === s.id ? o : m)),
      ),
        d(a, ""),
        d(u, "low"));
    } catch (o) {
      (d(
        p,
        ((r = o == null ? void 0 : o.body) == null ? void 0 : r.error) ||
          "Create failed",
      ),
        d(
          c,
          t(c).filter((m) => m.id !== s.id),
        ));
    } finally {
      d(l, !1);
    }
  }
  pe();
  var M = Se(),
    P = n(le(M), 2);
  {
    var J = (s) => {
      var r = ke(),
        o = _(r, !0);
      (f(r), k(() => b(o, (U(v()), y(() => v().error)))), x(s, r));
    };
    Y(P, (s) => {
      (U(v()), y(() => v().error) && s(J));
    });
  }
  var g = n(P, 2),
    C = _(g);
  fe(C);
  var S = n(C, 2);
  k(() => {
    (t(u), ne(() => {}));
  });
  var q = _(S);
  q.value = q.__value = "low";
  var T = n(q);
  T.value = T.__value = "medium";
  var A = n(T);
  A.value = A.__value = "high";
  var F = n(A);
  ((F.value = F.__value = "critical"), f(S));
  var K = n(S, 2);
  f(g);
  var L = n(g, 2);
  {
    var Q = (s) => {
      var r = je(),
        o = _(r, !0);
      (f(r), k(() => b(o, t(p))), x(s, r));
    };
    Y(L, (s) => {
      t(p) && s(Q);
    });
  }
  var V = n(L, 2),
    z = n(_(V));
  (ue(
    z,
    5,
    () => t(c),
    de,
    (s, r) => {
      var o = ge(),
        m = _(o),
        R = _(m, !0);
      f(m);
      var O = n(m),
        W = _(O, !0);
      f(O);
      var D = n(O),
        X = _(D, !0);
      f(D);
      var N = n(D),
        Z = _(N, !0);
      (f(N),
        f(o),
        k(
          (w) => {
            (b(R, (t(r), y(() => t(r).title))),
              b(W, (t(r), y(() => t(r).severity))),
              b(X, (t(r), y(() => t(r).status))),
              b(Z, w));
          },
          [
            () => (
              t(r),
              y(() => {
                var w;
                return (w = t(r).createdAt) == null
                  ? void 0
                  : w.slice(0, 19).replace("T", " ");
              })
            ),
          ],
        ),
        x(s, o));
    },
  ),
    f(z),
    f(V),
    k(() => (K.disabled = !t(a) || t(l))),
    ce(
      C,
      () => t(a),
      (s) => d(a, s),
    ),
    be(
      S,
      () => t(u),
      (s) => d(u, s),
    ),
    ve("submit", g, _e(G)),
    x(e, M),
    oe());
}
export { Ve as component, Le as universal };
//# sourceMappingURL=11.8gnfjZGJ.js.map
