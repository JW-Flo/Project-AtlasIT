import { vt as e } from "./CjbcrE1v.js";
import "./CgBQPCl3.js";
var { subscribe: t, update: n } = e([]),
  r = { subscribe: t };
function i(e) {
  let t = crypto.randomUUID(),
    r = e.ttl ?? 4e3;
  return (n((n) => [...n, { ...e, id: t, ttl: r }]), r > 0 && setTimeout(() => a(t), r), t);
}
function a(e) {
  n((t) => t.filter((t) => t.id !== e));
}
export { i as n, r, a as t };
