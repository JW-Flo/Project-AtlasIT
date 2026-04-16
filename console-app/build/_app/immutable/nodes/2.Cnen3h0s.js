import { L as e, bt as t, l as n, r, xt as i, z as a } from "../chunks/CjbcrE1v.js";
import { t as o } from "../chunks/CkfEZRj5.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import "../chunks/CZkNuRnP2.js";
var s = a(
  `<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div class="text-center text-gray-500 dark:text-gray-400"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" role="status" aria-label="Loading"></div> <p class="mt-4">Loading AtlasIT...</p></div></div>`,
);
function c(a, c) {
  (i(c, !1),
    r(() => {
      o(
        typeof sessionStorage < `u` && sessionStorage.getItem(`atlasit_token`)
          ? `/console`
          : `/login`,
        { replaceState: !0 },
      );
    }),
    n(),
    e(a, s()),
    t());
}
export { c as component };
