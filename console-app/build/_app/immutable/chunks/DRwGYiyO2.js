import { _t as e, vt as t } from "./CjbcrE1v.js";
import "./CgBQPCl3.js";
var n = t(null),
  r = t(!1),
  i = !1;
function a(e) {
  return e >= 90 ? `A` : e >= 80 ? `B` : e >= 70 ? `C` : e >= 60 ? `D` : `F`;
}
function o() {
  ((i = !1), n.set(null));
}
async function s() {
  if (i) return e(n);
  r.set(!0);
  try {
    let e = await fetch(`/api/tenant-compliance/scores`);
    if (!e.ok) return (n.set(null), null);
    let t = await e.json(),
      r = (t.scores || []).map((e) => ({
        framework: e.framework,
        score: Math.round(e.score ?? 0),
        grade: e.grade || a(e.score ?? 0),
        source: e.source,
      }));
    if (r.length === 0) return (n.set(null), null);
    let o = Math.round(r.reduce((e, t) => e + t.score, 0) / r.length),
      s = {
        overallScore: o,
        grade: a(o),
        frameworks: r,
        globalSource: t.source || `empty`,
        lastUpdated: new Date().toISOString(),
      };
    return (n.set(s), (i = !0), s);
  } catch {
    return (n.set(null), null);
  } finally {
    r.set(!1);
  }
}
function c(e) {
  if (!e?.scores || i) return;
  let t = (e.scores || []).map((e) => ({
    framework: e.framework,
    score: Math.round(e.score ?? 0),
    grade: e.grade || a(e.score ?? 0),
    source: e.source,
  }));
  if (t.length === 0) return;
  let o = Math.round(t.reduce((e, t) => e + t.score, 0) / t.length);
  (n.set({
    overallScore: o,
    grade: a(o),
    frameworks: t,
    globalSource: e.source || `empty`,
    lastUpdated: new Date().toISOString(),
  }),
    (i = !0),
    r.set(!1));
}
async function l() {
  return ((i = !1), s());
}
export { l as a, c as i, n, s as r, o as t };
