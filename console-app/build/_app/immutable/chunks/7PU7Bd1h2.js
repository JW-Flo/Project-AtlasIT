import { L as e, R as t, a as n, j as r, ot as i, s as a } from "./CjbcrE1v.js";
import "./C8H49NTu.js";
import "./DuHeJQ6O.js";
import { t as o } from "./_6xtu--D.js";
function s(s, c) {
  let l = n(c, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    u = [
      [`rect`, { width: `20`, height: `8`, x: `2`, y: `2`, rx: `2`, ry: `2` }],
      [`rect`, { width: `20`, height: `8`, x: `2`, y: `14`, rx: `2`, ry: `2` }],
      [`line`, { x1: `6`, x2: `6.01`, y1: `6`, y2: `6` }],
      [`line`, { x1: `6`, x2: `6.01`, y1: `18`, y2: `18` }],
    ];
  o(
    s,
    a({ name: `server` }, () => l, {
      get iconNode() {
        return u;
      },
      children: (n, a) => {
        var o = t();
        (r(i(o), c, `default`, {}, null), e(n, o));
      },
      $$slots: { default: !0 },
    }),
  );
}
export { s as t };
