import {
  $ as e,
  F as t,
  H as n,
  I as r,
  L as i,
  N as a,
  P as o,
  Q as s,
  R as c,
  T as l,
  Tt as u,
  W as d,
  Z as f,
  _ as p,
  at as m,
  b as h,
  bt as g,
  ct as _,
  h as v,
  l as y,
  nt as b,
  ot as x,
  q as S,
  r as C,
  st as w,
  ut as T,
  v as ee,
  w as E,
  xt as D,
  z as O,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
var k = O(
    `<div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-300"> </div>`,
  ),
  te = O(`<option> </option>`),
  ne = O(
    `<div class="mb-6 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg p-6"><h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Automation Rule</h2> <!> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name <span class="text-red-500">*</span></label> <input type="text" placeholder="Rule name"/></div> <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trigger Type</label> <select></select></div> <div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label> <textarea placeholder="Optional description" rows="2"></textarea></div> <div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actions (JSON)</label> <textarea rows="3"></textarea></div></div> <div class="mt-4 flex gap-3"><button class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition-colors"> </button> <button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button></div></div>`,
  ),
  A = O(`<div class="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>`),
  j = O(`<div class="space-y-2"></div>`),
  M = O(
    `<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"><p class="text-red-800 dark:text-red-300"> </p> <button class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button></div>`,
  ),
  N = O(
    `<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-10 text-center"><p class="text-gray-500 dark:text-gray-400"> </p></div>`,
  ),
  re = O(`<div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xs"> </div>`),
  ie = O(`<span class="ml-1 text-xs text-red-500"> </span>`),
  ae = O(`<span> </span>`),
  oe = O(`<div class="text-xs text-gray-500 dark:text-gray-400"> </div> <!>`, 1),
  se = O(`<span class="text-xs text-gray-400">Never</span>`),
  ce = O(`<div><span class="font-medium">Description:</span> </div>`),
  le = O(
    `<tr class="bg-gray-50 dark:bg-gray-900/50"><td colspan="6" class="px-6 py-3 text-xs text-gray-600 dark:text-gray-400 space-y-0.5"><div><span class="font-medium">ID:</span> <span class="font-mono"> </span></div> <div><span class="font-medium">Trigger:</span> <span class="font-mono"> </span></div> <div><span class="font-medium">Runs:</span> </div> <!></td></tr>`,
  ),
  ue = O(
    `<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"><td class="px-4 py-3"><div class="font-medium text-gray-900 dark:text-white text-sm"> </div> <!></td><td class="px-4 py-3 hidden sm:table-cell"><span class="text-xs font-mono text-gray-600 dark:text-gray-400"> </span></td><td class="px-4 py-3 text-center"><button><span></span></button></td><td class="px-4 py-3 text-right hidden md:table-cell"><span class="text-sm text-gray-900 dark:text-white"> </span> <!></td><td class="px-4 py-3 hidden lg:table-cell"><!></td><td class="px-4 py-3 text-right"><div class="flex items-center justify-end gap-2"><button class="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">View</button> <button class="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete</button></div></td></tr> <!>`,
    1,
  ),
  de = O(
    `<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"><table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead class="bg-gray-50 dark:bg-gray-900"><tr><th>Name</th><th>Trigger</th><th>Enabled</th><th>Runs</th><th>Last Run</th><th>Actions</th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"></tbody></table></div>`,
  ),
  fe = O(`<div class="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>`),
  pe = O(`<div class="space-y-2"></div>`),
  me = O(
    `<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"><p class="text-red-800 dark:text-red-300"> </p> <button class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button></div>`,
  ),
  he = O(
    `<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-10 text-center"><p class="text-gray-500 dark:text-gray-400">No workflow runs found.</p></div>`,
  ),
  ge = O(
    `<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"><td class="px-4 py-3"><div class="text-sm font-mono text-gray-700 dark:text-gray-300 truncate max-w-xs"> </div> <div class="text-xs text-gray-400 font-mono"> </div></td><td class="px-4 py-3"><span> </span></td><td class="px-4 py-3 hidden sm:table-cell text-sm text-gray-500 dark:text-gray-400"> </td><td class="px-4 py-3 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400"> </td></tr>`,
  ),
  _e = O(
    `<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"><table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead class="bg-gray-50 dark:bg-gray-900"><tr><th>Type</th><th>Status</th><th>Started</th><th>Completed</th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"></tbody></table></div>`,
  ),
  ve = O(
    `<div class="p-8 max-w-7xl mx-auto"><div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 class="text-3xl font-bold text-gray-900 dark:text-white">Automation</h1> <div class="mt-2 flex gap-2 flex-wrap"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"> </span> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"> </span> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"> </span></div></div> <div class="flex gap-3 items-center"><input type="search" placeholder="Search rules..." class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"/> <button class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"> </button></div></div> <!> <div class="mb-6 border-b border-gray-200 dark:border-gray-700"><nav class="-mb-px flex gap-6"><button>Rules</button> <button>Runs</button></nav></div> <!> <!></div>`,
  );
function ye(O, ye) {
  D(ye, !1);
  let P = _(),
    be = _(),
    xe = _(),
    F = _([]),
    I = _([]),
    Se = _(null),
    Ce = _(!0),
    L = _(null),
    R = _(!1),
    z = _(null),
    B = _(`rules`),
    V = _(``),
    H = _(!1),
    U = _(null),
    W = _(``),
    G = _(``),
    K = _(`event.created`),
    q = _(``),
    J = _(!1),
    Y = _(null),
    we = [`event.created`, `schedule.cron`, `user.created`, `integration.sync.completed`],
    X = `/orchestrator/api/v1`;
  async function Te() {
    (T(Ce, !0), T(L, null));
    try {
      let [e, t] = await Promise.all([
        fetch(`${X}/automation/rules`),
        fetch(`${X}/automation/stats`),
      ]);
      if (!e.ok) throw Error(`Rules fetch failed (HTTP ${e.status})`);
      (T(F, (await e.json()).data ?? []), t.ok && T(Se, (await t.json()).data?.summary ?? null));
    } catch (e) {
      T(L, e.message);
    } finally {
      T(Ce, !1);
    }
  }
  async function Ee() {
    (T(R, !0), T(z, null));
    try {
      let e = await fetch(`${X}/workflows?limit=20`);
      if (!e.ok) throw Error(`Workflow fetch failed (HTTP ${e.status})`);
      T(I, (await e.json()).data ?? []);
    } catch (e) {
      T(z, e.message);
    } finally {
      T(R, !1);
    }
  }
  async function De(e) {
    let t = e.enabled;
    ((e.enabled = !e.enabled), T(F, [...d(F)]));
    try {
      if (!(await fetch(`${X}/automation/rules/${e.id}/toggle`, { method: `POST` })).ok)
        throw Error(`Toggle failed`);
    } catch {
      ((e.enabled = t), T(F, [...d(F)]));
    }
  }
  async function Oe(e) {
    if (confirm(`Delete rule "${e.name}"? This cannot be undone.`))
      try {
        let t = await fetch(`${X}/automation/rules/${e.id}`, { method: `DELETE` });
        if (!t.ok) throw Error(`Delete failed (HTTP ${t.status})`);
        T(
          F,
          d(F).filter((t) => t.id !== e.id),
        );
      } catch (e) {
        alert(e.message);
      }
  }
  async function ke() {
    if ((T(Y, null), !d(W).trim())) {
      T(Y, `Name is required`);
      return;
    }
    let e;
    try {
      e = JSON.parse(d(q) || `[]`);
    } catch {
      T(Y, `Actions must be valid JSON`);
      return;
    }
    T(J, !0);
    try {
      let t = await fetch(`${X}/automation/rules`, {
        method: `POST`,
        headers: { "Content-Type": `application/json` },
        body: JSON.stringify({
          name: d(W).trim(),
          description: d(G).trim() || void 0,
          triggerType: d(K),
          actions: e,
          enabled: !0,
        }),
      });
      if (!t.ok) {
        let e = await t.json().catch(() => ({}));
        throw Error(e.message ?? `HTTP ${t.status}`);
      }
      let n = await t.json();
      (n.data && T(F, [n.data, ...d(F)]),
        T(H, !1),
        T(W, ``),
        T(G, ``),
        T(q, ``),
        T(K, `event.created`));
    } catch (e) {
      T(Y, e.message);
    } finally {
      T(J, !1);
    }
  }
  function Z(e) {
    let t = Date.now() - new Date(e).getTime(),
      n = Math.floor(t / 864e5);
    if (n > 0) return `${n}d ago`;
    let r = Math.floor(t / 36e5);
    return r > 0 ? `${r}h ago` : `${Math.floor(t / 6e4)}m ago`;
  }
  function Ae(e) {
    return e === `completed` || e === `success`
      ? `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`
      : e === `failed` || e === `error`
        ? `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`
        : e === `running`
          ? `bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`
          : e === `pending`
            ? `bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`
            : `bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
  }
  function je(e) {
    (T(B, e), e === `runs` && d(I).length === 0 && !d(R) && Ee());
  }
  C(() => {
    Te();
  });
  let Me = `w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`,
    Ne = `px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`;
  Ne + ``;
  function Pe(e) {
    return (
      `pb-3 text-sm font-medium border-b-2 transition-colors ` +
      (d(B) === e
        ? `border-blue-600 text-blue-600`
        : `border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300`)
    );
  }
  (f(
    () => (d(F), d(V)),
    () => {
      T(
        P,
        d(F).filter((e) => e.name.toLowerCase().includes(d(V).toLowerCase())),
      );
    },
  ),
    f(
      () => d(F),
      () => {
        T(be, d(F).filter((e) => e.enabled).length);
      },
    ),
    f(
      () => d(F),
      () => {
        T(xe, d(F).filter((e) => !e.enabled).length);
      },
    ),
    s(),
    y());
  var Fe = ve(),
    Ie = m(Fe),
    Le = m(Ie),
    Re = w(m(Le), 2),
    Q = m(Re),
    ze = m(Q);
  u(Q);
  var Be = w(Q, 2),
    Ve = m(Be);
  u(Be);
  var He = w(Be, 2),
    Ue = m(He);
  (u(He), u(Re), u(Le));
  var We = w(Le, 2),
    Ge = m(We);
  p(Ge);
  var Ke = w(Ge, 2),
    qe = m(Ke, !0);
  (u(Ke), u(We), u(Ie));
  var Je = w(Ie, 2),
    Ye = (s) => {
      var c = ne(),
        f = w(m(c), 2),
        g = (t) => {
          var n = k(),
            a = m(n, !0);
          (u(n), e(() => r(a, d(Y))), i(t, n));
        };
      t(f, (e) => {
        d(Y) && e(g);
      });
      var _ = w(f, 2),
        y = m(_),
        x = w(m(y), 2);
      (p(x), E(x, 1, l(Me)), u(y));
      var S = w(y, 2),
        C = w(m(S), 2);
      (E(C, 1, l(Me)),
        a(
          C,
          5,
          () => we,
          o,
          (t, n) => {
            var a = te(),
              o = m(a, !0);
            u(a);
            var s = {};
            (e(() => {
              (r(o, d(n)), s !== (s = d(n)) && (a.value = (a.__value = d(n)) ?? ``));
            }),
              i(t, a));
          },
        ),
        u(C),
        u(S));
      var D = w(S, 2),
        O = w(m(D), 2);
      (b(O),
        E(
          O,
          1,
          `w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`,
        ),
        u(D));
      var A = w(D, 2),
        j = w(m(A), 2);
      (b(j),
        ee(j, `placeholder`, `[{"type":"notify","config":{"channel":"slack"}}]`),
        E(
          j,
          1,
          `w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none`,
        ),
        u(A),
        u(_));
      var M = w(_, 2),
        N = m(M),
        re = m(N, !0);
      u(N);
      var ie = w(N, 2);
      (u(M),
        u(c),
        e(() => {
          ((N.disabled = d(J)), r(re, d(J) ? `Creating...` : `Create Rule`));
        }),
        v(
          x,
          () => d(W),
          (e) => T(W, e),
        ),
        h(
          C,
          () => d(K),
          (e) => T(K, e),
        ),
        v(
          O,
          () => d(G),
          (e) => T(G, e),
        ),
        v(
          j,
          () => d(q),
          (e) => T(q, e),
        ),
        n(`click`, N, ke),
        n(`click`, ie, () => {
          (T(H, !1), T(Y, null));
        }),
        i(s, c));
    };
  t(Je, (e) => {
    d(H) && e(Ye);
  });
  var Xe = w(Je, 2),
    Ze = m(Xe),
    $ = m(Ze),
    Qe = w($, 2);
  (u(Ze), u(Xe));
  var $e = w(Xe, 2),
    et = (s) => {
      var l = c(),
        f = x(l),
        p = (e) => {
          var t = j();
          (a(
            t,
            4,
            () => [, , , , , ,],
            o,
            (e, t) => {
              i(e, A());
            },
          ),
            u(t),
            i(e, t));
        },
        h = (t) => {
          var a = M(),
            o = m(a),
            s = m(o, !0);
          u(o);
          var c = w(o, 2);
          (u(a), e(() => r(s, d(L))), n(`click`, c, Te), i(t, a));
        },
        g = (t) => {
          var n = N(),
            a = m(n),
            o = m(a, !0);
          (u(a),
            u(n),
            e(() =>
              r(
                o,
                d(V) ? `No rules match your search.` : `No automation rules yet. Create one above.`,
              ),
            ),
            i(t, n));
        },
        _ = (o) => {
          var s = de(),
            c = m(s),
            l = m(c),
            f = m(l),
            p = m(f);
          E(
            p,
            1,
            `px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left`,
          );
          var h = w(p);
          E(
            h,
            1,
            `px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left hidden sm:table-cell`,
          );
          var g = w(h);
          E(
            g,
            1,
            `px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center`,
          );
          var _ = w(g);
          E(
            _,
            1,
            `px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right hidden md:table-cell`,
          );
          var v = w(_);
          (E(
            v,
            1,
            `px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left hidden lg:table-cell`,
          ),
            E(
              w(v),
              1,
              `px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right`,
            ),
            u(f),
            u(l));
          var y = w(l);
          (a(
            y,
            5,
            () => d(P),
            (e) => e.id,
            (a, o) => {
              var s = ue(),
                c = x(s),
                l = m(c),
                f = m(l),
                p = m(f, !0);
              u(f);
              var h = w(f, 2),
                g = (t) => {
                  var n = re(),
                    a = m(n, !0);
                  (u(n), e(() => r(a, (d(o), S(() => d(o).description)))), i(t, n));
                };
              (t(h, (e) => {
                (d(o), S(() => d(o).description) && e(g));
              }),
                u(l));
              var _ = w(l),
                v = m(_),
                y = m(v, !0);
              (u(v), u(_));
              var b = w(_),
                C = m(b),
                D = m(C);
              (u(C), u(b));
              var O = w(b),
                k = m(O),
                te = m(k, !0);
              u(k);
              var ne = w(k, 2),
                A = (t) => {
                  var n = ie(),
                    a = m(n);
                  (u(n), e(() => r(a, `${(d(o), S(() => d(o).error_count)) ?? ``} err`)), i(t, n));
                };
              (t(ne, (e) => {
                (d(o), S(() => d(o).error_count > 0) && e(A));
              }),
                u(O));
              var j = w(O),
                M = m(j),
                N = (n) => {
                  var a = oe(),
                    s = x(a),
                    c = m(s, !0);
                  u(s);
                  var l = w(s, 2),
                    f = (t) => {
                      var n = ae(),
                        a = m(n, !0);
                      (u(n),
                        e(
                          (e) => {
                            (E(
                              n,
                              1,
                              `inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${e ?? ``}`,
                            ),
                              r(a, (d(o), S(() => d(o).last_status))));
                          },
                          [() => (d(o), S(() => Ae(d(o).last_status)))],
                        ),
                        i(t, n));
                    };
                  (t(l, (e) => {
                    (d(o), S(() => d(o).last_status) && e(f));
                  }),
                    e((e) => r(c, e), [() => (d(o), S(() => Z(d(o).last_run_at)))]),
                    i(n, a));
                },
                de = (e) => {
                  i(e, se());
                };
              (t(M, (e) => {
                (d(o), S(() => d(o).last_run_at) ? e(N) : e(de, -1));
              }),
                u(j));
              var fe = w(j),
                pe = m(fe),
                me = m(pe),
                he = w(me, 2);
              (u(pe), u(fe), u(c));
              var ge = w(c, 2),
                _e = (n) => {
                  var a = le(),
                    s = m(a),
                    c = m(s),
                    l = w(m(c), 2),
                    f = m(l, !0);
                  (u(l), u(c));
                  var p = w(c, 2),
                    h = w(m(p), 2),
                    g = m(h, !0);
                  (u(h), u(p));
                  var _ = w(p, 2),
                    v = w(m(_));
                  u(_);
                  var y = w(_, 2),
                    b = (t) => {
                      var n = ce(),
                        a = w(m(n));
                      (u(n), e(() => r(a, ` ${(d(o), S(() => d(o).description)) ?? ``}`)), i(t, n));
                    };
                  (t(y, (e) => {
                    (d(o), S(() => d(o).description) && e(b));
                  }),
                    u(s),
                    u(a),
                    e(
                      (e) => {
                        (r(f, (d(o), S(() => d(o).id))),
                          r(g, (d(o), S(() => d(o).trigger_type))),
                          r(
                            v,
                            ` ${(d(o), S(() => d(o).run_count)) ?? ``} total, ${(d(o), S(() => d(o).error_count)) ?? ``} errors · Created ${e ?? ``}`,
                          ));
                      },
                      [() => (d(o), S(() => Z(d(o).created_at)))],
                    ),
                    i(n, a));
                };
              (t(ge, (e) => {
                (d(U), d(o), S(() => d(U) === d(o).id) && e(_e));
              }),
                e(() => {
                  (r(p, (d(o), S(() => d(o).name))),
                    r(y, (d(o), S(() => d(o).trigger_type))),
                    ee(
                      C,
                      `aria-label`,
                      `${(d(o), S(() => (d(o).enabled ? `Disable` : `Enable`))) ?? ``} ${(d(o), S(() => d(o).name)) ?? ``}`,
                    ),
                    E(
                      C,
                      1,
                      `relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${(d(o), S(() => (d(o).enabled ? `bg-blue-600` : `bg-gray-300 dark:bg-gray-600`))) ?? ``}`,
                    ),
                    E(
                      D,
                      1,
                      `inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${(d(o), S(() => (d(o).enabled ? `translate-x-4` : `translate-x-1`))) ?? ``}`,
                    ),
                    r(te, (d(o), S(() => d(o).run_count))));
                }),
                n(`click`, C, () => De(d(o))),
                n(`click`, me, () => {
                  T(U, d(U) === d(o).id ? null : d(o).id);
                }),
                n(`click`, he, () => Oe(d(o))),
                i(a, s));
            },
          ),
            u(y),
            u(c),
            u(s),
            i(o, s));
        };
      (t(f, (e) => {
        d(Ce) ? e(p) : d(L) ? e(h, 1) : (d(P), S(() => d(P).length === 0) ? e(g, 2) : e(_, -1));
      }),
        i(s, l));
    };
  t($e, (e) => {
    d(B) === `rules` && e(et);
  });
  var tt = w($e, 2),
    nt = (s) => {
      var f = c(),
        p = x(f),
        h = (e) => {
          var t = pe();
          (a(
            t,
            4,
            () => [, , , , , ,],
            o,
            (e, t) => {
              i(e, fe());
            },
          ),
            u(t),
            i(e, t));
        },
        g = (t) => {
          var a = me(),
            o = m(a),
            s = m(o, !0);
          u(o);
          var c = w(o, 2);
          (u(a), e(() => r(s, d(z))), n(`click`, c, Ee), i(t, a));
        },
        _ = (e) => {
          i(e, he());
        },
        v = (t) => {
          var n = _e(),
            o = m(n),
            s = m(o),
            c = m(s),
            f = m(c);
          E(f, 1, l(Ne));
          var p = w(f);
          E(p, 1, l(Ne));
          var h = w(p);
          (E(
            h,
            1,
            `px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell`,
          ),
            E(
              w(h),
              1,
              `px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell`,
            ),
            u(c),
            u(s));
          var g = w(s);
          (a(
            g,
            5,
            () => d(I),
            (e) => e.id,
            (t, n) => {
              var a = ge(),
                o = m(a),
                s = m(o),
                c = m(s, !0);
              u(s);
              var l = w(s, 2),
                f = m(l);
              (u(l), u(o));
              var p = w(o),
                h = m(p),
                g = m(h, !0);
              (u(h), u(p));
              var _ = w(p),
                v = m(_, !0);
              u(_);
              var y = w(_),
                b = m(y, !0);
              (u(y),
                u(a),
                e(
                  (e, t, i, a) => {
                    (r(c, (d(n), S(() => d(n).definitionId))),
                      r(f, `${e ?? ``}...`),
                      E(
                        h,
                        1,
                        `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t ?? ``}`,
                      ),
                      r(g, (d(n), S(() => d(n).status))),
                      r(v, i),
                      r(b, a));
                  },
                  [
                    () => (d(n), S(() => d(n).id.slice(0, 8))),
                    () => (d(n), S(() => Ae(d(n).status))),
                    () => (d(n), S(() => Z(d(n).started_at))),
                    () => (
                      d(n),
                      S(() => (d(n).completed_at ? Z(d(n).completed_at) : `running...`))
                    ),
                  ],
                ),
                i(t, a));
            },
          ),
            u(g),
            u(o),
            u(n),
            i(t, n));
        };
      (t(p, (e) => {
        d(R) ? e(h) : d(z) ? e(g, 1) : (d(I), S(() => d(I).length === 0) ? e(_, 2) : e(v, -1));
      }),
        i(s, f));
    };
  (t(tt, (e) => {
    d(B) === `runs` && e(nt);
  }),
    u(Fe),
    e(
      (e, t) => {
        (r(ze, `${(d(Se), d(F), S(() => d(Se)?.total_rules ?? d(F).length)) ?? ``} total`),
          r(Ve, `${d(be) ?? ``} enabled`),
          r(Ue, `${d(xe) ?? ``} disabled`),
          r(qe, d(H) ? `Cancel` : `New Rule`),
          E($, 1, e),
          E(Qe, 1, t));
      },
      [() => l(S(() => Pe(`rules`))), () => l(S(() => Pe(`runs`)))],
    ),
    v(
      Ge,
      () => d(V),
      (e) => T(V, e),
    ),
    n(`click`, Ke, () => {
      (T(H, !d(H)), T(Y, null));
    }),
    n(`click`, $, () => je(`rules`)),
    n(`click`, Qe, () => je(`runs`)),
    i(O, Fe),
    g());
}
export { ye as component };
