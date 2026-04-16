import { vt as e } from "./CjbcrE1v.js";
import "./CgBQPCl3.js";
var t = e(null),
  n = e(!0),
  r = !1;
function i() {
  if (typeof sessionStorage > `u`) return null;
  let e = sessionStorage.getItem(`atlasit_token`),
    t = sessionStorage.getItem(`atlasit_user`);
  if (!e || !t) return null;
  try {
    let e = JSON.parse(t);
    return {
      authenticated: !0,
      email: e.email,
      roles: e.role ? [e.role] : [`viewer`],
      tenantId: e.tenantId,
    };
  } catch {
    return null;
  }
}
async function a() {
  if (r) {
    n.set(!1);
    let e = null;
    return (t.subscribe((t) => (e = t))(), e);
  }
  let e = i();
  return e ? (t.set(e), (r = !0), n.set(!1), e) : (t.set(null), n.set(!1), null);
}
async function o() {
  return ((r = !1), a());
}
export { o as n, t as r, a as t };
