export const manifest = (() => {
  function __memo(fn) {
    let value;
    return () => (value ??= value = fn());
  }

  return {
    appDir: "_app",
    appPath: "_app",
    assets: new Set([]),
    mimeTypes: {},
    _: {
      client: {
        start: "_app/immutable/entry/start.D_2UYA90.js",
        app: "_app/immutable/entry/app.B-wdnzEL.js",
        imports: [
          "_app/immutable/entry/start.D_2UYA90.js",
          "_app/immutable/chunks/FcwPhPSy.js",
          "_app/immutable/chunks/rRTekDYD.js",
          "_app/immutable/chunks/DLjC2_M2.js",
          "_app/immutable/chunks/39A_Ntu8.js",
          "_app/immutable/chunks/ApJzsbmA.js",
          "_app/immutable/entry/app.B-wdnzEL.js",
          "_app/immutable/chunks/DLjC2_M2.js",
          "_app/immutable/chunks/39A_Ntu8.js",
          "_app/immutable/chunks/Bzak7iHL.js",
          "_app/immutable/chunks/rRTekDYD.js",
          "_app/immutable/chunks/BHVF3NEQ.js",
          "_app/immutable/chunks/DXlasQxZ.js",
          "_app/immutable/chunks/BtMAuxYN.js",
          "_app/immutable/chunks/ApJzsbmA.js",
        ],
        stylesheets: [],
        fonts: [],
        uses_env_dynamic_public: false,
      },
      nodes: [
        __memo(() => import("./nodes/0.js")),
        __memo(() => import("./nodes/1.js")),
        __memo(() => import("./nodes/2.js")),
        __memo(() => import("./nodes/3.js")),
        __memo(() => import("./nodes/4.js")),
        __memo(() => import("./nodes/5.js")),
        __memo(() => import("./nodes/6.js")),
        __memo(() => import("./nodes/7.js")),
        __memo(() => import("./nodes/8.js")),
        __memo(() => import("./nodes/9.js")),
        __memo(() => import("./nodes/10.js")),
        __memo(() => import("./nodes/11.js")),
        __memo(() => import("./nodes/12.js")),
        __memo(() => import("./nodes/13.js")),
      ],
      remotes: {},
      routes: [
        {
          id: "/",
          pattern: /^\/$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 2 },
          endpoint: null,
        },
        {
          id: "/governance/compliance",
          pattern: /^\/governance\/compliance\/?$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 3 },
          endpoint: null,
        },
        {
          id: "/governance/evidence",
          pattern: /^\/governance\/evidence\/?$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 4 },
          endpoint: null,
        },
        {
          id: "/health",
          pattern: /^\/health\/?$/,
          params: [],
          page: null,
          endpoint: __memo(
            () => import("./entries/endpoints/health/_server.ts.js"),
          ),
        },
        {
          id: "/it/policies/coverage",
          pattern: /^\/it\/policies\/coverage\/?$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 5 },
          endpoint: null,
        },
        {
          id: "/it/policies/evaluate",
          pattern: /^\/it\/policies\/evaluate\/?$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 6 },
          endpoint: null,
        },
        {
          id: "/it/policies/generate",
          pattern: /^\/it\/policies\/generate\/?$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 7 },
          endpoint: null,
        },
        {
          id: "/it/policies/templates",
          pattern: /^\/it\/policies\/templates\/?$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 8 },
          endpoint: null,
        },
        {
          id: "/marketplace/slack",
          pattern: /^\/marketplace\/slack\/?$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 9 },
          endpoint: null,
        },
        {
          id: "/security/activity",
          pattern: /^\/security\/activity\/?$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 10 },
          endpoint: null,
        },
        {
          id: "/security/incidents",
          pattern: /^\/security\/incidents\/?$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 11 },
          endpoint: null,
        },
        {
          id: "/workflows",
          pattern: /^\/workflows\/?$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 12 },
          endpoint: null,
        },
        {
          id: "/workflows/executions/[id]",
          pattern: /^\/workflows\/executions\/([^/]+?)\/?$/,
          params: [
            { name: "id", optional: false, rest: false, chained: false },
          ],
          page: { layouts: [0], errors: [1], leaf: 13 },
          endpoint: null,
        },
      ],
      prerendered_routes: new Set([]),
      matchers: async () => {
        return {};
      },
      server_assets: {},
    },
  };
})();
