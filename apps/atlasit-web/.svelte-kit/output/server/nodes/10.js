import * as universal from "../entries/pages/security/activity/_page.ts.js";

export const index = 10;
let component_cache;
export const component = async () =>
  (component_cache ??= (
    await import("../entries/pages/security/activity/_page.svelte.js")
  ).default);
export { universal };
export const universal_id = "src/routes/security/activity/+page.ts";
export const imports = [
  "_app/immutable/nodes/10.B2CtQ7J4.js",
  "_app/immutable/chunks/DXY25tU5.js",
  "_app/immutable/chunks/Bzak7iHL.js",
  "_app/immutable/chunks/B37ZqHvF.js",
  "_app/immutable/chunks/DLjC2_M2.js",
  "_app/immutable/chunks/39A_Ntu8.js",
  "_app/immutable/chunks/BHVF3NEQ.js",
  "_app/immutable/chunks/B36Hb1sH.js",
  "_app/immutable/chunks/CLYubSJh.js",
  "_app/immutable/chunks/DXlasQxZ.js",
  "_app/immutable/chunks/BtMAuxYN.js",
  "_app/immutable/chunks/ApJzsbmA.js",
];
export const stylesheets = ["_app/immutable/assets/10.p2MU3IHz.css"];
export const fonts = [];
