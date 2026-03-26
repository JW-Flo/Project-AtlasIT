var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) =>
  function __init() {
    return (fn && (res = (0, fn[__getOwnPropNames(fn)[0]])((fn = 0))), res);
  };
var __commonJS = (cb, mod) =>
  function __require() {
    return (
      mod ||
        (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod),
      mod.exports
    );
  };
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, {
          get: () => from[key2],
          enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable,
        });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, "default", { value: mod, enumerable: true })
      : target,
    mod,
  )
);

// .svelte-kit/output/server/chunks/false.js
var BROWSER;
var init_false = __esm({
  ".svelte-kit/output/server/chunks/false.js"() {
    BROWSER = false;
  },
});

// node_modules/.pnpm/@sveltejs+kit@2.42.1_@sveltejs+vite-plugin-svelte@6.2.0_svelte@5.38.10_vite@6.3.6__svelte@5.38.10_vite@6.3.6/node_modules/@sveltejs/kit/src/exports/internal/remote-functions.js
var init_remote_functions = __esm({
  "node_modules/.pnpm/@sveltejs+kit@2.42.1_@sveltejs+vite-plugin-svelte@6.2.0_svelte@5.38.10_vite@6.3.6__svelte@5.38.10_vite@6.3.6/node_modules/@sveltejs/kit/src/exports/internal/remote-functions.js"() {},
});

// node_modules/.pnpm/@sveltejs+kit@2.42.1_@sveltejs+vite-plugin-svelte@6.2.0_svelte@5.38.10_vite@6.3.6__svelte@5.38.10_vite@6.3.6/node_modules/@sveltejs/kit/src/exports/internal/index.js
var HttpError, Redirect, SvelteKitError, ActionFailure;
var init_internal = __esm({
  "node_modules/.pnpm/@sveltejs+kit@2.42.1_@sveltejs+vite-plugin-svelte@6.2.0_svelte@5.38.10_vite@6.3.6__svelte@5.38.10_vite@6.3.6/node_modules/@sveltejs/kit/src/exports/internal/index.js"() {
    init_remote_functions();
    HttpError = class {
      /**
       * @param {number} status
       * @param {{message: string} extends App.Error ? (App.Error | string | undefined) : App.Error} body
       */
      constructor(status, body2) {
        this.status = status;
        if (typeof body2 === "string") {
          this.body = { message: body2 };
        } else if (body2) {
          this.body = body2;
        } else {
          this.body = { message: `Error: ${status}` };
        }
      }
      toString() {
        return JSON.stringify(this.body);
      }
    };
    Redirect = class {
      /**
       * @param {300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308} status
       * @param {string} location
       */
      constructor(status, location) {
        this.status = status;
        this.location = location;
      }
    };
    SvelteKitError = class extends Error {
      /**
       * @param {number} status
       * @param {string} text
       * @param {string} message
       */
      constructor(status, text2, message) {
        super(message);
        this.status = status;
        this.text = text2;
      }
    };
    ActionFailure = class {
      /**
       * @param {number} status
       * @param {T} data
       */
      constructor(status, data) {
        this.status = status;
        this.data = data;
      }
    };
  },
});

// .svelte-kit/output/server/chunks/exports.js
function resolve(base3, path) {
  if (path[0] === "/" && path[1] === "/") return path;
  let url = new URL(base3, internal);
  url = new URL(path, url);
  return url.protocol === internal.protocol
    ? url.pathname + url.search + url.hash
    : url.href;
}
function normalize_path(path, trailing_slash) {
  if (path === "/" || trailing_slash === "ignore") return path;
  if (trailing_slash === "never") {
    return path.endsWith("/") ? path.slice(0, -1) : path;
  } else if (trailing_slash === "always" && !path.endsWith("/")) {
    return path + "/";
  }
  return path;
}
function decode_pathname(pathname) {
  return pathname.split("%25").map(decodeURI).join("%25");
}
function decode_params(params) {
  for (const key2 in params) {
    params[key2] = decodeURIComponent(params[key2]);
  }
  return params;
}
function make_trackable(
  url,
  callback,
  search_params_callback,
  allow_hash = false,
) {
  const tracked = new URL(url);
  Object.defineProperty(tracked, "searchParams", {
    value: new Proxy(tracked.searchParams, {
      get(obj, key2) {
        if (key2 === "get" || key2 === "getAll" || key2 === "has") {
          return (param) => {
            search_params_callback(param);
            return obj[key2](param);
          };
        }
        callback();
        const value = Reflect.get(obj, key2);
        return typeof value === "function" ? value.bind(obj) : value;
      },
    }),
    enumerable: true,
    configurable: true,
  });
  const tracked_url_properties = [
    "href",
    "pathname",
    "search",
    "toString",
    "toJSON",
  ];
  if (allow_hash) tracked_url_properties.push("hash");
  for (const property of tracked_url_properties) {
    Object.defineProperty(tracked, property, {
      get() {
        callback();
        return url[property];
      },
      enumerable: true,
      configurable: true,
    });
  }
  {
    tracked[Symbol.for("nodejs.util.inspect.custom")] = (
      depth,
      opts,
      inspect,
    ) => {
      return inspect(url, opts);
    };
    tracked.searchParams[Symbol.for("nodejs.util.inspect.custom")] = (
      depth,
      opts,
      inspect,
    ) => {
      return inspect(url.searchParams, opts);
    };
  }
  if (!allow_hash) {
    disable_hash(tracked);
  }
  return tracked;
}
function disable_hash(url) {
  allow_nodejs_console_log(url);
  Object.defineProperty(url, "hash", {
    get() {
      throw new Error(
        "Cannot access event.url.hash. Consider using `page.url.hash` inside a component instead",
      );
    },
  });
}
function disable_search(url) {
  allow_nodejs_console_log(url);
  for (const property of ["search", "searchParams"]) {
    Object.defineProperty(url, property, {
      get() {
        throw new Error(
          `Cannot access url.${property} on a page with prerendering enabled`,
        );
      },
    });
  }
}
function allow_nodejs_console_log(url) {
  {
    url[Symbol.for("nodejs.util.inspect.custom")] = (depth, opts, inspect) => {
      return inspect(new URL(url), opts);
    };
  }
}
function validator(expected) {
  function validate(module, file) {
    if (!module) return;
    for (const key2 in module) {
      if (key2[0] === "_" || expected.has(key2)) continue;
      const values = [...expected.values()];
      const hint =
        hint_for_supported_files(key2, file?.slice(file.lastIndexOf("."))) ??
        `valid exports are ${values.join(", ")}, or anything with a '_' prefix`;
      throw new Error(
        `Invalid export '${key2}'${file ? ` in ${file}` : ""} (${hint})`,
      );
    }
  }
  return validate;
}
function hint_for_supported_files(key2, ext = ".js") {
  const supported_files = [];
  if (valid_layout_exports.has(key2)) {
    supported_files.push(`+layout${ext}`);
  }
  if (valid_page_exports.has(key2)) {
    supported_files.push(`+page${ext}`);
  }
  if (valid_layout_server_exports.has(key2)) {
    supported_files.push(`+layout.server${ext}`);
  }
  if (valid_page_server_exports.has(key2)) {
    supported_files.push(`+page.server${ext}`);
  }
  if (valid_server_exports.has(key2)) {
    supported_files.push(`+server${ext}`);
  }
  if (supported_files.length > 0) {
    return `'${key2}' is a valid export in ${supported_files.slice(0, -1).join(", ")}${supported_files.length > 1 ? " or " : ""}${supported_files.at(-1)}`;
  }
}
var internal,
  valid_layout_exports,
  valid_page_exports,
  valid_layout_server_exports,
  valid_page_server_exports,
  valid_server_exports,
  validate_layout_exports,
  validate_page_exports,
  validate_layout_server_exports,
  validate_page_server_exports,
  validate_server_exports;
var init_exports = __esm({
  ".svelte-kit/output/server/chunks/exports.js"() {
    internal = new URL("sveltekit-internal://");
    valid_layout_exports = /* @__PURE__ */ new Set([
      "load",
      "prerender",
      "csr",
      "ssr",
      "trailingSlash",
      "config",
    ]);
    valid_page_exports = /* @__PURE__ */ new Set([
      ...valid_layout_exports,
      "entries",
    ]);
    valid_layout_server_exports = /* @__PURE__ */ new Set([
      ...valid_layout_exports,
    ]);
    valid_page_server_exports = /* @__PURE__ */ new Set([
      ...valid_layout_server_exports,
      "actions",
      "entries",
    ]);
    valid_server_exports = /* @__PURE__ */ new Set([
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
      "HEAD",
      "fallback",
      "prerender",
      "trailingSlash",
      "config",
      "entries",
    ]);
    validate_layout_exports = validator(valid_layout_exports);
    validate_page_exports = validator(valid_page_exports);
    validate_layout_server_exports = validator(valid_layout_server_exports);
    validate_page_server_exports = validator(valid_page_server_exports);
    validate_server_exports = validator(valid_server_exports);
  },
});

// .svelte-kit/output/server/chunks/utils.js
function get_relative_path(from, to) {
  const from_parts = from.split(/[/\\]/);
  const to_parts = to.split(/[/\\]/);
  from_parts.pop();
  while (from_parts[0] === to_parts[0]) {
    from_parts.shift();
    to_parts.shift();
  }
  let i = from_parts.length;
  while (i--) from_parts[i] = "..";
  return from_parts.concat(to_parts).join("/");
}
function base64_encode(bytes) {
  if (globalThis.Buffer) {
    return globalThis.Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function base64_decode(encoded) {
  if (globalThis.Buffer) {
    const buffer = globalThis.Buffer.from(encoded, "base64");
    return new Uint8Array(buffer);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
var text_encoder2, text_decoder2, file_transport;
var init_utils = __esm({
  ".svelte-kit/output/server/chunks/utils.js"() {
    text_encoder2 = new TextEncoder();
    text_decoder2 = new TextDecoder();
    file_transport = {
      encode: (file) =>
        file instanceof File && {
          size: file.size,
          type: file.type,
          name: file.name,
          lastModified: file.lastModified,
        },
      decode: (data) => data,
    };
  },
});

// ../../node_modules/clsx/dist/clsx.mjs
var init_clsx = __esm({
  "../../node_modules/clsx/dist/clsx.mjs"() {},
});

// .svelte-kit/output/server/chunks/attributes.js
function escape_html(value, is_attr) {
  const str = String(value ?? "");
  const pattern2 = is_attr ? ATTR_REGEX : CONTENT_REGEX;
  pattern2.lastIndex = 0;
  let escaped2 = "";
  let last = 0;
  while (pattern2.test(str)) {
    const i = pattern2.lastIndex - 1;
    const ch = str[i];
    escaped2 +=
      str.substring(last, i) +
      (ch === "&" ? "&amp;" : ch === '"' ? "&quot;" : "&lt;");
    last = i + 1;
  }
  return escaped2 + str.substring(last);
}
function attr(name, value, is_boolean = false) {
  if (value == null || (!value && is_boolean)) return "";
  const normalized =
    (name in replacements && replacements[name].get(value)) || value;
  const assignment = is_boolean ? "" : `="${escape_html(normalized, true)}"`;
  return ` ${name}${assignment}`;
}
function to_class(value, hash2, directives) {
  var classname = value == null ? "" : "" + value;
  if (hash2) {
    classname = classname ? classname + " " + hash2 : hash2;
  }
  if (directives) {
    for (var key2 in directives) {
      if (directives[key2]) {
        classname = classname ? classname + " " + key2 : key2;
      } else if (classname.length) {
        var len = key2.length;
        var a = 0;
        while ((a = classname.indexOf(key2, a)) >= 0) {
          var b = a + len;
          if (
            (a === 0 || whitespace.includes(classname[a - 1])) &&
            (b === classname.length || whitespace.includes(classname[b]))
          ) {
            classname =
              (a === 0 ? "" : classname.substring(0, a)) +
              classname.substring(b + 1);
          } else {
            a = b;
          }
        }
      }
    }
  }
  return classname === "" ? null : classname;
}
var ATTR_REGEX, CONTENT_REGEX, replacements, whitespace;
var init_attributes = __esm({
  ".svelte-kit/output/server/chunks/attributes.js"() {
    init_clsx();
    ATTR_REGEX = /[&"<]/g;
    CONTENT_REGEX = /[&<]/g;
    replacements = {
      translate: /* @__PURE__ */ new Map([
        [true, "yes"],
        [false, "no"],
      ]),
    };
    whitespace = [..." 	\n\r\f\xA0\v\uFEFF"];
  },
});

// .svelte-kit/output/server/chunks/index2.js
function run_all(arr) {
  for (var i = 0; i < arr.length; i++) {
    arr[i]();
  }
}
function deferred() {
  var resolve2;
  var reject;
  var promise = new Promise((res, rej) => {
    resolve2 = res;
    reject = rej;
  });
  return { promise, resolve: resolve2, reject };
}
function equals(value) {
  return value === this.v;
}
function safe_not_equal(a, b) {
  return a != a
    ? b == b
    : a !== b ||
        (a !== null && typeof a === "object") ||
        typeof a === "function";
}
function safe_equals(value) {
  return !safe_not_equal(value, this.v);
}
function lifecycle_outside_component(name) {
  {
    throw new Error(`https://svelte.dev/e/lifecycle_outside_component`);
  }
}
function effect_update_depth_exceeded() {
  {
    throw new Error(`https://svelte.dev/e/effect_update_depth_exceeded`);
  }
}
function hydration_failed() {
  {
    throw new Error(`https://svelte.dev/e/hydration_failed`);
  }
}
function state_descriptors_fixed() {
  {
    throw new Error(`https://svelte.dev/e/state_descriptors_fixed`);
  }
}
function state_prototype_fixed() {
  {
    throw new Error(`https://svelte.dev/e/state_prototype_fixed`);
  }
}
function state_unsafe_mutation() {
  {
    throw new Error(`https://svelte.dev/e/state_unsafe_mutation`);
  }
}
function set_component_context(context2) {
  component_context = context2;
}
function push$1(props, runes = false, fn) {
  component_context = {
    p: component_context,
    c: null,
    e: null,
    s: props,
    x: null,
    l: null,
  };
}
function pop$1(component15) {
  var context2 =
    /** @type {ComponentContext} */
    component_context;
  var effects = context2.e;
  if (effects !== null) {
    context2.e = null;
    for (var fn of effects) {
      create_user_effect(fn);
    }
  }
  component_context = context2.p;
  return (
    /** @type {T} */
    {}
  );
}
function is_runes() {
  return true;
}
function handle_error(error2) {
  var effect = active_effect;
  if (effect === null) {
    active_reaction.f |= ERROR_VALUE;
    return error2;
  }
  if ((effect.f & EFFECT_RAN) === 0) {
    if ((effect.f & BOUNDARY_EFFECT) === 0) {
      if (!effect.parent && error2 instanceof Error) {
        apply_adjustments(error2);
      }
      throw error2;
    }
    effect.b.error(error2);
  } else {
    invoke_error_boundary(error2, effect);
  }
}
function invoke_error_boundary(error2, effect) {
  while (effect !== null) {
    if ((effect.f & BOUNDARY_EFFECT) !== 0) {
      try {
        effect.b.error(error2);
        return;
      } catch (e3) {
        error2 = e3;
      }
    }
    effect = effect.parent;
  }
  if (error2 instanceof Error) {
    apply_adjustments(error2);
  }
  throw error2;
}
function apply_adjustments(error2) {
  const adjusted = adjustments.get(error2);
  if (adjusted) {
    define_property(error2, "message", {
      value: adjusted.message,
    });
    define_property(error2, "stack", {
      value: adjusted.stack,
    });
  }
}
function run_micro_tasks() {
  var tasks = micro_tasks;
  micro_tasks = [];
  run_all(tasks);
}
function run_idle_tasks() {
  var tasks = idle_tasks;
  idle_tasks = [];
  run_all(tasks);
}
function has_pending_tasks() {
  return micro_tasks.length > 0 || idle_tasks.length > 0;
}
function queue_micro_task(fn) {
  if (micro_tasks.length === 0 && !is_flushing_sync) {
    var tasks = micro_tasks;
    queueMicrotask(() => {
      if (tasks === micro_tasks) run_micro_tasks();
    });
  }
  micro_tasks.push(fn);
}
function flush_tasks() {
  if (micro_tasks.length > 0) {
    run_micro_tasks();
  }
  if (idle_tasks.length > 0) {
    run_idle_tasks();
  }
}
function destroy_derived_effects(derived) {
  var effects = derived.effects;
  if (effects !== null) {
    derived.effects = null;
    for (var i = 0; i < effects.length; i += 1) {
      destroy_effect(
        /** @type {Effect} */
        effects[i],
      );
    }
  }
}
function get_derived_parent_effect(derived) {
  var parent = derived.parent;
  while (parent !== null) {
    if ((parent.f & DERIVED) === 0) {
      return (
        /** @type {Effect} */
        parent
      );
    }
    parent = parent.parent;
  }
  return null;
}
function execute_derived(derived) {
  var value;
  var prev_active_effect = active_effect;
  set_active_effect(get_derived_parent_effect(derived));
  {
    try {
      destroy_derived_effects(derived);
      value = update_reaction(derived);
    } finally {
      set_active_effect(prev_active_effect);
    }
  }
  return value;
}
function update_derived(derived) {
  var value = execute_derived(derived);
  if (!derived.equals(value)) {
    derived.v = value;
    derived.wv = increment_write_version();
  }
  if (is_destroying_effect) {
    return;
  }
  {
    var status =
      (skip_reaction || (derived.f & UNOWNED) !== 0) && derived.deps !== null
        ? MAYBE_DIRTY
        : CLEAN;
    set_signal_status(derived, status);
  }
}
function flushSync(fn) {
  var was_flushing_sync = is_flushing_sync;
  is_flushing_sync = true;
  try {
    var result;
    if (fn);
    while (true) {
      flush_tasks();
      if (queued_root_effects.length === 0 && !has_pending_tasks()) {
        current_batch?.flush();
        if (queued_root_effects.length === 0) {
          last_scheduled_effect = null;
          return (
            /** @type {T} */
            result
          );
        }
      }
      flush_effects();
    }
  } finally {
    is_flushing_sync = was_flushing_sync;
  }
}
function flush_effects() {
  var was_updating_effect = is_updating_effect;
  is_flushing = true;
  try {
    var flush_count = 0;
    set_is_updating_effect(true);
    while (queued_root_effects.length > 0) {
      var batch = Batch.ensure();
      if (flush_count++ > 1e3) {
        var updates, entry;
        if (BROWSER);
        infinite_loop_guard();
      }
      batch.process(queued_root_effects);
      old_values.clear();
    }
  } finally {
    is_flushing = false;
    set_is_updating_effect(was_updating_effect);
    last_scheduled_effect = null;
  }
}
function infinite_loop_guard() {
  try {
    effect_update_depth_exceeded();
  } catch (error2) {
    invoke_error_boundary(error2, last_scheduled_effect);
  }
}
function flush_queued_effects(effects) {
  var length = effects.length;
  if (length === 0) return;
  var i = 0;
  while (i < length) {
    var effect = effects[i++];
    if ((effect.f & (DESTROYED | INERT)) === 0 && is_dirty(effect)) {
      eager_block_effects = [];
      update_effect(effect);
      if (
        effect.deps === null &&
        effect.first === null &&
        effect.nodes_start === null
      ) {
        if (effect.teardown === null && effect.ac === null) {
          unlink_effect(effect);
        } else {
          effect.fn = null;
        }
      }
      if (eager_block_effects?.length > 0) {
        old_values.clear();
        for (const e3 of eager_block_effects) {
          update_effect(e3);
        }
        eager_block_effects = [];
      }
    }
  }
  eager_block_effects = null;
}
function schedule_effect(signal) {
  var effect = (last_scheduled_effect = signal);
  while (effect.parent !== null) {
    effect = effect.parent;
    var flags = effect.f;
    if (
      is_flushing &&
      effect === active_effect &&
      (flags & BLOCK_EFFECT) !== 0
    ) {
      return;
    }
    if ((flags & (ROOT_EFFECT | BRANCH_EFFECT)) !== 0) {
      if ((flags & CLEAN) === 0) return;
      effect.f ^= CLEAN;
    }
  }
  queued_root_effects.push(effect);
}
function source(v, stack) {
  var signal = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v,
    reactions: null,
    equals,
    rv: 0,
    wv: 0,
  };
  return signal;
}
// @__NO_SIDE_EFFECTS__
function state(v, stack) {
  const s3 = source(v);
  push_reaction_value(s3);
  return s3;
}
// @__NO_SIDE_EFFECTS__
function mutable_source(initial_value, immutable2 = false, trackable = true) {
  const s3 = source(initial_value);
  if (!immutable2) {
    s3.equals = safe_equals;
  }
  return s3;
}
function set(source2, value, should_proxy = false) {
  if (
    active_reaction !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
    // to ensure we error if state is set inside an inspect effect
    (!untracking || (active_reaction.f & INSPECT_EFFECT) !== 0) &&
    is_runes() &&
    (active_reaction.f & (DERIVED | BLOCK_EFFECT | ASYNC | INSPECT_EFFECT)) !==
      0 &&
    !current_sources?.includes(source2)
  ) {
    state_unsafe_mutation();
  }
  let new_value = should_proxy ? proxy(value) : value;
  return internal_set(source2, new_value);
}
function internal_set(source2, value) {
  if (!source2.equals(value)) {
    var old_value = source2.v;
    if (is_destroying_effect) {
      old_values.set(source2, value);
    } else {
      old_values.set(source2, old_value);
    }
    source2.v = value;
    var batch = Batch.ensure();
    batch.capture(source2, old_value);
    if ((source2.f & DERIVED) !== 0) {
      if ((source2.f & DIRTY) !== 0) {
        execute_derived(
          /** @type {Derived} */
          source2,
        );
      }
      set_signal_status(
        source2,
        (source2.f & UNOWNED) === 0 ? CLEAN : MAYBE_DIRTY,
      );
    }
    source2.wv = increment_write_version();
    mark_reactions(source2, DIRTY);
    if (
      active_effect !== null &&
      (active_effect.f & CLEAN) !== 0 &&
      (active_effect.f & (BRANCH_EFFECT | ROOT_EFFECT)) === 0
    ) {
      if (untracked_writes === null) {
        set_untracked_writes([source2]);
      } else {
        untracked_writes.push(source2);
      }
    }
  }
  return value;
}
function increment(source2) {
  set(source2, source2.v + 1);
}
function mark_reactions(signal, status) {
  var reactions = signal.reactions;
  if (reactions === null) return;
  var length = reactions.length;
  for (var i = 0; i < length; i++) {
    var reaction = reactions[i];
    var flags = reaction.f;
    var not_dirty = (flags & DIRTY) === 0;
    if (not_dirty) {
      set_signal_status(reaction, status);
    }
    if ((flags & DERIVED) !== 0) {
      mark_reactions(
        /** @type {Derived} */
        reaction,
        MAYBE_DIRTY,
      );
    } else if (not_dirty) {
      if ((flags & BLOCK_EFFECT) !== 0) {
        if (eager_block_effects !== null) {
          eager_block_effects.push(
            /** @type {Effect} */
            reaction,
          );
        }
      }
      schedule_effect(
        /** @type {Effect} */
        reaction,
      );
    }
  }
}
function proxy(value) {
  if (typeof value !== "object" || value === null || STATE_SYMBOL in value) {
    return value;
  }
  const prototype = get_prototype_of(value);
  if (prototype !== object_prototype && prototype !== array_prototype) {
    return value;
  }
  var sources = /* @__PURE__ */ new Map();
  var is_proxied_array = is_array(value);
  var version = /* @__PURE__ */ state(0);
  var parent_version = update_version;
  var with_parent = (fn) => {
    if (update_version === parent_version) {
      return fn();
    }
    var reaction = active_reaction;
    var version2 = update_version;
    set_active_reaction(null);
    set_update_version(parent_version);
    var result = fn();
    set_active_reaction(reaction);
    set_update_version(version2);
    return result;
  };
  if (is_proxied_array) {
    sources.set(
      "length",
      /* @__PURE__ */ state(
        /** @type {any[]} */
        value.length,
      ),
    );
  }
  return new Proxy(
    /** @type {any} */
    value,
    {
      defineProperty(_, prop, descriptor) {
        if (
          !("value" in descriptor) ||
          descriptor.configurable === false ||
          descriptor.enumerable === false ||
          descriptor.writable === false
        ) {
          state_descriptors_fixed();
        }
        var s3 = sources.get(prop);
        if (s3 === void 0) {
          s3 = with_parent(() => {
            var s22 = /* @__PURE__ */ state(descriptor.value);
            sources.set(prop, s22);
            return s22;
          });
        } else {
          set(s3, descriptor.value, true);
        }
        return true;
      },
      deleteProperty(target, prop) {
        var s3 = sources.get(prop);
        if (s3 === void 0) {
          if (prop in target) {
            const s22 = with_parent(() => /* @__PURE__ */ state(UNINITIALIZED));
            sources.set(prop, s22);
            increment(version);
          }
        } else {
          set(s3, UNINITIALIZED);
          increment(version);
        }
        return true;
      },
      get(target, prop, receiver) {
        if (prop === STATE_SYMBOL) {
          return value;
        }
        var s3 = sources.get(prop);
        var exists = prop in target;
        if (
          s3 === void 0 &&
          (!exists || get_descriptor(target, prop)?.writable)
        ) {
          s3 = with_parent(() => {
            var p = proxy(exists ? target[prop] : UNINITIALIZED);
            var s22 = /* @__PURE__ */ state(p);
            return s22;
          });
          sources.set(prop, s3);
        }
        if (s3 !== void 0) {
          var v = get(s3);
          return v === UNINITIALIZED ? void 0 : v;
        }
        return Reflect.get(target, prop, receiver);
      },
      getOwnPropertyDescriptor(target, prop) {
        var descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
        if (descriptor && "value" in descriptor) {
          var s3 = sources.get(prop);
          if (s3) descriptor.value = get(s3);
        } else if (descriptor === void 0) {
          var source2 = sources.get(prop);
          var value2 = source2?.v;
          if (source2 !== void 0 && value2 !== UNINITIALIZED) {
            return {
              enumerable: true,
              configurable: true,
              value: value2,
              writable: true,
            };
          }
        }
        return descriptor;
      },
      has(target, prop) {
        if (prop === STATE_SYMBOL) {
          return true;
        }
        var s3 = sources.get(prop);
        var has =
          (s3 !== void 0 && s3.v !== UNINITIALIZED) ||
          Reflect.has(target, prop);
        if (
          s3 !== void 0 ||
          (active_effect !== null &&
            (!has || get_descriptor(target, prop)?.writable))
        ) {
          if (s3 === void 0) {
            s3 = with_parent(() => {
              var p = has ? proxy(target[prop]) : UNINITIALIZED;
              var s22 = /* @__PURE__ */ state(p);
              return s22;
            });
            sources.set(prop, s3);
          }
          var value2 = get(s3);
          if (value2 === UNINITIALIZED) {
            return false;
          }
        }
        return has;
      },
      set(target, prop, value2, receiver) {
        var s3 = sources.get(prop);
        var has = prop in target;
        if (is_proxied_array && prop === "length") {
          for (var i = value2; i < /** @type {Source<number>} */ s3.v; i += 1) {
            var other_s = sources.get(i + "");
            if (other_s !== void 0) {
              set(other_s, UNINITIALIZED);
            } else if (i in target) {
              other_s = with_parent(() => /* @__PURE__ */ state(UNINITIALIZED));
              sources.set(i + "", other_s);
            }
          }
        }
        if (s3 === void 0) {
          if (!has || get_descriptor(target, prop)?.writable) {
            s3 = with_parent(() => /* @__PURE__ */ state(void 0));
            set(s3, proxy(value2));
            sources.set(prop, s3);
          }
        } else {
          has = s3.v !== UNINITIALIZED;
          var p = with_parent(() => proxy(value2));
          set(s3, p);
        }
        var descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
        if (descriptor?.set) {
          descriptor.set.call(receiver, value2);
        }
        if (!has) {
          if (is_proxied_array && typeof prop === "string") {
            var ls =
              /** @type {Source<number>} */
              sources.get("length");
            var n2 = Number(prop);
            if (Number.isInteger(n2) && n2 >= ls.v) {
              set(ls, n2 + 1);
            }
          }
          increment(version);
        }
        return true;
      },
      ownKeys(target) {
        get(version);
        var own_keys = Reflect.ownKeys(target).filter((key22) => {
          var source3 = sources.get(key22);
          return source3 === void 0 || source3.v !== UNINITIALIZED;
        });
        for (var [key2, source2] of sources) {
          if (source2.v !== UNINITIALIZED && !(key2 in target)) {
            own_keys.push(key2);
          }
        }
        return own_keys;
      },
      setPrototypeOf() {
        state_prototype_fixed();
      },
    },
  );
}
function init_operations() {
  if ($window !== void 0) {
    return;
  }
  $window = window;
  var element_prototype = Element.prototype;
  var node_prototype = Node.prototype;
  var text_prototype = Text.prototype;
  first_child_getter = get_descriptor(node_prototype, "firstChild").get;
  next_sibling_getter = get_descriptor(node_prototype, "nextSibling").get;
  if (is_extensible(element_prototype)) {
    element_prototype.__click = void 0;
    element_prototype.__className = void 0;
    element_prototype.__attributes = null;
    element_prototype.__style = void 0;
    element_prototype.__e = void 0;
  }
  if (is_extensible(text_prototype)) {
    text_prototype.__t = void 0;
  }
}
function create_text(value = "") {
  return document.createTextNode(value);
}
// @__NO_SIDE_EFFECTS__
function get_first_child(node) {
  return first_child_getter.call(node);
}
// @__NO_SIDE_EFFECTS__
function get_next_sibling(node) {
  return next_sibling_getter.call(node);
}
function clear_text_content(node) {
  node.textContent = "";
}
function without_reactive_context(fn) {
  var previous_reaction = active_reaction;
  var previous_effect = active_effect;
  set_active_reaction(null);
  set_active_effect(null);
  try {
    return fn();
  } finally {
    set_active_reaction(previous_reaction);
    set_active_effect(previous_effect);
  }
}
function push_effect(effect, parent_effect) {
  var parent_last = parent_effect.last;
  if (parent_last === null) {
    parent_effect.last = parent_effect.first = effect;
  } else {
    parent_last.next = effect;
    effect.prev = parent_last;
    parent_effect.last = effect;
  }
}
function create_effect(type, fn, sync, push2 = true) {
  var parent = active_effect;
  if (parent !== null && (parent.f & INERT) !== 0) {
    type |= INERT;
  }
  var effect = {
    ctx: component_context,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: type | DIRTY,
    first: null,
    fn,
    last: null,
    next: null,
    parent,
    b: parent && parent.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null,
  };
  if (sync) {
    try {
      update_effect(effect);
      effect.f |= EFFECT_RAN;
    } catch (e22) {
      destroy_effect(effect);
      throw e22;
    }
  } else if (fn !== null) {
    schedule_effect(effect);
  }
  if (push2) {
    var e3 = effect;
    if (
      sync &&
      e3.deps === null &&
      e3.teardown === null &&
      e3.nodes_start === null &&
      e3.first === e3.last && // either `null`, or a singular child
      (e3.f & EFFECT_PRESERVED) === 0
    ) {
      e3 = e3.first;
    }
    if (e3 !== null) {
      e3.parent = parent;
      if (parent !== null) {
        push_effect(e3, parent);
      }
      if (
        active_reaction !== null &&
        (active_reaction.f & DERIVED) !== 0 &&
        (type & ROOT_EFFECT) === 0
      ) {
        var derived =
          /** @type {Derived} */
          active_reaction;
        (derived.effects ??= []).push(e3);
      }
    }
  }
  return effect;
}
function create_user_effect(fn) {
  return create_effect(EFFECT | USER_EFFECT, fn, false);
}
function component_root(fn) {
  Batch.ensure();
  const effect = create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn, true);
  return (options2 = {}) => {
    return new Promise((fulfil) => {
      if (options2.outro) {
        pause_effect(effect, () => {
          destroy_effect(effect);
          fulfil(void 0);
        });
      } else {
        destroy_effect(effect);
        fulfil(void 0);
      }
    });
  };
}
function branch(fn, push2 = true) {
  return create_effect(BRANCH_EFFECT | EFFECT_PRESERVED, fn, true, push2);
}
function execute_effect_teardown(effect) {
  var teardown = effect.teardown;
  if (teardown !== null) {
    const previously_destroying_effect = is_destroying_effect;
    const previous_reaction = active_reaction;
    set_is_destroying_effect(true);
    set_active_reaction(null);
    try {
      teardown.call(null);
    } finally {
      set_is_destroying_effect(previously_destroying_effect);
      set_active_reaction(previous_reaction);
    }
  }
}
function destroy_effect_children(signal, remove_dom = false) {
  var effect = signal.first;
  signal.first = signal.last = null;
  while (effect !== null) {
    const controller2 = effect.ac;
    if (controller2 !== null) {
      without_reactive_context(() => {
        controller2.abort(STALE_REACTION);
      });
    }
    var next = effect.next;
    if ((effect.f & ROOT_EFFECT) !== 0) {
      effect.parent = null;
    } else {
      destroy_effect(effect, remove_dom);
    }
    effect = next;
  }
}
function destroy_block_effect_children(signal) {
  var effect = signal.first;
  while (effect !== null) {
    var next = effect.next;
    if ((effect.f & BRANCH_EFFECT) === 0) {
      destroy_effect(effect);
    }
    effect = next;
  }
}
function destroy_effect(effect, remove_dom = true) {
  var removed = false;
  if (
    (remove_dom || (effect.f & HEAD_EFFECT) !== 0) &&
    effect.nodes_start !== null &&
    effect.nodes_end !== null
  ) {
    remove_effect_dom(
      effect.nodes_start,
      /** @type {TemplateNode} */
      effect.nodes_end,
    );
    removed = true;
  }
  destroy_effect_children(effect, remove_dom && !removed);
  remove_reactions(effect, 0);
  set_signal_status(effect, DESTROYED);
  var transitions = effect.transitions;
  if (transitions !== null) {
    for (const transition of transitions) {
      transition.stop();
    }
  }
  execute_effect_teardown(effect);
  var parent = effect.parent;
  if (parent !== null && parent.first !== null) {
    unlink_effect(effect);
  }
  effect.next =
    effect.prev =
    effect.teardown =
    effect.ctx =
    effect.deps =
    effect.fn =
    effect.nodes_start =
    effect.nodes_end =
    effect.ac =
      null;
}
function remove_effect_dom(node, end) {
  while (node !== null) {
    var next =
      node === end
        ? null
        : /** @type {TemplateNode} */
          /* @__PURE__ */ get_next_sibling(node);
    node.remove();
    node = next;
  }
}
function unlink_effect(effect) {
  var parent = effect.parent;
  var prev = effect.prev;
  var next = effect.next;
  if (prev !== null) prev.next = next;
  if (next !== null) next.prev = prev;
  if (parent !== null) {
    if (parent.first === effect) parent.first = next;
    if (parent.last === effect) parent.last = prev;
  }
}
function pause_effect(effect, callback) {
  var transitions = [];
  pause_children(effect, transitions, true);
  run_out_transitions(transitions, () => {
    destroy_effect(effect);
    if (callback) callback();
  });
}
function run_out_transitions(transitions, fn) {
  var remaining = transitions.length;
  if (remaining > 0) {
    var check = () => --remaining || fn();
    for (var transition of transitions) {
      transition.out(check);
    }
  } else {
    fn();
  }
}
function pause_children(effect, transitions, local) {
  if ((effect.f & INERT) !== 0) return;
  effect.f ^= INERT;
  if (effect.transitions !== null) {
    for (const transition of effect.transitions) {
      if (transition.is_global || local) {
        transitions.push(transition);
      }
    }
  }
  var child = effect.first;
  while (child !== null) {
    var sibling = child.next;
    var transparent =
      (child.f & EFFECT_TRANSPARENT) !== 0 || (child.f & BRANCH_EFFECT) !== 0;
    pause_children(child, transitions, transparent ? local : false);
    child = sibling;
  }
}
function set_is_updating_effect(value) {
  is_updating_effect = value;
}
function set_is_destroying_effect(value) {
  is_destroying_effect = value;
}
function set_active_reaction(reaction) {
  active_reaction = reaction;
}
function set_active_effect(effect) {
  active_effect = effect;
}
function push_reaction_value(value) {
  if (active_reaction !== null && true) {
    if (current_sources === null) {
      current_sources = [value];
    } else {
      current_sources.push(value);
    }
  }
}
function set_untracked_writes(value) {
  untracked_writes = value;
}
function set_update_version(value) {
  update_version = value;
}
function increment_write_version() {
  return ++write_version;
}
function is_dirty(reaction) {
  var flags = reaction.f;
  if ((flags & DIRTY) !== 0) {
    return true;
  }
  if ((flags & MAYBE_DIRTY) !== 0) {
    var dependencies = reaction.deps;
    var is_unowned = (flags & UNOWNED) !== 0;
    if (dependencies !== null) {
      var i;
      var dependency;
      var is_disconnected = (flags & DISCONNECTED) !== 0;
      var is_unowned_connected =
        is_unowned && active_effect !== null && !skip_reaction;
      var length = dependencies.length;
      if (
        (is_disconnected || is_unowned_connected) &&
        (active_effect === null || (active_effect.f & DESTROYED) === 0)
      ) {
        var derived =
          /** @type {Derived} */
          reaction;
        var parent = derived.parent;
        for (i = 0; i < length; i++) {
          dependency = dependencies[i];
          if (is_disconnected || !dependency?.reactions?.includes(derived)) {
            (dependency.reactions ??= []).push(derived);
          }
        }
        if (is_disconnected) {
          derived.f ^= DISCONNECTED;
        }
        if (
          is_unowned_connected &&
          parent !== null &&
          (parent.f & UNOWNED) === 0
        ) {
          derived.f ^= UNOWNED;
        }
      }
      for (i = 0; i < length; i++) {
        dependency = dependencies[i];
        if (
          is_dirty(
            /** @type {Derived} */
            dependency,
          )
        ) {
          update_derived(
            /** @type {Derived} */
            dependency,
          );
        }
        if (dependency.wv > reaction.wv) {
          return true;
        }
      }
    }
    if (!is_unowned || (active_effect !== null && !skip_reaction)) {
      set_signal_status(reaction, CLEAN);
    }
  }
  return false;
}
function schedule_possible_effect_self_invalidation(
  signal,
  effect,
  root2 = true,
) {
  var reactions = signal.reactions;
  if (reactions === null) return;
  if (current_sources?.includes(signal)) {
    return;
  }
  for (var i = 0; i < reactions.length; i++) {
    var reaction = reactions[i];
    if ((reaction.f & DERIVED) !== 0) {
      schedule_possible_effect_self_invalidation(
        /** @type {Derived} */
        reaction,
        effect,
        false,
      );
    } else if (effect === reaction) {
      if (root2) {
        set_signal_status(reaction, DIRTY);
      } else if ((reaction.f & CLEAN) !== 0) {
        set_signal_status(reaction, MAYBE_DIRTY);
      }
      schedule_effect(
        /** @type {Effect} */
        reaction,
      );
    }
  }
}
function update_reaction(reaction) {
  var previous_deps = new_deps;
  var previous_skipped_deps = skipped_deps;
  var previous_untracked_writes = untracked_writes;
  var previous_reaction = active_reaction;
  var previous_skip_reaction = skip_reaction;
  var previous_sources = current_sources;
  var previous_component_context = component_context;
  var previous_untracking = untracking;
  var previous_update_version = update_version;
  var flags = reaction.f;
  new_deps = /** @type {null | Value[]} */ null;
  skipped_deps = 0;
  untracked_writes = null;
  skip_reaction =
    (flags & UNOWNED) !== 0 &&
    (untracking || !is_updating_effect || active_reaction === null);
  active_reaction =
    (flags & (BRANCH_EFFECT | ROOT_EFFECT)) === 0 ? reaction : null;
  current_sources = null;
  set_component_context(reaction.ctx);
  untracking = false;
  update_version = ++read_version;
  if (reaction.ac !== null) {
    without_reactive_context(() => {
      reaction.ac.abort(STALE_REACTION);
    });
    reaction.ac = null;
  }
  try {
    reaction.f |= REACTION_IS_UPDATING;
    var fn =
      /** @type {Function} */
      reaction.fn;
    var result = fn();
    var deps = reaction.deps;
    if (new_deps !== null) {
      var i;
      remove_reactions(reaction, skipped_deps);
      if (deps !== null && skipped_deps > 0) {
        deps.length = skipped_deps + new_deps.length;
        for (i = 0; i < new_deps.length; i++) {
          deps[skipped_deps + i] = new_deps[i];
        }
      } else {
        reaction.deps = deps = new_deps;
      }
      if (
        !skip_reaction || // Deriveds that already have reactions can cleanup, so we still add them as reactions
        ((flags & DERIVED) !== 0 &&
          /** @type {import('#client').Derived} */
          reaction.reactions !== null)
      ) {
        for (i = skipped_deps; i < deps.length; i++) {
          (deps[i].reactions ??= []).push(reaction);
        }
      }
    } else if (deps !== null && skipped_deps < deps.length) {
      remove_reactions(reaction, skipped_deps);
      deps.length = skipped_deps;
    }
    if (
      is_runes() &&
      untracked_writes !== null &&
      !untracking &&
      deps !== null &&
      (reaction.f & (DERIVED | MAYBE_DIRTY | DIRTY)) === 0
    ) {
      for (i = 0; i < /** @type {Source[]} */ untracked_writes.length; i++) {
        schedule_possible_effect_self_invalidation(
          untracked_writes[i],
          /** @type {Effect} */
          reaction,
        );
      }
    }
    if (previous_reaction !== null && previous_reaction !== reaction) {
      read_version++;
      if (untracked_writes !== null) {
        if (previous_untracked_writes === null) {
          previous_untracked_writes = untracked_writes;
        } else {
          previous_untracked_writes.push(
            .../** @type {Source[]} */
            untracked_writes,
          );
        }
      }
    }
    if ((reaction.f & ERROR_VALUE) !== 0) {
      reaction.f ^= ERROR_VALUE;
    }
    return result;
  } catch (error2) {
    return handle_error(error2);
  } finally {
    reaction.f ^= REACTION_IS_UPDATING;
    new_deps = previous_deps;
    skipped_deps = previous_skipped_deps;
    untracked_writes = previous_untracked_writes;
    active_reaction = previous_reaction;
    skip_reaction = previous_skip_reaction;
    current_sources = previous_sources;
    set_component_context(previous_component_context);
    untracking = previous_untracking;
    update_version = previous_update_version;
  }
}
function remove_reaction(signal, dependency) {
  let reactions = dependency.reactions;
  if (reactions !== null) {
    var index15 = index_of.call(reactions, signal);
    if (index15 !== -1) {
      var new_length = reactions.length - 1;
      if (new_length === 0) {
        reactions = dependency.reactions = null;
      } else {
        reactions[index15] = reactions[new_length];
        reactions.pop();
      }
    }
  }
  if (
    reactions === null &&
    (dependency.f & DERIVED) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
    // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
    // allows us to skip the expensive work of disconnecting and immediately reconnecting it
    (new_deps === null || !new_deps.includes(dependency))
  ) {
    set_signal_status(dependency, MAYBE_DIRTY);
    if ((dependency.f & (UNOWNED | DISCONNECTED)) === 0) {
      dependency.f ^= DISCONNECTED;
    }
    destroy_derived_effects(
      /** @type {Derived} **/
      dependency,
    );
    remove_reactions(
      /** @type {Derived} **/
      dependency,
      0,
    );
  }
}
function remove_reactions(signal, start_index) {
  var dependencies = signal.deps;
  if (dependencies === null) return;
  for (var i = start_index; i < dependencies.length; i++) {
    remove_reaction(signal, dependencies[i]);
  }
}
function update_effect(effect) {
  var flags = effect.f;
  if ((flags & DESTROYED) !== 0) {
    return;
  }
  set_signal_status(effect, CLEAN);
  var previous_effect = active_effect;
  var was_updating_effect = is_updating_effect;
  active_effect = effect;
  is_updating_effect = true;
  try {
    if ((flags & BLOCK_EFFECT) !== 0) {
      destroy_block_effect_children(effect);
    } else {
      destroy_effect_children(effect);
    }
    execute_effect_teardown(effect);
    var teardown = update_reaction(effect);
    effect.teardown = typeof teardown === "function" ? teardown : null;
    effect.wv = write_version;
    var dep;
    if (
      BROWSER &&
      tracing_mode_flag &&
      (effect.f & DIRTY) !== 0 &&
      effect.deps !== null
    );
  } finally {
    is_updating_effect = was_updating_effect;
    active_effect = previous_effect;
  }
}
function get(signal) {
  var flags = signal.f;
  var is_derived = (flags & DERIVED) !== 0;
  if (active_reaction !== null && !untracking) {
    var destroyed =
      active_effect !== null && (active_effect.f & DESTROYED) !== 0;
    if (!destroyed && !current_sources?.includes(signal)) {
      var deps = active_reaction.deps;
      if ((active_reaction.f & REACTION_IS_UPDATING) !== 0) {
        if (signal.rv < read_version) {
          signal.rv = read_version;
          if (
            new_deps === null &&
            deps !== null &&
            deps[skipped_deps] === signal
          ) {
            skipped_deps++;
          } else if (new_deps === null) {
            new_deps = [signal];
          } else if (!skip_reaction || !new_deps.includes(signal)) {
            new_deps.push(signal);
          }
        }
      } else {
        (active_reaction.deps ??= []).push(signal);
        var reactions = signal.reactions;
        if (reactions === null) {
          signal.reactions = [active_reaction];
        } else if (!reactions.includes(active_reaction)) {
          reactions.push(active_reaction);
        }
      }
    }
  } else if (
    is_derived &&
    /** @type {Derived} */
    signal.deps === null &&
    /** @type {Derived} */
    signal.effects === null
  ) {
    var derived =
      /** @type {Derived} */
      signal;
    var parent = derived.parent;
    if (parent !== null && (parent.f & UNOWNED) === 0) {
      derived.f ^= UNOWNED;
    }
  }
  if (is_destroying_effect) {
    if (old_values.has(signal)) {
      return old_values.get(signal);
    }
    if (is_derived) {
      derived = /** @type {Derived} */ signal;
      var value = derived.v;
      if (
        ((derived.f & CLEAN) === 0 && derived.reactions !== null) ||
        depends_on_old_values(derived)
      ) {
        value = execute_derived(derived);
      }
      old_values.set(derived, value);
      return value;
    }
  } else if (is_derived) {
    derived = /** @type {Derived} */ signal;
    if (is_dirty(derived)) {
      update_derived(derived);
    }
  }
  if ((signal.f & ERROR_VALUE) !== 0) {
    throw signal.v;
  }
  return signal.v;
}
function depends_on_old_values(derived) {
  if (derived.v === UNINITIALIZED) return true;
  if (derived.deps === null) return false;
  for (const dep of derived.deps) {
    if (old_values.has(dep)) {
      return true;
    }
    if (
      (dep.f & DERIVED) !== 0 &&
      depends_on_old_values(
        /** @type {Derived} */
        dep,
      )
    ) {
      return true;
    }
  }
  return false;
}
function untrack(fn) {
  var previous_untracking = untracking;
  try {
    untracking = true;
    return fn();
  } finally {
    untracking = previous_untracking;
  }
}
function set_signal_status(signal, status) {
  signal.f = (signal.f & STATUS_MASK) | status;
}
function subscribe_to_store(store, run, invalidate) {
  if (store == null) {
    run(void 0);
    return noop;
  }
  const unsub = untrack(() =>
    store.subscribe(
      run,
      // @ts-expect-error
      invalidate,
    ),
  );
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function getContext(key2) {
  const context_map = get_or_init_context_map();
  const result =
    /** @type {T} */
    context_map.get(key2);
  return result;
}
function setContext(key2, context2) {
  get_or_init_context_map().set(key2, context2);
  return context2;
}
function get_or_init_context_map(name) {
  if (current_component === null) {
    lifecycle_outside_component();
  }
  return (current_component.c ??= new Map(
    get_parent_context(current_component) || void 0,
  ));
}
function push(fn) {
  current_component = { p: current_component, c: null, d: null };
}
function pop() {
  var component15 =
    /** @type {Component} */
    current_component;
  var ondestroy = component15.d;
  if (ondestroy) {
    on_destroy.push(...ondestroy);
  }
  current_component = component15.p;
}
function get_parent_context(component_context2) {
  let parent = component_context2.p;
  while (parent !== null) {
    const context_map = parent.c;
    if (context_map !== null) {
      return context_map;
    }
    parent = parent.p;
  }
  return null;
}
function props_id_generator(prefix) {
  let uid = 1;
  return () => `${prefix}s${uid++}`;
}
function abort() {
  controller?.abort(STALE_REACTION);
  controller = null;
}
function render(component15, options2 = {}) {
  try {
    const payload = new Payload(
      options2.idPrefix ? options2.idPrefix + "-" : "",
    );
    const prev_on_destroy = on_destroy;
    on_destroy = [];
    payload.out.push(BLOCK_OPEN);
    let reset_reset_element;
    if (BROWSER);
    if (options2.context) {
      push();
      current_component.c = options2.context;
    }
    component15(payload, options2.props ?? {}, {}, {});
    if (options2.context) {
      pop();
    }
    if (reset_reset_element) {
      reset_reset_element();
    }
    payload.out.push(BLOCK_CLOSE);
    for (const cleanup of on_destroy) cleanup();
    on_destroy = prev_on_destroy;
    let head = payload.head.out.join("") + payload.head.title;
    for (const { hash: hash2, code } of payload.css) {
      head += `<style id="${hash2}">${code}</style>`;
    }
    const body2 = payload.out.join("");
    return {
      head,
      html: body2,
      body: body2,
    };
  } finally {
    abort();
  }
}
function stringify2(value) {
  return typeof value === "string" ? value : value == null ? "" : value + "";
}
function attr_class(value, hash2, directives) {
  var result = to_class(value, hash2, directives);
  return result ? ` class="${escape_html(result, true)}"` : "";
}
function store_get(store_values, store_name, store) {
  if (store_name in store_values && store_values[store_name][0] === store) {
    return store_values[store_name][2];
  }
  store_values[store_name]?.[1]();
  store_values[store_name] = [store, null, void 0];
  const unsub = subscribe_to_store(
    store,
    /** @param {any} v */
    (v) => (store_values[store_name][2] = v),
  );
  store_values[store_name][1] = unsub;
  return store_values[store_name][2];
}
function unsubscribe_stores(store_values) {
  for (const store_name in store_values) {
    store_values[store_name][1]();
  }
}
function slot(payload, $$props, name, slot_props, fallback_fn) {
  var slot_fn = $$props.$$slots?.[name];
  if (slot_fn === true) {
    slot_fn = $$props["children"];
  }
  if (slot_fn !== void 0) {
    slot_fn(payload, slot_props);
  }
}
function bind_props(props_parent, props_now) {
  for (const key2 in props_now) {
    const initial_value = props_parent[key2];
    const value = props_now[key2];
    if (
      initial_value === void 0 &&
      value !== void 0 &&
      Object.getOwnPropertyDescriptor(props_parent, key2)?.set
    ) {
      props_parent[key2] = value;
    }
  }
}
function ensure_array_like(array_like_or_iterator) {
  if (array_like_or_iterator) {
    return array_like_or_iterator.length !== void 0
      ? array_like_or_iterator
      : Array.from(array_like_or_iterator);
  }
  return [];
}
var is_array,
  index_of,
  array_from,
  define_property,
  get_descriptor,
  object_prototype,
  array_prototype,
  get_prototype_of,
  is_extensible,
  noop,
  DERIVED,
  EFFECT,
  BLOCK_EFFECT,
  BRANCH_EFFECT,
  ROOT_EFFECT,
  BOUNDARY_EFFECT,
  UNOWNED,
  DISCONNECTED,
  CLEAN,
  DIRTY,
  MAYBE_DIRTY,
  INERT,
  DESTROYED,
  EFFECT_RAN,
  EFFECT_TRANSPARENT,
  INSPECT_EFFECT,
  HEAD_EFFECT,
  EFFECT_PRESERVED,
  USER_EFFECT,
  REACTION_IS_UPDATING,
  ASYNC,
  ERROR_VALUE,
  STATE_SYMBOL,
  LEGACY_PROPS,
  STALE_REACTION,
  COMMENT_NODE,
  HYDRATION_START,
  HYDRATION_END,
  HYDRATION_ERROR,
  UNINITIALIZED,
  tracing_mode_flag,
  component_context,
  adjustments,
  micro_tasks,
  idle_tasks,
  batches,
  current_batch,
  effect_pending_updates,
  queued_root_effects,
  last_scheduled_effect,
  is_flushing,
  is_flushing_sync,
  Batch,
  eager_block_effects,
  old_values,
  $window,
  first_child_getter,
  next_sibling_getter,
  is_updating_effect,
  is_destroying_effect,
  active_reaction,
  untracking,
  active_effect,
  current_sources,
  new_deps,
  skipped_deps,
  untracked_writes,
  write_version,
  read_version,
  update_version,
  skip_reaction,
  STATUS_MASK,
  current_component,
  BLOCK_OPEN,
  BLOCK_CLOSE,
  HeadPayload,
  Payload,
  controller,
  on_destroy;
var init_index2 = __esm({
  ".svelte-kit/output/server/chunks/index2.js"() {
    init_attributes();
    init_false();
    init_clsx();
    is_array = Array.isArray;
    index_of = Array.prototype.indexOf;
    array_from = Array.from;
    define_property = Object.defineProperty;
    get_descriptor = Object.getOwnPropertyDescriptor;
    object_prototype = Object.prototype;
    array_prototype = Array.prototype;
    get_prototype_of = Object.getPrototypeOf;
    is_extensible = Object.isExtensible;
    noop = () => {};
    DERIVED = 1 << 1;
    EFFECT = 1 << 2;
    BLOCK_EFFECT = 1 << 4;
    BRANCH_EFFECT = 1 << 5;
    ROOT_EFFECT = 1 << 6;
    BOUNDARY_EFFECT = 1 << 7;
    UNOWNED = 1 << 8;
    DISCONNECTED = 1 << 9;
    CLEAN = 1 << 10;
    DIRTY = 1 << 11;
    MAYBE_DIRTY = 1 << 12;
    INERT = 1 << 13;
    DESTROYED = 1 << 14;
    EFFECT_RAN = 1 << 15;
    EFFECT_TRANSPARENT = 1 << 16;
    INSPECT_EFFECT = 1 << 17;
    HEAD_EFFECT = 1 << 18;
    EFFECT_PRESERVED = 1 << 19;
    USER_EFFECT = 1 << 20;
    REACTION_IS_UPDATING = 1 << 21;
    ASYNC = 1 << 22;
    ERROR_VALUE = 1 << 23;
    STATE_SYMBOL = Symbol("$state");
    LEGACY_PROPS = Symbol("legacy props");
    STALE_REACTION = new (class StaleReactionError extends Error {
      name = "StaleReactionError";
      message =
        "The reaction that called `getAbortSignal()` was re-run or destroyed";
    })();
    COMMENT_NODE = 8;
    HYDRATION_START = "[";
    HYDRATION_END = "]";
    HYDRATION_ERROR = {};
    UNINITIALIZED = Symbol();
    tracing_mode_flag = false;
    component_context = null;
    adjustments = /* @__PURE__ */ new WeakMap();
    micro_tasks = [];
    idle_tasks = [];
    batches = /* @__PURE__ */ new Set();
    current_batch = null;
    effect_pending_updates = /* @__PURE__ */ new Set();
    queued_root_effects = [];
    last_scheduled_effect = null;
    is_flushing = false;
    is_flushing_sync = false;
    Batch = class _Batch {
      /**
       * The current values of any sources that are updated in this batch
       * They keys of this map are identical to `this.#previous`
       * @type {Map<Source, any>}
       */
      current = /* @__PURE__ */ new Map();
      /**
       * The values of any sources that are updated in this batch _before_ those updates took place.
       * They keys of this map are identical to `this.#current`
       * @type {Map<Source, any>}
       */
      #previous = /* @__PURE__ */ new Map();
      /**
       * When the batch is committed (and the DOM is updated), we need to remove old branches
       * and append new ones by calling the functions added inside (if/each/key/etc) blocks
       * @type {Set<() => void>}
       */
      #callbacks = /* @__PURE__ */ new Set();
      /**
       * The number of async effects that are currently in flight
       */
      #pending = 0;
      /**
       * A deferred that resolves when the batch is committed, used with `settled()`
       * TODO replace with Promise.withResolvers once supported widely enough
       * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
       */
      #deferred = null;
      /**
       * True if an async effect inside this batch resolved and
       * its parent branch was already deleted
       */
      #neutered = false;
      /**
       * Async effects (created inside `async_derived`) encountered during processing.
       * These run after the rest of the batch has updated, since they should
       * always have the latest values
       * @type {Effect[]}
       */
      #async_effects = [];
      /**
       * The same as `#async_effects`, but for effects inside a newly-created
       * `<svelte:boundary>` — these do not prevent the batch from committing
       * @type {Effect[]}
       */
      #boundary_async_effects = [];
      /**
       * Template effects and `$effect.pre` effects, which run when
       * a batch is committed
       * @type {Effect[]}
       */
      #render_effects = [];
      /**
       * The same as `#render_effects`, but for `$effect` (which runs after)
       * @type {Effect[]}
       */
      #effects = [];
      /**
       * Block effects, which may need to re-run on subsequent flushes
       * in order to update internal sources (e.g. each block items)
       * @type {Effect[]}
       */
      #block_effects = [];
      /**
       * Deferred effects (which run after async work has completed) that are DIRTY
       * @type {Effect[]}
       */
      #dirty_effects = [];
      /**
       * Deferred effects that are MAYBE_DIRTY
       * @type {Effect[]}
       */
      #maybe_dirty_effects = [];
      /**
       * A set of branches that still exist, but will be destroyed when this batch
       * is committed — we skip over these during `process`
       * @type {Set<Effect>}
       */
      skipped_effects = /* @__PURE__ */ new Set();
      /**
       *
       * @param {Effect[]} root_effects
       */
      process(root_effects) {
        queued_root_effects = [];
        for (const root2 of root_effects) {
          this.#traverse_effect_tree(root2);
        }
        if (this.#async_effects.length === 0 && this.#pending === 0) {
          this.#commit();
          var render_effects = this.#render_effects;
          var effects = this.#effects;
          this.#render_effects = [];
          this.#effects = [];
          this.#block_effects = [];
          current_batch = null;
          flush_queued_effects(render_effects);
          flush_queued_effects(effects);
          if (current_batch === null) {
            current_batch = this;
          } else {
            batches.delete(this);
          }
          this.#deferred?.resolve();
        } else {
          this.#defer_effects(this.#render_effects);
          this.#defer_effects(this.#effects);
          this.#defer_effects(this.#block_effects);
        }
        for (const effect of this.#async_effects) {
          update_effect(effect);
        }
        for (const effect of this.#boundary_async_effects) {
          update_effect(effect);
        }
        this.#async_effects = [];
        this.#boundary_async_effects = [];
      }
      /**
       * Traverse the effect tree, executing effects or stashing
       * them for later execution as appropriate
       * @param {Effect} root
       */
      #traverse_effect_tree(root2) {
        root2.f ^= CLEAN;
        var effect = root2.first;
        while (effect !== null) {
          var flags = effect.f;
          var is_branch = (flags & (BRANCH_EFFECT | ROOT_EFFECT)) !== 0;
          var is_skippable_branch = is_branch && (flags & CLEAN) !== 0;
          var skip =
            is_skippable_branch ||
            (flags & INERT) !== 0 ||
            this.skipped_effects.has(effect);
          if (!skip && effect.fn !== null) {
            if (is_branch) {
              effect.f ^= CLEAN;
            } else if ((flags & EFFECT) !== 0) {
              this.#effects.push(effect);
            } else if ((flags & CLEAN) === 0) {
              if ((flags & ASYNC) !== 0) {
                var effects = effect.b?.is_pending()
                  ? this.#boundary_async_effects
                  : this.#async_effects;
                effects.push(effect);
              } else if (is_dirty(effect)) {
                if ((effect.f & BLOCK_EFFECT) !== 0)
                  this.#block_effects.push(effect);
                update_effect(effect);
              }
            }
            var child = effect.first;
            if (child !== null) {
              effect = child;
              continue;
            }
          }
          var parent = effect.parent;
          effect = effect.next;
          while (effect === null && parent !== null) {
            effect = parent.next;
            parent = parent.parent;
          }
        }
      }
      /**
       * @param {Effect[]} effects
       */
      #defer_effects(effects) {
        for (const e3 of effects) {
          const target =
            (e3.f & DIRTY) !== 0
              ? this.#dirty_effects
              : this.#maybe_dirty_effects;
          target.push(e3);
          set_signal_status(e3, CLEAN);
        }
        effects.length = 0;
      }
      /**
       * Associate a change to a given source with the current
       * batch, noting its previous and current values
       * @param {Source} source
       * @param {any} value
       */
      capture(source2, value) {
        if (!this.#previous.has(source2)) {
          this.#previous.set(source2, value);
        }
        this.current.set(source2, source2.v);
      }
      activate() {
        current_batch = this;
      }
      deactivate() {
        current_batch = null;
        for (const update of effect_pending_updates) {
          effect_pending_updates.delete(update);
          update();
          if (current_batch !== null) {
            break;
          }
        }
      }
      neuter() {
        this.#neutered = true;
      }
      flush() {
        if (queued_root_effects.length > 0) {
          flush_effects();
        } else {
          this.#commit();
        }
        if (current_batch !== this) {
          return;
        }
        if (this.#pending === 0) {
          batches.delete(this);
        }
        this.deactivate();
      }
      /**
       * Append and remove branches to/from the DOM
       */
      #commit() {
        if (!this.#neutered) {
          for (const fn of this.#callbacks) {
            fn();
          }
        }
        this.#callbacks.clear();
      }
      increment() {
        this.#pending += 1;
      }
      decrement() {
        this.#pending -= 1;
        if (this.#pending === 0) {
          for (const e3 of this.#dirty_effects) {
            set_signal_status(e3, DIRTY);
            schedule_effect(e3);
          }
          for (const e3 of this.#maybe_dirty_effects) {
            set_signal_status(e3, MAYBE_DIRTY);
            schedule_effect(e3);
          }
          this.#render_effects = [];
          this.#effects = [];
          this.flush();
        } else {
          this.deactivate();
        }
      }
      /** @param {() => void} fn */
      add_callback(fn) {
        this.#callbacks.add(fn);
      }
      settled() {
        return (this.#deferred ??= deferred()).promise;
      }
      static ensure() {
        if (current_batch === null) {
          const batch = (current_batch = new _Batch());
          batches.add(current_batch);
          if (!is_flushing_sync) {
            _Batch.enqueue(() => {
              if (current_batch !== batch) {
                return;
              }
              batch.flush();
            });
          }
        }
        return current_batch;
      }
      /** @param {() => void} task */
      static enqueue(task) {
        queue_micro_task(task);
      }
    };
    eager_block_effects = null;
    old_values = /* @__PURE__ */ new Map();
    is_updating_effect = false;
    is_destroying_effect = false;
    active_reaction = null;
    untracking = false;
    active_effect = null;
    current_sources = null;
    new_deps = null;
    skipped_deps = 0;
    untracked_writes = null;
    write_version = 1;
    read_version = 0;
    update_version = read_version;
    skip_reaction = false;
    STATUS_MASK = -7169;
    current_component = null;
    BLOCK_OPEN = `<!--${HYDRATION_START}-->`;
    BLOCK_CLOSE = `<!--${HYDRATION_END}-->`;
    HeadPayload = class {
      /** @type {Set<{ hash: string; code: string }>} */
      css = /* @__PURE__ */ new Set();
      /** @type {string[]} */
      out = [];
      uid = () => "";
      title = "";
      constructor(
        css = /* @__PURE__ */ new Set(),
        out = [],
        title = "",
        uid = () => "",
      ) {
        this.css = css;
        this.out = out;
        this.title = title;
        this.uid = uid;
      }
    };
    Payload = class {
      /** @type {Set<{ hash: string; code: string }>} */
      css = /* @__PURE__ */ new Set();
      /** @type {string[]} */
      out = [];
      uid = () => "";
      select_value = void 0;
      head = new HeadPayload();
      constructor(id_prefix = "") {
        this.uid = props_id_generator(id_prefix);
        this.head.uid = this.uid;
      }
    };
    controller = null;
    on_destroy = [];
  },
});

// .svelte-kit/output/server/chunks/index.js
function readable(value, start) {
  return {
    subscribe: writable(value, start).subscribe,
  };
}
function writable(value, start = noop) {
  let stop = null;
  const subscribers = /* @__PURE__ */ new Set();
  function set2(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set2(
      fn(
        /** @type {T} */
        value,
      ),
    );
  }
  function subscribe(run, invalidate = noop) {
    const subscriber = [run, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set2, update) || noop;
    }
    run(
      /** @type {T} */
      value,
    );
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0 && stop) {
        stop();
        stop = null;
      }
    };
  }
  return { set: set2, update, subscribe };
}
var subscriber_queue;
var init_chunks = __esm({
  ".svelte-kit/output/server/chunks/index.js"() {
    init_index2();
    init_clsx();
    subscriber_queue = [];
  },
});

// .svelte-kit/output/server/chunks/hooks.server.js
var hooks_server_exports = {};
__export(hooks_server_exports, {
  handle: () => handle,
});
var handle;
var init_hooks_server = __esm({
  ".svelte-kit/output/server/chunks/hooks.server.js"() {
    handle = async ({ event, resolve: resolve2 }) => {
      const response = await resolve2(event);
      response.headers.set(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload",
      );
      response.headers.set("X-Frame-Options", "DENY");
      return response;
    };
  },
});

// ../../node_modules/cookie/index.js
var require_cookie = __commonJS({
  "../../node_modules/cookie/index.js"(exports) {
    "use strict";
    exports.parse = parse3;
    exports.serialize = serialize2;
    var __toString = Object.prototype.toString;
    var cookieNameRegExp = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
    var cookieValueRegExp =
      /^("?)[\u0021\u0023-\u002B\u002D-\u003A\u003C-\u005B\u005D-\u007E]*\1$/;
    var domainValueRegExp =
      /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
    function parse3(str, opt) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var len = str.length;
      if (len < 2) return obj;
      var dec = (opt && opt.decode) || decode;
      var index15 = 0;
      var eqIdx = 0;
      var endIdx = 0;
      do {
        eqIdx = str.indexOf("=", index15);
        if (eqIdx === -1) break;
        endIdx = str.indexOf(";", index15);
        if (endIdx === -1) {
          endIdx = len;
        } else if (eqIdx > endIdx) {
          index15 = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        var keyStartIdx = startIndex(str, index15, eqIdx);
        var keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
        var key2 = str.slice(keyStartIdx, keyEndIdx);
        if (!obj.hasOwnProperty(key2)) {
          var valStartIdx = startIndex(str, eqIdx + 1, endIdx);
          var valEndIdx = endIndex(str, endIdx, valStartIdx);
          if (
            str.charCodeAt(valStartIdx) === 34 &&
            str.charCodeAt(valEndIdx - 1) === 34
          ) {
            valStartIdx++;
            valEndIdx--;
          }
          var val = str.slice(valStartIdx, valEndIdx);
          obj[key2] = tryDecode(val, dec);
        }
        index15 = endIdx + 1;
      } while (index15 < len);
      return obj;
    }
    function startIndex(str, index15, max) {
      do {
        var code = str.charCodeAt(index15);
        if (code !== 32 && code !== 9) return index15;
      } while (++index15 < max);
      return max;
    }
    function endIndex(str, index15, min) {
      while (index15 > min) {
        var code = str.charCodeAt(--index15);
        if (code !== 32 && code !== 9) return index15 + 1;
      }
      return min;
    }
    function serialize2(name, val, opt) {
      var enc = (opt && opt.encode) || encodeURIComponent;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!cookieNameRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (!cookieValueRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (!opt) return str;
      if (null != opt.maxAge) {
        var maxAge = Math.floor(opt.maxAge);
        if (!isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + maxAge;
      }
      if (opt.domain) {
        if (!domainValueRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!pathValueRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        var expires = opt.expires;
        if (!isDate(expires) || isNaN(expires.valueOf())) {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.partitioned) {
        str += "; Partitioned";
      }
      if (opt.priority) {
        var priority =
          typeof opt.priority === "string"
            ? opt.priority.toLowerCase()
            : opt.priority;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError("option priority is invalid");
        }
      }
      if (opt.sameSite) {
        var sameSite =
          typeof opt.sameSite === "string"
            ? opt.sameSite.toLowerCase()
            : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function decode(str) {
      return str.indexOf("%") !== -1 ? decodeURIComponent(str) : str;
    }
    function isDate(val) {
      return __toString.call(val) === "[object Date]";
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e3) {
        return str;
      }
    }
  },
});

// ../../node_modules/set-cookie-parser/lib/set-cookie.js
var require_set_cookie = __commonJS({
  "../../node_modules/set-cookie-parser/lib/set-cookie.js"(exports, module) {
    "use strict";
    var defaultParseOptions = {
      decodeValues: true,
      map: false,
      silent: false,
    };
    function isNonEmptyString(str) {
      return typeof str === "string" && !!str.trim();
    }
    function parseString2(setCookieValue, options2) {
      var parts = setCookieValue.split(";").filter(isNonEmptyString);
      var nameValuePairStr = parts.shift();
      var parsed = parseNameValuePair(nameValuePairStr);
      var name = parsed.name;
      var value = parsed.value;
      options2 = options2
        ? Object.assign({}, defaultParseOptions, options2)
        : defaultParseOptions;
      try {
        value = options2.decodeValues ? decodeURIComponent(value) : value;
      } catch (e3) {
        console.error(
          "set-cookie-parser encountered an error while decoding a cookie with value '" +
            value +
            "'. Set options.decodeValues to false to disable this feature.",
          e3,
        );
      }
      var cookie = {
        name,
        value,
      };
      parts.forEach(function (part) {
        var sides = part.split("=");
        var key2 = sides.shift().trimLeft().toLowerCase();
        var value2 = sides.join("=");
        if (key2 === "expires") {
          cookie.expires = new Date(value2);
        } else if (key2 === "max-age") {
          cookie.maxAge = parseInt(value2, 10);
        } else if (key2 === "secure") {
          cookie.secure = true;
        } else if (key2 === "httponly") {
          cookie.httpOnly = true;
        } else if (key2 === "samesite") {
          cookie.sameSite = value2;
        } else if (key2 === "partitioned") {
          cookie.partitioned = true;
        } else {
          cookie[key2] = value2;
        }
      });
      return cookie;
    }
    function parseNameValuePair(nameValuePairStr) {
      var name = "";
      var value = "";
      var nameValueArr = nameValuePairStr.split("=");
      if (nameValueArr.length > 1) {
        name = nameValueArr.shift();
        value = nameValueArr.join("=");
      } else {
        value = nameValuePairStr;
      }
      return { name, value };
    }
    function parse3(input, options2) {
      options2 = options2
        ? Object.assign({}, defaultParseOptions, options2)
        : defaultParseOptions;
      if (!input) {
        if (!options2.map) {
          return [];
        } else {
          return {};
        }
      }
      if (input.headers) {
        if (typeof input.headers.getSetCookie === "function") {
          input = input.headers.getSetCookie();
        } else if (input.headers["set-cookie"]) {
          input = input.headers["set-cookie"];
        } else {
          var sch =
            input.headers[
              Object.keys(input.headers).find(function (key2) {
                return key2.toLowerCase() === "set-cookie";
              })
            ];
          if (!sch && input.headers.cookie && !options2.silent) {
            console.warn(
              "Warning: set-cookie-parser appears to have been called on a request object. It is designed to parse Set-Cookie headers from responses, not Cookie headers from requests. Set the option {silent: true} to suppress this warning.",
            );
          }
          input = sch;
        }
      }
      if (!Array.isArray(input)) {
        input = [input];
      }
      if (!options2.map) {
        return input.filter(isNonEmptyString).map(function (str) {
          return parseString2(str, options2);
        });
      } else {
        var cookies = {};
        return input.filter(isNonEmptyString).reduce(function (cookies2, str) {
          var cookie = parseString2(str, options2);
          cookies2[cookie.name] = cookie;
          return cookies2;
        }, cookies);
      }
    }
    function splitCookiesString2(cookiesString) {
      if (Array.isArray(cookiesString)) {
        return cookiesString;
      }
      if (typeof cookiesString !== "string") {
        return [];
      }
      var cookiesStrings = [];
      var pos = 0;
      var start;
      var ch;
      var lastComma;
      var nextStart;
      var cookiesSeparatorFound;
      function skipWhitespace() {
        while (
          pos < cookiesString.length &&
          /\s/.test(cookiesString.charAt(pos))
        ) {
          pos += 1;
        }
        return pos < cookiesString.length;
      }
      function notSpecialChar() {
        ch = cookiesString.charAt(pos);
        return ch !== "=" && ch !== ";" && ch !== ",";
      }
      while (pos < cookiesString.length) {
        start = pos;
        cookiesSeparatorFound = false;
        while (skipWhitespace()) {
          ch = cookiesString.charAt(pos);
          if (ch === ",") {
            lastComma = pos;
            pos += 1;
            skipWhitespace();
            nextStart = pos;
            while (pos < cookiesString.length && notSpecialChar()) {
              pos += 1;
            }
            if (
              pos < cookiesString.length &&
              cookiesString.charAt(pos) === "="
            ) {
              cookiesSeparatorFound = true;
              pos = nextStart;
              cookiesStrings.push(cookiesString.substring(start, lastComma));
              start = pos;
            } else {
              pos = lastComma + 1;
            }
          } else {
            pos += 1;
          }
        }
        if (!cookiesSeparatorFound || pos >= cookiesString.length) {
          cookiesStrings.push(
            cookiesString.substring(start, cookiesString.length),
          );
        }
      }
      return cookiesStrings;
    }
    module.exports = parse3;
    module.exports.parse = parse3;
    module.exports.parseString = parseString2;
    module.exports.splitCookiesString = splitCookiesString2;
  },
});

// .svelte-kit/output/server/chunks/state.svelte.js
var is_legacy;
var init_state_svelte = __esm({
  ".svelte-kit/output/server/chunks/state.svelte.js"() {
    init_clsx();
    init_index2();
    is_legacy =
      noop.toString().includes("$$") ||
      /function \w+\(\) \{\}/.test(noop.toString());
    if (is_legacy) {
      ({
        data: {},
        form: null,
        error: null,
        params: {},
        route: { id: null },
        state: {},
        status: -1,
        url: new URL("https://example.com"),
      });
    }
  },
});

// .svelte-kit/output/server/chunks/stores.js
var getStores, page;
var init_stores = __esm({
  ".svelte-kit/output/server/chunks/stores.js"() {
    init_index2();
    init_internal();
    init_exports();
    init_utils();
    init_clsx();
    init_state_svelte();
    getStores = () => {
      const stores$1 = getContext("__svelte__");
      return {
        /** @type {typeof page} */
        page: {
          subscribe: stores$1.page.subscribe,
        },
        /** @type {typeof navigating} */
        navigating: {
          subscribe: stores$1.navigating.subscribe,
        },
        /** @type {typeof updated} */
        updated: stores$1.updated,
      };
    };
    page = {
      subscribe(fn) {
        const store = getStores().page;
        return store.subscribe(fn);
      },
    };
  },
});

// .svelte-kit/output/server/entries/pages/_layout.svelte.js
var layout_svelte_exports = {};
__export(layout_svelte_exports, {
  default: () => _layout,
});
function onDestroy(fn) {
  var context2 =
    /** @type {Component} */
    current_component;
  (context2.d ??= []).push(fn);
}
function createStore() {
  const { subscribe, update, set: set2 } = writable([]);
  function push2(t2) {
    const toast2 = {
      id: crypto.randomUUID(),
      variant: "info",
      timeout: 4e3,
      dismissible: true,
      ...t2,
    };
    update((list) => [...list, toast2]);
    if (toast2.timeout && toast2.timeout > 0) {
      setTimeout(() => dismiss(toast2.id), toast2.timeout);
    }
    return toast2.id;
  }
  function dismiss(id) {
    update((list) => list.filter((t2) => t2.id !== id));
  }
  function clear() {
    set2([]);
  }
  return { subscribe, push: push2, dismiss, clear };
}
function ToastHost($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let list = [];
    const unsub = toasts.subscribe((v) => (list = v));
    onDestroy(unsub);
    $$renderer2.push(
      `<div class="toast-region svelte-53xc05" aria-live="polite" aria-atomic="false"><!--[-->`,
    );
    const each_array = ensure_array_like(list);
    for (
      let $$index = 0, $$length = each_array.length;
      $$index < $$length;
      $$index++
    ) {
      let t2 = each_array[$$index];
      $$renderer2.push(
        `<div${attr_class(`toast ${stringify2(t2.variant)}`, "svelte-53xc05")} role="status"><div class="msg svelte-53xc05">${escape_html(t2.message)}</div> `,
      );
      if (t2.dismissible !== false) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<button class="close svelte-53xc05" aria-label="Dismiss">\xD7</button>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function OfflineBanner($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let current;
    let mobileOpen = false;
    const isActive = (p) =>
      current === p || (p !== "/" && current.startsWith(p + "/"));
    current = store_get(($$store_subs ??= {}), "$page", page).url.pathname;
    $$renderer2.push(
      `<header class="shell svelte-12qhfyh"><nav class="nav-bar svelte-12qhfyh"><div class="left svelte-12qhfyh"><a href="/" class="logo svelte-12qhfyh"><span class="badge svelte-12qhfyh">AI</span> <span class="name svelte-12qhfyh">AtlasIT</span></a> <div class="desktop-links svelte-12qhfyh"><a href="/governance/compliance"${attr_class("nav-link svelte-12qhfyh", void 0, { active: isActive("/governance/compliance") })}>Dashboard</a> <a href="/onboarding"${attr_class("nav-link svelte-12qhfyh", void 0, { active: isActive("/onboarding") })}>Onboarding</a> <a href="/marketplace/slack"${attr_class("nav-link svelte-12qhfyh", void 0, { active: isActive("/marketplace") })}>Marketplace</a> <a href="/orchestrator"${attr_class("nav-link svelte-12qhfyh", void 0, { active: isActive("/orchestrator") })}>Orchestrator</a> <a href="/api-manager"${attr_class("nav-link svelte-12qhfyh", void 0, { active: isActive("/api-manager") })}>API Manager</a> <a href="/workflows"${attr_class("nav-link gradient svelte-12qhfyh", void 0, { active: isActive("/workflows") })}>JML Demo</a> <div class="dd svelte-12qhfyh" data-label="IT"><button class="nav-link dd-btn svelte-12qhfyh">IT <svg viewBox="0 0 24 24" class="svelte-12qhfyh"><path d="M19 9l-7 7-7-7"></path></svg></button> <div class="dd-menu svelte-12qhfyh"><a href="/it/policies/templates"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/it/policies/templates") })}>Policies</a> <a href="/it/backup"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/it/backup") })}>Backup &amp; Recovery</a></div></div> <div class="dd svelte-12qhfyh" data-label="Security"><button class="nav-link dd-btn svelte-12qhfyh">Security <svg viewBox="0 0 24 24" class="svelte-12qhfyh"><path d="M19 9l-7 7-7-7"></path></svg></button> <div class="dd-menu svelte-12qhfyh"><a href="/security/incidents"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/security/incidents") })}>Security Center</a> <a href="/security/activity"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/security/activity") })}>Scanner</a></div></div> <div class="dd svelte-12qhfyh" data-label="Governance"><button class="nav-link dd-btn svelte-12qhfyh">Governance <svg viewBox="0 0 24 24" class="svelte-12qhfyh"><path d="M19 9l-7 7-7-7"></path></svg></button> <div class="dd-menu svelte-12qhfyh"><a href="/governance/compliance"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/governance/compliance") })}>Compliance</a> <a href="/governance/evidence"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/governance/evidence") })}>Evidence</a></div></div></div></div> <div class="right svelte-12qhfyh"><div class="divider svelte-12qhfyh"></div> <a href="/login" class="btn blue svelte-12qhfyh">Login</a> <a href="/register" class="btn purple svelte-12qhfyh">Register</a> <button class="mobile-toggle svelte-12qhfyh" aria-label="Menu"><svg viewBox="0 0 24 24" class="svelte-12qhfyh"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg></button></div></nav> <div${attr_class("mobile-menu svelte-12qhfyh", void 0, { open: mobileOpen })}><a href="/governance/compliance"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/governance/compliance") })}>Dashboard</a> <a href="/onboarding"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/onboarding") })}>Onboarding</a> <a href="/marketplace/slack"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/marketplace") })}>Marketplace</a> <a href="/orchestrator"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/orchestrator") })}>Orchestrator</a> <a href="/api-manager"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/api-manager") })}>API Manager</a> <a href="/it/policies/templates"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/it/policies/templates") })}>IT Policies</a> <a href="/it/backup"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/it/backup") })}>Backup &amp; Recovery</a> <a href="/security/incidents"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/security/incidents") })}>Security Center</a> <a href="/security/activity"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/security/activity") })}>Scanner</a> <a href="/governance/compliance"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/governance/compliance") })}>Compliance</a> <a href="/governance/evidence"${attr_class("svelte-12qhfyh", void 0, { active: isActive("/governance/evidence") })}>Evidence</a> <div class="mobile-auth svelte-12qhfyh"><a href="/login" class="btn blue block svelte-12qhfyh">Login</a> <a href="/register" class="btn purple block svelte-12qhfyh">Register</a></div></div> <div class="demo-banner svelte-12qhfyh">DEMO MODE \xB7 SAMPLE DATA RESETS REGULARLY AND IS NOT PRODUCTION</div></header> <main class="main-container svelte-12qhfyh"><!--[-->`,
    );
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></main> `);
    ToastHost($$renderer2);
    $$renderer2.push(`<!----> `);
    OfflineBanner($$renderer2);
    $$renderer2.push(`<!---->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
var toasts;
var init_layout_svelte = __esm({
  ".svelte-kit/output/server/entries/pages/_layout.svelte.js"() {
    init_index2();
    init_stores();
    init_chunks();
    init_attributes();
    init_clsx();
    toasts = createStore();
  },
});

// .svelte-kit/output/server/nodes/0.js
var __exports = {};
__export(__exports, {
  component: () => component,
  fonts: () => fonts,
  imports: () => imports,
  index: () => index,
  stylesheets: () => stylesheets,
});
var index, component_cache, component, imports, stylesheets, fonts;
var init__ = __esm({
  ".svelte-kit/output/server/nodes/0.js"() {
    index = 0;
    component = async () =>
      (component_cache ??= (
        await Promise.resolve().then(
          () => (init_layout_svelte(), layout_svelte_exports),
        )
      ).default);
    imports = [
      "_app/immutable/nodes/0.CUWamxcP.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
      "_app/immutable/chunks/rRTekDYD.js",
      "_app/immutable/chunks/39A_Ntu8.js",
      "_app/immutable/chunks/Buy6Yj7A.js",
      "_app/immutable/chunks/CLYubSJh.js",
      "_app/immutable/chunks/BtMAuxYN.js",
      "_app/immutable/chunks/ApJzsbmA.js",
      "_app/immutable/chunks/Ck49g6Iw.js",
      "_app/immutable/chunks/FcwPhPSy.js",
      "_app/immutable/chunks/BHVF3NEQ.js",
      "_app/immutable/chunks/B36Hb1sH.js",
    ];
    stylesheets = ["_app/immutable/assets/0.CtEJ3U38.css"];
    fonts = [];
  },
});

// .svelte-kit/output/server/entries/fallbacks/error.svelte.js
var error_svelte_exports = {};
__export(error_svelte_exports, {
  default: () => Error$1,
});
function create_updated_store() {
  const { set: set2, subscribe } = writable(false);
  {
    return {
      subscribe,
      // eslint-disable-next-line @typescript-eslint/require-await
      check: async () => false,
    };
  }
}
function context() {
  return getContext("__request__");
}
function Error$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(
      `<h1>${escape_html(page2.status)}</h1> <p>${escape_html(page2.error?.message)}</p>`,
    );
  });
}
var stores, page$1, page2;
var init_error_svelte = __esm({
  ".svelte-kit/output/server/entries/fallbacks/error.svelte.js"() {
    init_attributes();
    init_clsx();
    init_state_svelte();
    init_internal();
    init_exports();
    init_utils();
    init_chunks();
    init_index2();
    stores = {
      updated: /* @__PURE__ */ create_updated_store(),
    };
    ({
      check: stores.updated.check,
    });
    page$1 = {
      get error() {
        return context().page.error;
      },
      get status() {
        return context().page.status;
      },
    };
    page2 = page$1;
  },
});

// .svelte-kit/output/server/nodes/1.js
var __exports2 = {};
__export(__exports2, {
  component: () => component2,
  fonts: () => fonts2,
  imports: () => imports2,
  index: () => index2,
  stylesheets: () => stylesheets2,
});
var index2, component_cache2, component2, imports2, stylesheets2, fonts2;
var init__2 = __esm({
  ".svelte-kit/output/server/nodes/1.js"() {
    index2 = 1;
    component2 = async () =>
      (component_cache2 ??= (
        await Promise.resolve().then(
          () => (init_error_svelte(), error_svelte_exports),
        )
      ).default);
    imports2 = [
      "_app/immutable/nodes/1.CO-QE4jM.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
      "_app/immutable/chunks/39A_Ntu8.js",
      "_app/immutable/chunks/CLYubSJh.js",
      "_app/immutable/chunks/FcwPhPSy.js",
      "_app/immutable/chunks/rRTekDYD.js",
      "_app/immutable/chunks/ApJzsbmA.js",
    ];
    stylesheets2 = [];
    fonts2 = [];
  },
});

// .svelte-kit/output/server/entries/pages/_page.svelte.js
var page_svelte_exports = {};
__export(page_svelte_exports, {
  default: () => _page,
});
function _page($$renderer) {
  $$renderer.push(
    `<h1>AtlasIT</h1> <p>Edge-native SvelteKit on Cloudflare Workers.</p>`,
  );
}
var init_page_svelte = __esm({
  ".svelte-kit/output/server/entries/pages/_page.svelte.js"() {
    init_clsx();
  },
});

// .svelte-kit/output/server/nodes/2.js
var __exports3 = {};
__export(__exports3, {
  component: () => component3,
  fonts: () => fonts3,
  imports: () => imports3,
  index: () => index3,
  stylesheets: () => stylesheets3,
});
var index3, component_cache3, component3, imports3, stylesheets3, fonts3;
var init__3 = __esm({
  ".svelte-kit/output/server/nodes/2.js"() {
    index3 = 2;
    component3 = async () =>
      (component_cache3 ??= (
        await Promise.resolve().then(
          () => (init_page_svelte(), page_svelte_exports),
        )
      ).default);
    imports3 = [
      "_app/immutable/nodes/2.BJZuPPWB.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
    ];
    stylesheets3 = [];
    fonts3 = [];
  },
});

// .svelte-kit/output/server/chunks/client.js
function ensureTrailingSlash(input) {
  return input.endsWith("/") ? input : `${input}/`;
}
function resolveOrigin() {
  if (base2) return ensureTrailingSlash(base2);
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.location?.origin === "string"
  ) {
    return ensureTrailingSlash(globalThis.location.origin);
  }
  return "http://localhost/";
}
function buildUrl(path, query) {
  const trimmed = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(trimmed, resolveOrigin());
  if (query) {
    for (const [key2, value] of Object.entries(query)) {
      if (value === void 0 || value === null || value === "") continue;
      url.searchParams.set(key2, String(value));
    }
  }
  return url.toString();
}
function safeParseJson(text2) {
  if (!text2) return null;
  try {
    return JSON.parse(text2);
  } catch {
    return null;
  }
}
function isNormalizedError(value) {
  return (
    !!value &&
    typeof value === "object" &&
    "code" in value &&
    "message" in value
  );
}
function normalizeError(input) {
  if (isNormalizedError(input)) {
    return {
      code: String(input.code),
      message: input.message,
      requestId: input.requestId,
      status: input.status,
      body: input.body,
      original: input.original ?? input,
    };
  }
  if (input && typeof input === "object") {
    const ctx = input;
    const body2 = ctx.body ?? ctx.responseBody ?? {};
    const status = typeof ctx.status === "number" ? ctx.status : void 0;
    const statusText =
      typeof ctx.statusText === "string" ? ctx.statusText : void 0;
    const requestId =
      ctx.requestId ?? ctx.headers?.get?.("x-request-id") ?? body2?.requestId;
    const codeValue =
      ctx.code ??
      body2?.code ??
      (status !== void 0 ? `HTTP_${status}` : void 0);
    const messageValue =
      ctx.message ??
      body2?.error ??
      body2?.message ??
      statusText ??
      "Request failed";
    return {
      code:
        typeof codeValue === "number"
          ? `HTTP_${codeValue}`
          : String(codeValue ?? "UNKNOWN"),
      message: String(messageValue || "Request failed"),
      requestId: requestId ? String(requestId) : void 0,
      status,
      body: body2,
      original: ctx,
    };
  }
  if (input instanceof Error) {
    return { code: "NETWORK_ERROR", message: input.message, original: input };
  }
  return { code: "UNKNOWN", message: "Unexpected error", original: input };
}
async function apiFetch(path, opts = {}) {
  const {
    method = "GET",
    body: body2,
    headers: headers2 = {},
    signal,
    fetcher,
    query,
  } = opts;
  const fetchFn = fetcher ?? fetch;
  const finalHeaders = { Accept: "application/json", ...headers2 };
  const init2 = { method, headers: finalHeaders, signal };
  if (body2 !== void 0) {
    finalHeaders["Content-Type"] = "application/json";
    init2.body = JSON.stringify(body2);
  }
  let response;
  try {
    response = await fetchFn(buildUrl(path, query), init2);
  } catch (err) {
    throw normalizeError(err);
  }
  const text2 = await response.text();
  const parsed = safeParseJson(text2);
  if (!response.ok) {
    throw normalizeError({
      status: response.status,
      statusText: response.statusText,
      body: parsed,
      requestId: response.headers.get("x-request-id"),
    });
  }
  if (parsed === null) {
    return text2 ? text2 : void 0;
  }
  return parsed;
}
function coerceString(value, fallback = "") {
  if (value === void 0 || value === null) return fallback;
  return String(value);
}
function coerceNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
function normalizeCoverage(framework, raw) {
  if (!raw) {
    return { framework, controls: [], totalControls: 0, coveragePercent: 0 };
  }
  const controlsSource = Array.isArray(raw.controls)
    ? raw.controls
    : Array.isArray(raw.items)
      ? raw.items
      : [];
  const controls = controlsSource
    .map((item) => ({
      controlKey: coerceString(item?.controlKey ?? item?.key ?? item?.id ?? ""),
      evidenceCount: coerceNumber(
        item?.evidenceCount ?? item?.evidence ?? item?.count,
      ),
    }))
    .filter((entry) => entry.controlKey.length > 0);
  const totalControls = coerceNumber(
    raw.totalControls ?? raw.total ?? controls.length,
    controls.length,
  );
  const explicitCoverage =
    typeof raw.coveragePercent === "number" ? raw.coveragePercent : void 0;
  const passing =
    typeof raw.passing === "number"
      ? raw.passing
      : controls.reduce(
          (acc, control) => acc + (control.evidenceCount > 0 ? 1 : 0),
          0,
        );
  const coveragePercent =
    explicitCoverage ?? (totalControls ? (passing / totalControls) * 100 : 0);
  return {
    framework: coerceString(raw.framework ?? framework, framework),
    controls,
    totalControls,
    coveragePercent: Number.isFinite(coveragePercent)
      ? Math.round(coveragePercent * 10) / 10
      : 0,
  };
}
function pickTimestamp(value) {
  const candidate =
    value?.createdAt ??
    value?.created ??
    value?.timestamp ??
    value?.ts ??
    value?.date;
  if (typeof candidate === "string") return candidate;
  if (typeof candidate === "number") return new Date(candidate).toISOString();
  return /* @__PURE__ */ new Date().toISOString();
}
function mapIncident(raw) {
  const id = coerceString(
    raw?.id ?? raw?.incidentId ?? raw?.ref ?? raw?.reference ?? Date.now(),
  );
  return {
    id,
    title: raw?.title ?? raw?.name ?? null,
    severity: raw?.severity ?? raw?.level ?? null,
    status: raw?.status ?? null,
    source: raw?.source ?? raw?.origin ?? null,
    tenantId: raw?.tenantId ?? raw?.tenant ?? null,
    createdAt: pickTimestamp(raw),
    resolvedAt: raw?.resolvedAt ?? raw?.resolved ?? null,
  };
}
function mapNotification(raw) {
  const id = coerceString(
    raw?.id ?? raw?.notificationId ?? raw?.ref ?? Date.now(),
  );
  const message = coerceString(raw?.message ?? raw?.title ?? "Notification");
  const createdAt = pickTimestamp(raw);
  const readAt = raw?.read_at ?? raw?.readAt ?? null;
  const readFlag =
    raw?.read === true ||
    raw?.read === 1 ||
    (typeof readAt === "string" && readAt.length > 0);
  return {
    id,
    kind: raw?.kind ?? raw?.type ?? null,
    severity: raw?.severity ?? raw?.level ?? null,
    message,
    createdAt,
    ageSeconds: typeof raw?.ageSeconds === "number" ? raw.ageSeconds : null,
    ref: raw?.ref ?? raw?.resourceId ?? null,
    read: Boolean(readFlag),
  };
}
function mapActivity(raw) {
  const id =
    typeof raw?.id === "number"
      ? raw.id
      : coerceNumber(raw?.id ?? raw?.eventId ?? Date.now());
  return {
    id,
    tenantId: coerceString(raw?.tenantId ?? raw?.tenant ?? ""),
    type: coerceString(raw?.type ?? raw?.category ?? "unknown"),
    severity: raw?.severity ?? raw?.level ?? null,
    ref: raw?.ref ?? raw?.resourceId ?? null,
    message: coerceString(raw?.message ?? raw?.description ?? ""),
    createdAt: pickTimestamp(raw),
  };
}
async function getHealth(fetcher) {
  return apiFetch("/health", { fetcher });
}
async function getCoverage(framework, fetcher) {
  const target = framework;
  try {
    const raw = await apiFetch(
      `/api/v1/policies/coverage/${encodeURIComponent(target)}`,
      { fetcher },
    );
    return normalizeCoverage(target, raw);
  } catch (err) {
    const normalized = normalizeError(err);
    if (normalized.code === "HTTP_404" || normalized.code === "HTTP_405") {
      const fallback = await apiFetch("/api/v1/policies/coverage", {
        fetcher,
        query: { framework: target },
      });
      return normalizeCoverage(target, fallback);
    }
    throw normalized;
  }
}
async function listOpenIncidents(limit, fetcher) {
  const capped = limit;
  const response = await apiFetch("/api/v1/security/incidents", {
    fetcher,
    query: { status: "open", limit: capped },
  });
  const items = Array.isArray(response.items) ? response.items : [];
  return items.map(mapIncident);
}
async function listActivity(limit, fetcher) {
  const capped = limit;
  const response = await apiFetch("/api/v1/activity", {
    fetcher,
    query: { limit: capped },
  });
  const items = Array.isArray(response.items) ? response.items : [];
  return items.map(mapActivity);
}
async function listNotifications(limit = 8, fetcher) {
  const response = await apiFetch("/api/v1/notifications", {
    fetcher,
    query: { limit },
  });
  const rawItems = Array.isArray(response.items) ? response.items : [];
  const items = rawItems.map(mapNotification);
  const unreadCount =
    typeof response.unreadCount === "number"
      ? response.unreadCount
      : items.filter((item) => !item.read).length;
  return { items, unreadCount, nextCursor: response.nextCursor ?? null };
}
var __vite_import_meta_env__, base2, ComplianceAPI;
var init_client = __esm({
  ".svelte-kit/output/server/chunks/client.js"() {
    __vite_import_meta_env__ = {};
    base2 =
      __vite_import_meta_env__?.PUBLIC_COMPLIANCE_API_BASE ||
      globalThis.PUBLIC_COMPLIANCE_API_BASE ||
      "";
    ComplianceAPI = {
      health: (fetcher) => apiFetch("/health", { fetcher }),
      snapshot: (tenantId, fetcher) =>
        apiFetch("/api/compliance/snapshot", { fetcher, query: { tenantId } }),
      listPolicyTemplates: (fetcher) =>
        apiFetch("/api/v1/policies/templates", { fetcher }),
      generatePolicy: (input, fetcher) =>
        apiFetch("/api/v1/policies/generate", {
          method: "POST",
          body: input,
          fetcher,
        }),
      evaluatePolicy: (input, fetcher) =>
        apiFetch("/api/v1/policy/evaluate", {
          method: "POST",
          body: input,
          fetcher,
        }),
      coverage: (framework, fetcher) =>
        framework
          ? apiFetch(
              `/api/v1/policies/coverage/${encodeURIComponent(framework)}`,
              { fetcher },
            )
          : apiFetch("/api/v1/policies/coverage", { fetcher }),
      listIncidents: (args = {}, fetcher) =>
        apiFetch("/api/v1/security/incidents", { fetcher, query: args }),
      createIncident: (input, fetcher) =>
        apiFetch("/api/v1/security/incidents", {
          method: "POST",
          body: input,
          fetcher,
        }),
      resolveIncident: (id, tenantId, fetcher) =>
        apiFetch(`/api/v1/security/incidents/${id}/resolve`, {
          method: "POST",
          fetcher,
          query: { tenantId },
        }),
      listActivity: (args = {}, fetcher) =>
        apiFetch("/api/v1/activity", { fetcher, query: args }),
      listNotifications: (args = {}, fetcher) =>
        apiFetch("/api/v1/notifications", { fetcher, query: args }),
      searchEvidence: (args = {}, fetcher) =>
        apiFetch("/api/evidence/search", { fetcher, query: args }),
      verifyEvidence: (hash2, fetcher) =>
        apiFetch(`/api/evidence/${encodeURIComponent(hash2)}`, {
          fetcher,
          query: { verify: 1 },
        }),
    };
  },
});

// .svelte-kit/output/server/entries/pages/governance/compliance/_page.ts.js
var page_ts_exports = {};
__export(page_ts_exports, {
  load: () => load,
});
function isNormalizedError2(error2) {
  return (
    !!error2 &&
    typeof error2 === "object" &&
    "code" in error2 &&
    "message" in error2
  );
}
function formatError(key2, error2) {
  const label = LABELS[key2];
  if (isNormalizedError2(error2)) {
    const badge = [];
    if (error2.code) badge.push(error2.code);
    if (error2.requestId) badge.push(`req:${error2.requestId}`);
    const suffix = badge.length ? ` [${badge.join(" ")}]` : "";
    return `${label}: ${error2.message}${suffix}`;
  }
  if (error2 instanceof Error) {
    return `${label}: ${error2.message}`;
  }
  return `${label}: Failed to load`;
}
var COVERAGE_FRAMEWORK,
  INCIDENT_LIMIT,
  ACTIVITY_LIMIT,
  NOTIFICATION_LIMIT,
  LABELS,
  load;
var init_page_ts = __esm({
  ".svelte-kit/output/server/entries/pages/governance/compliance/_page.ts.js"() {
    init_client();
    COVERAGE_FRAMEWORK = "SOC2";
    INCIDENT_LIMIT = 5;
    ACTIVITY_LIMIT = 8;
    NOTIFICATION_LIMIT = 8;
    LABELS = {
      health: "Health",
      coverage: "Coverage",
      incidents: "Incidents",
      activity: "Activity",
      notifications: "Notifications",
    };
    load = async ({ fetch: fetch2 }) => {
      const fetchedAt = /* @__PURE__ */ new Date().toISOString();
      const tasks = {
        health: getHealth(fetch2),
        coverage: getCoverage(COVERAGE_FRAMEWORK, fetch2),
        incidents: listOpenIncidents(INCIDENT_LIMIT, fetch2),
        activity: listActivity(ACTIVITY_LIMIT, fetch2),
        notifications: listNotifications(NOTIFICATION_LIMIT, fetch2),
      };
      const responses = {};
      const errors = [];
      await Promise.all(
        Object.keys(tasks).map(async (key2) => {
          try {
            responses[key2] = await tasks[key2];
          } catch (error2) {
            errors.push(formatError(key2, error2));
          }
        }),
      );
      const successCount = Object.keys(responses).length;
      const notificationsResp = responses.notifications;
      const data = {
        fetchedAt,
        health: responses.health ?? null,
        coverage: responses.coverage ?? null,
        incidents: responses.incidents ?? [],
        activity: responses.activity ?? [],
        notifications: notificationsResp?.items ?? [],
        notificationsUnreadCount: notificationsResp?.unreadCount,
        allFailed: successCount === 0,
      };
      if (errors.length) {
        data.partialError = errors.join("; ");
      }
      return data;
    };
  },
});

// .svelte-kit/output/server/entries/pages/governance/compliance/_page.svelte.js
var page_svelte_exports2 = {};
__export(page_svelte_exports2, {
  default: () => _page2,
});
function relativeTime(iso) {
  const now = Date.now();
  const ts = normalizeInputTs(iso, now);
  const diffSeconds = Math.floor((ts - now) / 1e3);
  const abs = Math.abs(diffSeconds);
  if (!rtf) return fallbackRelative(abs, ts);
  const match = findInterval(abs, diffSeconds);
  if (match) return match;
  const years = Math.round(diffSeconds / 31557600);
  return rtf.format(years, "year");
}
function normalizeInputTs(input, now) {
  if (typeof input === "number") return input;
  if (typeof input === "string") {
    const parsed = Date.parse(input);
    return Number.isFinite(parsed) ? parsed : now;
  }
  if (input instanceof Date) return input.getTime();
  return now;
}
function fallbackRelative(abs, ts) {
  if (abs < 60) return "just now";
  if (abs < 3600) return `${Math.round(abs / 60)}m ago`;
  if (abs < 86400) return `${Math.round(abs / 3600)}h ago`;
  if (abs < 604800) return `${Math.round(abs / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}
function findInterval(abs, diffSeconds) {
  for (const [threshold, divisor] of intervals) {
    if (abs < threshold) {
      const value = Math.round(diffSeconds / divisor);
      return rtf.format(value, unitForDivisor(divisor));
    }
  }
  return null;
}
function unitForDivisor(divisor) {
  switch (divisor) {
    case 1:
      return "second";
    case 60:
      return "minute";
    case 3600:
      return "hour";
    case 86400:
      return "day";
    case 604800:
      return "week";
    case 2629800:
      return "month";
    default:
      return "day";
  }
}
function robustRelativeTime(input, now = /* @__PURE__ */ new Date()) {
  const date = new Date(input);
  if (isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const direction = diffMs > 0 ? "in" : "ago";
  const sec = Math.round(absMs / 1e3);
  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  function formatTimeSegment(value, unit) {
    return value + unit;
  }
  if (sec < 5) return direction === "in" ? "soon" : "just now";
  if (sec < minute) return `${formatTimeSegment(sec, "s")} ${direction}`;
  const m = Math.round(sec / minute);
  if (m < 60) return `${formatTimeSegment(m, "m")} ${direction}`;
  const h = Math.round(sec / hour);
  if (h < 24) return `${formatTimeSegment(h, "h")} ${direction}`;
  const d = Math.round(sec / day);
  if (d < 7) return `${formatTimeSegment(d, "d")} ${direction}`;
  const w = Math.round(sec / week);
  if (w < 5) return `${formatTimeSegment(w, "w")} ${direction}`;
  const mo = Math.round(sec / month);
  if (mo < 12) return `${formatTimeSegment(mo, "mo")} ${direction}`;
  const y = Math.round(sec / year);
  return `${formatTimeSegment(y, "y")} ${direction}`;
}
function mapEventTypeToIcon(type) {
  if (!type) return "\u2022";
  if (type.startsWith("policy.")) return "\u2696\uFE0F";
  if (type.startsWith("evidence.")) return "\u{1F9FE}";
  if (type.startsWith("incident.")) return "\u{1F6A8}";
  if (type.startsWith("workflow.")) return "\u{1F501}";
  if (type.startsWith("access.")) return "\u{1F510}";
  return "\u2022";
}
function _page2($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let highPriorityNotifications, latencyChips;
    let data = $$props["data"];
    let state2 = data;
    let lastServerFetchedAt = data.fetchedAt;
    let lastClientFetchedAt = data.fetchedAt;
    let refreshing = false;
    let coverageControls = [];
    let filteredControls = [];
    let controlsWithShare = [];
    let totalEvidence = 0;
    let filterValue = "";
    const numberFormatter = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
    });
    const integerFormatter = new Intl.NumberFormat("en-US");
    const LATENCY_KEYS = [
      { key: "workflowExecute", label: "Workflow Execute" },
      { key: "policyGenerate", label: "Policy Generate" },
      { key: "policyEvaluate", label: "Policy Evaluate" },
    ];
    function formatLatency(bucket) {
      if (!bucket || typeof bucket !== "object") return null;
      const p50 =
        typeof bucket.p50 === "number"
          ? bucket.p50
          : typeof bucket.avg === "number"
            ? bucket.avg
            : null;
      const p95 =
        typeof bucket.p95 === "number"
          ? bucket.p95
          : typeof bucket.p90 === "number"
            ? bucket.p90
            : null;
      if (p50 === null && p95 === null) return null;
      const round = (value) => `${Math.round(value)}ms`;
      if (p50 !== null && p95 !== null) {
        return `${round(p50)} p50 / ${round(p95)} p95`;
      }
      return round(p50 ?? p95 ?? 0);
    }
    function formatPercent(value) {
      if (value === null || value === void 0 || Number.isNaN(value))
        return "\u2014";
      return `${numberFormatter.format(value)}%`;
    }
    function formatCount(value) {
      if (value === null || value === void 0 || Number.isNaN(value))
        return "\u2014";
      return integerFormatter.format(value);
    }
    function relativeTime$1(value) {
      if (!value) return "\u2014";
      const coarse = relativeTime(value);
      return /\d{4}-\d{2}-\d{2}/.test(coarse)
        ? coarse
        : robustRelativeTime(value);
    }
    function formatTimestamp(value) {
      if (!value) return "\u2014";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleString();
    }
    function severityClass(severity) {
      if (!severity) return "severity-neutral";
      const normalized = severity.toLowerCase();
      if (normalized === "critical") return "severity-critical";
      if (normalized === "high") return "severity-high";
      if (normalized === "medium") return "severity-medium";
      if (normalized === "low") return "severity-low";
      return "severity-neutral";
    }
    function activityIcon(event) {
      return mapEventTypeToIcon(event.type);
    }
    const COVERAGE_PLACEHOLDER_ROWS = 5;
    if (
      data.fetchedAt !== lastServerFetchedAt &&
      data.fetchedAt !== lastClientFetchedAt
    ) {
      lastServerFetchedAt = data.fetchedAt;
      state2 = data;
    }
    coverageControls = state2.coverage?.controls ?? [];
    totalEvidence = coverageControls.reduce(
      (total, control) => total + control.evidenceCount,
      0,
    );
    filteredControls = coverageControls;
    controlsWithShare = filteredControls.map((control) => ({
      ...control,
      percent:
        totalEvidence > 0 ? (control.evidenceCount / totalEvidence) * 100 : 0,
    }));
    highPriorityNotifications = (state2.notifications ?? []).filter((item) => {
      const severity = item.severity?.toLowerCase();
      return severity === "critical" || severity === "high";
    }).length;
    latencyChips = LATENCY_KEYS.map(({ key: key2, label }) => {
      const latencyMap = state2.health?.latency ?? void 0;
      const bucket = latencyMap ? latencyMap[key2] : void 0;
      const display = formatLatency(bucket);
      return display ? { label, display } : null;
    }).filter(Boolean);
    $$renderer2.push(
      `<div class="page svelte-qd118l"><header class="page-header svelte-qd118l"><div class="svelte-qd118l"><h1 class="svelte-qd118l">Compliance Dashboard</h1> <p class="timestamp svelte-qd118l">Data captured ${escape_html(
        // Use shared utilities; robustRelativeTime handles future-safe phrasing, fallback to short for long spans.
        // If coarse returns a calendar date (heuristic: contains '-') we keep it; else prefer robust variant for richer semantics.
        // TODO: Add policy/action modals
        // TODO: Integrate evidence drawer
        // TODO: Notifications panel & access requests UI
        // TODO: Add Playwright & Vitest tests
        // TODO: A11y & keyboard navigation enhancements
        formatTimestamp(state2.fetchedAt),
      )}</p></div> `,
    );
    if (
      state2.notificationsUnreadCount &&
      state2.notificationsUnreadCount > 0
    ) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<span class="notifications-badge svelte-qd118l">Unread: ${escape_html(state2.notificationsUnreadCount)}</span>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
      if (highPriorityNotifications > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<span class="notifications-badge svelte-qd118l">High priority: ${escape_html(highPriorityNotifications)}</span>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></header> `);
    if (state2.partialError) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<div class="alert warning svelte-qd118l"><div class="svelte-qd118l"><strong class="svelte-qd118l">Some services did not respond.</strong> <span class="svelte-qd118l">${escape_html(state2.partialError)}</span></div></div>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (!state2.health) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<div class="alert danger svelte-qd118l"><div class="svelte-qd118l"><strong class="svelte-qd118l">Health data unavailable</strong> <p class="svelte-qd118l">We could not reach the compliance health endpoint. Retry to request a fresh snapshot.</p> `,
      );
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(
        `<!--]--></div> <button type="button" class="retry-btn svelte-qd118l"${attr("disabled", refreshing, true)}>${escape_html("Retry")}</button></div>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(
      `<!--]--> <section class="metrics-grid svelte-qd118l"><div class="metric-card svelte-qd118l"><span class="metric-label svelte-qd118l">Coverage</span> `,
    );
    if (state2.coverage) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<span class="metric-value svelte-qd118l">${escape_html(formatPercent(state2.coverage.coveragePercent))}</span>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(
        `<div class="skeleton skeleton-lg svelte-qd118l"></div>`,
      );
    }
    $$renderer2.push(
      `<!--]--></div> <div class="metric-card svelte-qd118l"><span class="metric-label svelte-qd118l">Open incidents</span> `,
    );
    if (state2.incidents && state2.incidents.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<span class="metric-value svelte-qd118l">${escape_html(formatCount(state2.incidents.length))}</span>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
      if (state2.allFailed) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<span class="metric-value svelte-qd118l">\u2014</span>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(
          `<span class="metric-value svelte-qd118l">${escape_html(formatCount(0))}</span>`,
        );
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(
      `<!--]--></div> <div class="metric-card svelte-qd118l"><span class="metric-label svelte-qd118l">Evidence items</span> `,
    );
    if (state2.health) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<span class="metric-value svelte-qd118l">${escape_html(formatCount(state2.health?.evidenceCount))}</span>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(
        `<div class="skeleton skeleton-lg svelte-qd118l"></div>`,
      );
    }
    $$renderer2.push(
      `<!--]--></div> <div class="metric-card svelte-qd118l"><span class="metric-label svelte-qd118l">Policy templates</span> `,
    );
    if (state2.health?.policies) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<span class="metric-value svelte-qd118l">${escape_html(formatCount(state2.health?.policies?.templates ?? null))}</span>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(
        `<div class="skeleton skeleton-lg svelte-qd118l"></div>`,
      );
    }
    $$renderer2.push(`<!--]--></div></section> `);
    if (latencyChips.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="latency-chips svelte-qd118l"><!--[-->`);
      const each_array = ensure_array_like(latencyChips);
      for (
        let $$index = 0, $$length = each_array.length;
        $$index < $$length;
        $$index++
      ) {
        let chip = each_array[$$index];
        $$renderer2.push(
          `<span class="latency-chip svelte-qd118l"><span class="chip-label svelte-qd118l">${escape_html(chip.label)}</span> <span class="chip-value svelte-qd118l">${escape_html(chip.display)}</span></span>`,
        );
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(
      `<!--]--> <div class="content-grid svelte-qd118l"><section class="panel coverage-panel svelte-qd118l"><header class="panel-header svelte-qd118l"><div class="svelte-qd118l"><h2 class="svelte-qd118l">Coverage Controls</h2> `,
    );
    if (state2.coverage) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<p class="panel-subtitle svelte-qd118l">${escape_html(formatCount(state2.coverage.totalControls))} controls tracked</p>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(
      `<!--]--></div> <input class="filter-input svelte-qd118l" type="search" placeholder="Filter controls"${attr("value", filterValue)}/></header> `,
    );
    if (!state2.coverage) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="panel-body svelte-qd118l"><!--[-->`);
      const each_array_1 = ensure_array_like(Array(COVERAGE_PLACEHOLDER_ROWS));
      for (
        let $$index_1 = 0, $$length = each_array_1.length;
        $$index_1 < $$length;
        $$index_1++
      ) {
        each_array_1[$$index_1];
        $$renderer2.push(
          `<div class="table-placeholder-row svelte-qd118l" aria-hidden="true"><div class="skeleton skeleton-line svelte-qd118l"></div></div>`,
        );
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (!controlsWithShare.length) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<div class="panel-body empty svelte-qd118l">No controls match the current filter.</div>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(
          `<div class="panel-body scrollable svelte-qd118l"><table class="coverage-table svelte-qd118l"><thead class="svelte-qd118l"><tr class="svelte-qd118l"><th scope="col" class="svelte-qd118l">Control</th><th scope="col" class="numeric svelte-qd118l">Evidence</th><th scope="col" class="numeric svelte-qd118l">% of framework</th></tr></thead><tbody class="svelte-qd118l"><!--[-->`,
        );
        const each_array_2 = ensure_array_like(controlsWithShare);
        for (
          let $$index_2 = 0, $$length = each_array_2.length;
          $$index_2 < $$length;
          $$index_2++
        ) {
          let control = each_array_2[$$index_2];
          $$renderer2.push(
            `<tr class="svelte-qd118l"><td class="svelte-qd118l">${escape_html(control.controlKey)}</td><td class="numeric svelte-qd118l">${escape_html(formatCount(control.evidenceCount))}</td><td class="numeric svelte-qd118l">${escape_html(formatPercent(control.percent))}</td></tr>`,
          );
        }
        $$renderer2.push(`<!--]--></tbody></table></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(
      `<!--]--></section> <section class="panel svelte-qd118l"><header class="panel-header svelte-qd118l"><h2 class="svelte-qd118l">Open Incidents</h2></header> <div class="panel-body svelte-qd118l">`,
    );
    if (state2.incidents && state2.incidents.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<ul class="list svelte-qd118l"><!--[-->`);
      const each_array_3 = ensure_array_like(state2.incidents);
      for (
        let $$index_3 = 0, $$length = each_array_3.length;
        $$index_3 < $$length;
        $$index_3++
      ) {
        let incident = each_array_3[$$index_3];
        $$renderer2.push(
          `<li class="list-item incident svelte-qd118l"><span${attr_class(`badge ${severityClass(incident.severity)}`, "svelte-qd118l")}>${escape_html(incident.severity ?? "unknown")}</span> <div class="item-body svelte-qd118l"><span class="item-title svelte-qd118l">${escape_html(incident.title || `Incident ${incident.id}`)}</span> <span class="item-meta svelte-qd118l">${escape_html(relativeTime$1(incident.createdAt))}</span></div></li>`,
        );
      }
      $$renderer2.push(`<!--]--></ul>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (state2.allFailed) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<div class="empty svelte-qd118l">Unable to load incidents right now.</div>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(
          `<div class="empty svelte-qd118l">No open incidents.</div>`,
        );
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(
      `<!--]--></div></section> <section class="panel svelte-qd118l"><header class="panel-header svelte-qd118l"><h2 class="svelte-qd118l">Recent Activity</h2></header> <div class="panel-body svelte-qd118l">`,
    );
    if (state2.activity && state2.activity.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<ul class="list svelte-qd118l"><!--[-->`);
      const each_array_4 = ensure_array_like(state2.activity);
      for (
        let $$index_4 = 0, $$length = each_array_4.length;
        $$index_4 < $$length;
        $$index_4++
      ) {
        let event = each_array_4[$$index_4];
        $$renderer2.push(
          `<li class="list-item activity svelte-qd118l"><span class="badge badge-muted svelte-qd118l">${escape_html(activityIcon(event))}</span> <div class="item-body svelte-qd118l"><span class="item-title svelte-qd118l">${escape_html(event.message)}</span> <span class="item-meta svelte-qd118l">${escape_html(relativeTime$1(event.createdAt))}</span></div></li>`,
        );
      }
      $$renderer2.push(`<!--]--></ul>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (state2.allFailed) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<div class="empty svelte-qd118l">Activity feed unavailable.</div>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(
          `<div class="empty svelte-qd118l">No activity recorded.</div>`,
        );
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section></div></div>`);
    bind_props($$props, { data });
  });
}
var rtf, intervals;
var init_page_svelte2 = __esm({
  ".svelte-kit/output/server/entries/pages/governance/compliance/_page.svelte.js"() {
    init_index2();
    init_attributes();
    rtf =
      typeof Intl !== "undefined" && Intl.RelativeTimeFormat
        ? new Intl.RelativeTimeFormat(void 0, { numeric: "auto" })
        : null;
    intervals = [
      [60, 1],
      // seconds
      [3600, 60],
      // minutes
      [86400, 3600],
      // hours
      [604800, 86400],
      // days
      [2629800, 604800],
      // weeks (~month/4)
      [31557600, 2629800],
      // months (~year/12)
    ];
  },
});

// .svelte-kit/output/server/nodes/3.js
var __exports4 = {};
__export(__exports4, {
  component: () => component4,
  fonts: () => fonts4,
  imports: () => imports4,
  index: () => index4,
  stylesheets: () => stylesheets4,
  universal: () => page_ts_exports,
  universal_id: () => universal_id,
});
var index4,
  component_cache4,
  component4,
  universal_id,
  imports4,
  stylesheets4,
  fonts4;
var init__4 = __esm({
  ".svelte-kit/output/server/nodes/3.js"() {
    init_page_ts();
    index4 = 3;
    component4 = async () =>
      (component_cache4 ??= (
        await Promise.resolve().then(
          () => (init_page_svelte2(), page_svelte_exports2),
        )
      ).default);
    universal_id = "src/routes/governance/compliance/+page.ts";
    imports4 = [
      "_app/immutable/nodes/3.DV3oJise.js",
      "_app/immutable/chunks/DXY25tU5.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
      "_app/immutable/chunks/39A_Ntu8.js",
      "_app/immutable/chunks/BHVF3NEQ.js",
      "_app/immutable/chunks/B36Hb1sH.js",
      "_app/immutable/chunks/sxWjfql8.js",
      "_app/immutable/chunks/Buy6Yj7A.js",
      "_app/immutable/chunks/C2VxBUJ8.js",
      "_app/immutable/chunks/CLYubSJh.js",
      "_app/immutable/chunks/DXlasQxZ.js",
      "_app/immutable/chunks/BtMAuxYN.js",
      "_app/immutable/chunks/ApJzsbmA.js",
    ];
    stylesheets4 = ["_app/immutable/assets/3.DtSR6ZlB.css"];
    fonts4 = [];
  },
});

// .svelte-kit/output/server/entries/pages/governance/evidence/_page.svelte.js
var page_svelte_exports3 = {};
__export(page_svelte_exports3, {
  default: () => _page3,
});
function _page3($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let tenantId = "";
    let pack = "";
    let subject = "";
    let limit = 25;
    let loading = false;
    let results = [];
    let verifyHash = "";
    $$renderer2.push(
      `<h1 class="svelte-16ukkkz">Evidence</h1> <form class="search svelte-16ukkkz"><input placeholder="Tenant"${attr("value", tenantId)} class="svelte-16ukkkz"/> <input placeholder="Pack"${attr("value", pack)} class="svelte-16ukkkz"/> <input placeholder="Subject"${attr("value", subject)} class="svelte-16ukkkz"/> <input type="number" min="1" max="200"${attr("value", limit)} class="svelte-16ukkkz"/> <button${attr("disabled", loading, true)} class="svelte-16ukkkz">Search</button></form> `,
    );
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
      if (results.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p>No results.</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(
          `<table class="results svelte-16ukkkz"><thead><tr><th class="svelte-16ukkkz">Hash</th><th class="svelte-16ukkkz">Pack</th><th class="svelte-16ukkkz">Subject</th><th class="svelte-16ukkkz">Created</th></tr></thead><tbody><!--[-->`,
        );
        const each_array = ensure_array_like(results);
        for (
          let $$index = 0, $$length = each_array.length;
          $$index < $$length;
          $$index++
        ) {
          let ev = each_array[$$index];
          $$renderer2.push(
            `<tr><td class="mono svelte-16ukkkz">${escape_html(ev.hash?.slice(0, 12))}\u2026</td><td class="svelte-16ukkkz">${escape_html(ev.pack)}</td><td class="svelte-16ukkkz">${escape_html(ev.subject)}</td><td class="svelte-16ukkkz">${escape_html(ev.createdAt?.slice(0, 19).replace("T", " "))}</td></tr>`,
          );
        }
        $$renderer2.push(`<!--]--></tbody></table>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(
      `<!--]--> <h2>Verify Evidence Hash</h2> <form class="verify svelte-16ukkkz"><input placeholder="Hash"${attr("value", verifyHash)} class="wide svelte-16ukkkz"/> <button class="svelte-16ukkkz">Verify</button></form> `,
    );
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
var init_page_svelte3 = __esm({
  ".svelte-kit/output/server/entries/pages/governance/evidence/_page.svelte.js"() {
    init_index2();
    init_attributes();
  },
});

// .svelte-kit/output/server/nodes/4.js
var __exports5 = {};
__export(__exports5, {
  component: () => component5,
  fonts: () => fonts5,
  imports: () => imports5,
  index: () => index5,
  stylesheets: () => stylesheets5,
});
var index5, component_cache5, component5, imports5, stylesheets5, fonts5;
var init__5 = __esm({
  ".svelte-kit/output/server/nodes/4.js"() {
    index5 = 4;
    component5 = async () =>
      (component_cache5 ??= (
        await Promise.resolve().then(
          () => (init_page_svelte3(), page_svelte_exports3),
        )
      ).default);
    imports5 = [
      "_app/immutable/nodes/4.BzGJmNO1.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
      "_app/immutable/chunks/39A_Ntu8.js",
      "_app/immutable/chunks/BHVF3NEQ.js",
      "_app/immutable/chunks/B36Hb1sH.js",
      "_app/immutable/chunks/sxWjfql8.js",
      "_app/immutable/chunks/C2VxBUJ8.js",
      "_app/immutable/chunks/CWmzcjye.js",
      "_app/immutable/chunks/CLYubSJh.js",
      "_app/immutable/chunks/DXY25tU5.js",
    ];
    stylesheets5 = ["_app/immutable/assets/4.oG73DeQn.css"];
    fonts5 = [];
  },
});

// .svelte-kit/output/server/entries/pages/it/policies/coverage/_page.svelte.js
var page_svelte_exports4 = {};
__export(page_svelte_exports4, {
  default: () => _page4,
});
function _page4($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let framework = "";
    let loading = false;
    $$renderer2.push(
      `<h1>Policy Coverage</h1> <form class="form svelte-12ongys"><input placeholder="Framework (optional)"${attr("value", framework)} class="svelte-12ongys"/> <button${attr("disabled", loading, true)} class="svelte-12ongys">Load</button></form> `,
    );
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
var init_page_svelte4 = __esm({
  ".svelte-kit/output/server/entries/pages/it/policies/coverage/_page.svelte.js"() {
    init_attributes();
  },
});

// .svelte-kit/output/server/nodes/5.js
var __exports6 = {};
__export(__exports6, {
  component: () => component6,
  fonts: () => fonts6,
  imports: () => imports6,
  index: () => index6,
  stylesheets: () => stylesheets6,
});
var index6, component_cache6, component6, imports6, stylesheets6, fonts6;
var init__6 = __esm({
  ".svelte-kit/output/server/nodes/5.js"() {
    index6 = 5;
    component6 = async () =>
      (component_cache6 ??= (
        await Promise.resolve().then(
          () => (init_page_svelte4(), page_svelte_exports4),
        )
      ).default);
    imports6 = [
      "_app/immutable/nodes/5.BKNh8Kgy.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
      "_app/immutable/chunks/39A_Ntu8.js",
      "_app/immutable/chunks/BHVF3NEQ.js",
      "_app/immutable/chunks/sxWjfql8.js",
      "_app/immutable/chunks/C2VxBUJ8.js",
      "_app/immutable/chunks/CWmzcjye.js",
      "_app/immutable/chunks/CLYubSJh.js",
      "_app/immutable/chunks/DXY25tU5.js",
    ];
    stylesheets6 = ["_app/immutable/assets/5.J_PzWzQZ.css"];
    fonts6 = [];
  },
});

// .svelte-kit/output/server/entries/pages/it/policies/evaluate/_page.svelte.js
var page_svelte_exports5 = {};
__export(page_svelte_exports5, {
  default: () => _page5,
});
function _page5($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let policyText = "";
    $$renderer2.push(
      `<h1>Evaluate Policy</h1> <form class="form svelte-1mfxj0f"><textarea placeholder="Paste policy body" class="svelte-1mfxj0f">`,
    );
    const $$body = escape_html(policyText);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(
      `</textarea> <button${attr("disabled", !policyText, true)} class="svelte-1mfxj0f">Evaluate</button></form> `,
    );
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
var init_page_svelte5 = __esm({
  ".svelte-kit/output/server/entries/pages/it/policies/evaluate/_page.svelte.js"() {
    init_attributes();
  },
});

// .svelte-kit/output/server/nodes/6.js
var __exports7 = {};
__export(__exports7, {
  component: () => component7,
  fonts: () => fonts7,
  imports: () => imports7,
  index: () => index7,
  stylesheets: () => stylesheets7,
});
var index7, component_cache7, component7, imports7, stylesheets7, fonts7;
var init__7 = __esm({
  ".svelte-kit/output/server/nodes/6.js"() {
    index7 = 6;
    component7 = async () =>
      (component_cache7 ??= (
        await Promise.resolve().then(
          () => (init_page_svelte5(), page_svelte_exports5),
        )
      ).default);
    imports7 = [
      "_app/immutable/nodes/6.DjdVN4v5.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
      "_app/immutable/chunks/39A_Ntu8.js",
      "_app/immutable/chunks/BHVF3NEQ.js",
      "_app/immutable/chunks/C2VxBUJ8.js",
      "_app/immutable/chunks/CWmzcjye.js",
      "_app/immutable/chunks/CLYubSJh.js",
      "_app/immutable/chunks/DXY25tU5.js",
    ];
    stylesheets7 = ["_app/immutable/assets/6.hWdTLeuB.css"];
    fonts7 = [];
  },
});

// .svelte-kit/output/server/entries/pages/it/policies/generate/_page.svelte.js
var page_svelte_exports6 = {};
__export(page_svelte_exports6, {
  default: () => _page6,
});
function _page6($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let templateKey = "";
    let subject = "";
    $$renderer2.push(
      `<h1>Generate Policy</h1> <form class="form svelte-1xycszf"><input placeholder="Template key"${attr("value", templateKey)} class="svelte-1xycszf"/> <input placeholder="Subject / system"${attr("value", subject)} class="svelte-1xycszf"/> <button${attr("disabled", !templateKey, true)} class="svelte-1xycszf">Generate</button></form> `,
    );
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
var init_page_svelte6 = __esm({
  ".svelte-kit/output/server/entries/pages/it/policies/generate/_page.svelte.js"() {
    init_attributes();
  },
});

// .svelte-kit/output/server/nodes/7.js
var __exports8 = {};
__export(__exports8, {
  component: () => component8,
  fonts: () => fonts8,
  imports: () => imports8,
  index: () => index8,
  stylesheets: () => stylesheets8,
});
var index8, component_cache8, component8, imports8, stylesheets8, fonts8;
var init__8 = __esm({
  ".svelte-kit/output/server/nodes/7.js"() {
    index8 = 7;
    component8 = async () =>
      (component_cache8 ??= (
        await Promise.resolve().then(
          () => (init_page_svelte6(), page_svelte_exports6),
        )
      ).default);
    imports8 = [
      "_app/immutable/nodes/7.DNCuDBw9.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
      "_app/immutable/chunks/39A_Ntu8.js",
      "_app/immutable/chunks/BHVF3NEQ.js",
      "_app/immutable/chunks/sxWjfql8.js",
      "_app/immutable/chunks/C2VxBUJ8.js",
      "_app/immutable/chunks/CWmzcjye.js",
      "_app/immutable/chunks/CLYubSJh.js",
      "_app/immutable/chunks/DXY25tU5.js",
    ];
    stylesheets8 = ["_app/immutable/assets/7.DmLdZvR9.css"];
    fonts8 = [];
  },
});

// .svelte-kit/output/server/entries/pages/it/policies/templates/_page.svelte.js
var page_svelte_exports7 = {};
__export(page_svelte_exports7, {
  default: () => _page7,
});
function _page7($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let templates = [];
    let error2 = null;
    let loading = true;
    (async () => {
      try {
        templates = (await ComplianceAPI.listPolicyTemplates()).items || [];
      } catch (e3) {
        error2 = e3?.body?.error || "Failed to load templates";
      } finally {
        loading = false;
      }
    })();
    $$renderer2.push(`<h1>Policy Templates</h1> `);
    if (loading) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p>Loading...</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (error2) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<p class="error svelte-ci0obv">${escape_html(error2)}</p>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
        if (templates.length === 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p>No templates.</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<ul class="list svelte-ci0obv"><!--[-->`);
          const each_array = ensure_array_like(templates);
          for (
            let $$index = 0, $$length = each_array.length;
            $$index < $$length;
            $$index++
          ) {
            let t2 = each_array[$$index];
            $$renderer2.push(
              `<li class="svelte-ci0obv"><strong>${escape_html(t2.key)}</strong> \u2014 ${escape_html(t2.name || t2.title)}</li>`,
            );
          }
          $$renderer2.push(`<!--]--></ul>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
var init_page_svelte7 = __esm({
  ".svelte-kit/output/server/entries/pages/it/policies/templates/_page.svelte.js"() {
    init_index2();
    init_client();
    init_attributes();
  },
});

// .svelte-kit/output/server/nodes/8.js
var __exports9 = {};
__export(__exports9, {
  component: () => component9,
  fonts: () => fonts9,
  imports: () => imports9,
  index: () => index9,
  stylesheets: () => stylesheets9,
});
var index9, component_cache9, component9, imports9, stylesheets9, fonts9;
var init__9 = __esm({
  ".svelte-kit/output/server/nodes/8.js"() {
    index9 = 8;
    component9 = async () =>
      (component_cache9 ??= (
        await Promise.resolve().then(
          () => (init_page_svelte7(), page_svelte_exports7),
        )
      ).default);
    imports9 = [
      "_app/immutable/nodes/8.DmvTBjD9.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
      "_app/immutable/chunks/39A_Ntu8.js",
      "_app/immutable/chunks/BHVF3NEQ.js",
      "_app/immutable/chunks/B36Hb1sH.js",
      "_app/immutable/chunks/CLYubSJh.js",
      "_app/immutable/chunks/DXY25tU5.js",
    ];
    stylesheets9 = ["_app/immutable/assets/8.BUCBvTi_.css"];
    fonts9 = [];
  },
});

// .svelte-kit/output/server/entries/pages/marketplace/slack/_page.svelte.js
var page_svelte_exports8 = {};
__export(page_svelte_exports8, {
  default: () => _page8,
});
function _page8($$renderer) {
  $$renderer.push(
    `<h1>Slack Integration</h1> <p>Placeholder for Slack integration configuration. Future sections:</p> <ul><li>Installation / OAuth status</li> <li>Incident notification channel mapping</li> <li>Policy update alerts toggle</li> <li>Workflow execution summaries</li></ul>`,
  );
}
var init_page_svelte8 = __esm({
  ".svelte-kit/output/server/entries/pages/marketplace/slack/_page.svelte.js"() {
    init_clsx();
  },
});

// .svelte-kit/output/server/nodes/9.js
var __exports10 = {};
__export(__exports10, {
  component: () => component10,
  fonts: () => fonts10,
  imports: () => imports10,
  index: () => index10,
  stylesheets: () => stylesheets10,
});
var index10, component_cache10, component10, imports10, stylesheets10, fonts10;
var init__10 = __esm({
  ".svelte-kit/output/server/nodes/9.js"() {
    index10 = 9;
    component10 = async () =>
      (component_cache10 ??= (
        await Promise.resolve().then(
          () => (init_page_svelte8(), page_svelte_exports8),
        )
      ).default);
    imports10 = [
      "_app/immutable/nodes/9.DkBVudeM.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
    ];
    stylesheets10 = [];
    fonts10 = [];
  },
});

// .svelte-kit/output/server/entries/pages/security/activity/_page.ts.js
var page_ts_exports2 = {};
__export(page_ts_exports2, {
  load: () => load2,
});
var load2;
var init_page_ts2 = __esm({
  ".svelte-kit/output/server/entries/pages/security/activity/_page.ts.js"() {
    init_client();
    load2 = async ({ fetch: fetch2, url }) => {
      const limit = Number(url.searchParams.get("limit") || 50);
      try {
        const activity = await ComplianceAPI.listActivity({ limit }, fetch2);
        return { activity };
      } catch (e3) {
        return { error: e3?.body?.error || "Failed to load activity" };
      }
    };
  },
});

// .svelte-kit/output/server/entries/pages/security/activity/_page.svelte.js
var page_svelte_exports9 = {};
__export(page_svelte_exports9, {
  default: () => _page9,
});
function _page9($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let items = data.activity?.items || [];
    $$renderer2.push(`<h1 class="svelte-n3q11l">Activity Feed</h1> `);
    if (data.error) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<p class="error svelte-n3q11l">${escape_html(data.error)}</p>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<ul class="feed svelte-n3q11l"><!--[-->`);
      const each_array = ensure_array_like(items);
      for (
        let $$index = 0, $$length = each_array.length;
        $$index < $$length;
        $$index++
      ) {
        let ev = each_array[$$index];
        $$renderer2.push(
          `<li class="svelte-n3q11l"><code class="svelte-n3q11l">${escape_html(ev.type)}</code> <span>${escape_html(ev.message || ev.summary || ev.detail)}</span> <time class="svelte-n3q11l">${escape_html(ev.createdAt?.slice(0, 19).replace("T", " "))}</time></li>`,
        );
      }
      $$renderer2.push(`<!--]--></ul>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { data });
  });
}
var init_page_svelte9 = __esm({
  ".svelte-kit/output/server/entries/pages/security/activity/_page.svelte.js"() {
    init_index2();
    init_attributes();
  },
});

// .svelte-kit/output/server/nodes/10.js
var __exports11 = {};
__export(__exports11, {
  component: () => component11,
  fonts: () => fonts11,
  imports: () => imports11,
  index: () => index11,
  stylesheets: () => stylesheets11,
  universal: () => page_ts_exports2,
  universal_id: () => universal_id2,
});
var index11,
  component_cache11,
  component11,
  universal_id2,
  imports11,
  stylesheets11,
  fonts11;
var init__11 = __esm({
  ".svelte-kit/output/server/nodes/10.js"() {
    init_page_ts2();
    index11 = 10;
    component11 = async () =>
      (component_cache11 ??= (
        await Promise.resolve().then(
          () => (init_page_svelte9(), page_svelte_exports9),
        )
      ).default);
    universal_id2 = "src/routes/security/activity/+page.ts";
    imports11 = [
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
    stylesheets11 = ["_app/immutable/assets/10.p2MU3IHz.css"];
    fonts11 = [];
  },
});

// .svelte-kit/output/server/entries/pages/security/incidents/_page.ts.js
var page_ts_exports3 = {};
__export(page_ts_exports3, {
  load: () => load3,
});
var load3;
var init_page_ts3 = __esm({
  ".svelte-kit/output/server/entries/pages/security/incidents/_page.ts.js"() {
    init_client();
    load3 = async ({ fetch: fetch2, url }) => {
      const limit = Number(url.searchParams.get("limit") || 25);
      try {
        const incidents = await ComplianceAPI.listIncidents({ limit }, fetch2);
        return { incidents };
      } catch (e3) {
        return { error: e3?.body?.error || "Failed to load incidents" };
      }
    };
  },
});

// .svelte-kit/output/server/entries/pages/security/incidents/_page.svelte.js
var page_svelte_exports10 = {};
__export(page_svelte_exports10, {
  default: () => _page10,
});
function _page10($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let title = "";
    let severity = "low";
    let items = data.incidents?.items || [];
    $$renderer2.push(`<h1 class="svelte-k4yj4f">Security Incidents</h1> `);
    if (data.error) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<p class="error svelte-k4yj4f">${escape_html(data.error)}</p>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(
      `<!--]--> <form class="create svelte-k4yj4f"><input placeholder="Title"${attr("value", title)} class="svelte-k4yj4f"/> `,
    );
    $$renderer2.select(
      { value: severity, class: "" },
      ($$renderer3) => {
        $$renderer3.option({ value: "low" }, ($$renderer4) => {
          $$renderer4.push(`Low`);
        });
        $$renderer3.option({ value: "medium" }, ($$renderer4) => {
          $$renderer4.push(`Medium`);
        });
        $$renderer3.option({ value: "high" }, ($$renderer4) => {
          $$renderer4.push(`High`);
        });
        $$renderer3.option({ value: "critical" }, ($$renderer4) => {
          $$renderer4.push(`Critical`);
        });
      },
      "svelte-k4yj4f",
    );
    $$renderer2.push(
      ` <button${attr("disabled", !title, true)} class="svelte-k4yj4f">Create</button></form> `,
    );
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(
      `<!--]--> <table class="list svelte-k4yj4f"><thead><tr><th class="svelte-k4yj4f">Title</th><th class="svelte-k4yj4f">Severity</th><th class="svelte-k4yj4f">Status</th><th class="svelte-k4yj4f">Created</th></tr></thead><tbody><!--[-->`,
    );
    const each_array = ensure_array_like(items);
    for (
      let $$index = 0, $$length = each_array.length;
      $$index < $$length;
      $$index++
    ) {
      let inc = each_array[$$index];
      $$renderer2.push(
        `<tr><td class="svelte-k4yj4f">${escape_html(inc.title)}</td><td class="svelte-k4yj4f">${escape_html(inc.severity)}</td><td class="svelte-k4yj4f">${escape_html(inc.status)}</td><td class="svelte-k4yj4f">${escape_html(inc.createdAt?.slice(0, 19).replace("T", " "))}</td></tr>`,
      );
    }
    $$renderer2.push(`<!--]--></tbody></table>`);
    bind_props($$props, { data });
  });
}
var init_page_svelte10 = __esm({
  ".svelte-kit/output/server/entries/pages/security/incidents/_page.svelte.js"() {
    init_index2();
    init_attributes();
  },
});

// .svelte-kit/output/server/nodes/11.js
var __exports12 = {};
__export(__exports12, {
  component: () => component12,
  fonts: () => fonts12,
  imports: () => imports12,
  index: () => index12,
  stylesheets: () => stylesheets12,
  universal: () => page_ts_exports3,
  universal_id: () => universal_id3,
});
var index12,
  component_cache12,
  component12,
  universal_id3,
  imports12,
  stylesheets12,
  fonts12;
var init__12 = __esm({
  ".svelte-kit/output/server/nodes/11.js"() {
    init_page_ts3();
    index12 = 11;
    component12 = async () =>
      (component_cache12 ??= (
        await Promise.resolve().then(
          () => (init_page_svelte10(), page_svelte_exports10),
        )
      ).default);
    universal_id3 = "src/routes/security/incidents/+page.ts";
    imports12 = [
      "_app/immutable/nodes/11.8gnfjZGJ.js",
      "_app/immutable/chunks/DXY25tU5.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
      "_app/immutable/chunks/39A_Ntu8.js",
      "_app/immutable/chunks/BHVF3NEQ.js",
      "_app/immutable/chunks/B36Hb1sH.js",
      "_app/immutable/chunks/sxWjfql8.js",
      "_app/immutable/chunks/C2VxBUJ8.js",
      "_app/immutable/chunks/CWmzcjye.js",
      "_app/immutable/chunks/CLYubSJh.js",
      "_app/immutable/chunks/DXlasQxZ.js",
      "_app/immutable/chunks/BtMAuxYN.js",
      "_app/immutable/chunks/ApJzsbmA.js",
    ];
    stylesheets12 = ["_app/immutable/assets/11.BleGF1KY.css"];
    fonts12 = [];
  },
});

// .svelte-kit/output/server/entries/pages/workflows/_page.svelte.js
var page_svelte_exports11 = {};
__export(page_svelte_exports11, {
  default: () => _page11,
});
function _page11($$renderer) {
  $$renderer.push(
    `<h1>Workflows</h1> <p>Trigger and monitor JML workflows (placeholder).</p> <ul><li>List recent executions</li> <li>Launch onboarding/offboarding demo workflow</li> <li>Link to individual execution detail</li></ul>`,
  );
}
var init_page_svelte11 = __esm({
  ".svelte-kit/output/server/entries/pages/workflows/_page.svelte.js"() {
    init_clsx();
  },
});

// .svelte-kit/output/server/nodes/12.js
var __exports13 = {};
__export(__exports13, {
  component: () => component13,
  fonts: () => fonts13,
  imports: () => imports13,
  index: () => index13,
  stylesheets: () => stylesheets13,
});
var index13, component_cache13, component13, imports13, stylesheets13, fonts13;
var init__13 = __esm({
  ".svelte-kit/output/server/nodes/12.js"() {
    index13 = 12;
    component13 = async () =>
      (component_cache13 ??= (
        await Promise.resolve().then(
          () => (init_page_svelte11(), page_svelte_exports11),
        )
      ).default);
    imports13 = [
      "_app/immutable/nodes/12.DMa3aD8O.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
    ];
    stylesheets13 = [];
    fonts13 = [];
  },
});

// .svelte-kit/output/server/entries/pages/workflows/executions/_id_/_page.svelte.js
var page_svelte_exports12 = {};
__export(page_svelte_exports12, {
  default: () => _page12,
});
function _page12($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let id;
    id = store_get(($$store_subs ??= {}), "$page", page).params.id;
    $$renderer2.push(
      `<h1>Workflow Execution</h1> <p>Execution ID: <code>${escape_html(id)}</code></p> <p>Detail view placeholder \u2013 show steps, status timeline, metrics.</p>`,
    );
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
var init_page_svelte12 = __esm({
  ".svelte-kit/output/server/entries/pages/workflows/executions/_id_/_page.svelte.js"() {
    init_index2();
    init_stores();
    init_attributes();
  },
});

// .svelte-kit/output/server/nodes/13.js
var __exports14 = {};
__export(__exports14, {
  component: () => component14,
  fonts: () => fonts14,
  imports: () => imports14,
  index: () => index14,
  stylesheets: () => stylesheets14,
});
var index14, component_cache14, component14, imports14, stylesheets14, fonts14;
var init__14 = __esm({
  ".svelte-kit/output/server/nodes/13.js"() {
    index14 = 13;
    component14 = async () =>
      (component_cache14 ??= (
        await Promise.resolve().then(
          () => (init_page_svelte12(), page_svelte_exports12),
        )
      ).default);
    imports14 = [
      "_app/immutable/nodes/13.CNiFFnax.js",
      "_app/immutable/chunks/Bzak7iHL.js",
      "_app/immutable/chunks/B37ZqHvF.js",
      "_app/immutable/chunks/DLjC2_M2.js",
      "_app/immutable/chunks/39A_Ntu8.js",
      "_app/immutable/chunks/CLYubSJh.js",
      "_app/immutable/chunks/BtMAuxYN.js",
      "_app/immutable/chunks/ApJzsbmA.js",
      "_app/immutable/chunks/Ck49g6Iw.js",
      "_app/immutable/chunks/FcwPhPSy.js",
      "_app/immutable/chunks/rRTekDYD.js",
    ];
    stylesheets14 = [];
    fonts14 = [];
  },
});

// .svelte-kit/output/server/entries/endpoints/health/_server.ts.js
var server_ts_exports = {};
__export(server_ts_exports, {
  GET: () => GET,
});
var GET;
var init_server_ts = __esm({
  ".svelte-kit/output/server/entries/endpoints/health/_server.ts.js"() {
    GET = async () =>
      new Response(
        JSON.stringify({
          status: "ok",
          timestamp: /* @__PURE__ */ new Date().toISOString(),
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
  },
});

// .svelte-kit/output/server/index.js
init_false();

// node_modules/.pnpm/@sveltejs+kit@2.42.1_@sveltejs+vite-plugin-svelte@6.2.0_svelte@5.38.10_vite@6.3.6__svelte@5.38.10_vite@6.3.6/node_modules/@sveltejs/kit/src/exports/index.js
init_internal();

// node_modules/.pnpm/esm-env@1.2.2/node_modules/esm-env/true.js
var true_default = true;

// node_modules/.pnpm/esm-env@1.2.2/node_modules/esm-env/dev-fallback.js
var node_env = globalThis.process?.env?.NODE_ENV;
var dev_fallback_default =
  node_env && !node_env.toLowerCase().startsWith("prod");

// node_modules/.pnpm/@sveltejs+kit@2.42.1_@sveltejs+vite-plugin-svelte@6.2.0_svelte@5.38.10_vite@6.3.6__svelte@5.38.10_vite@6.3.6/node_modules/@sveltejs/kit/src/runtime/utils.js
var text_encoder = new TextEncoder();
var text_decoder = new TextDecoder();

// node_modules/.pnpm/@sveltejs+kit@2.42.1_@sveltejs+vite-plugin-svelte@6.2.0_svelte@5.38.10_vite@6.3.6__svelte@5.38.10_vite@6.3.6/node_modules/@sveltejs/kit/src/exports/index.js
function error(status, body2) {
  if (
    (!true_default || dev_fallback_default) &&
    (isNaN(status) || status < 400 || status > 599)
  ) {
    throw new Error(
      `HTTP error status codes must be between 400 and 599 \u2014 ${status} is invalid`,
    );
  }
  throw new HttpError(status, body2);
}
function json(data, init2) {
  const body2 = JSON.stringify(data);
  const headers2 = new Headers(init2?.headers);
  if (!headers2.has("content-length")) {
    headers2.set(
      "content-length",
      text_encoder.encode(body2).byteLength.toString(),
    );
  }
  if (!headers2.has("content-type")) {
    headers2.set("content-type", "application/json");
  }
  return new Response(body2, {
    ...init2,
    headers: headers2,
  });
}
function text(body2, init2) {
  const headers2 = new Headers(init2?.headers);
  if (!headers2.has("content-length")) {
    const encoded = text_encoder.encode(body2);
    headers2.set("content-length", encoded.byteLength.toString());
    return new Response(encoded, {
      ...init2,
      headers: headers2,
    });
  }
  return new Response(body2, {
    ...init2,
    headers: headers2,
  });
}

// .svelte-kit/output/server/index.js
init_internal();

// node_modules/.pnpm/@sveltejs+kit@2.42.1_@sveltejs+vite-plugin-svelte@6.2.0_svelte@5.38.10_vite@6.3.6__svelte@5.38.10_vite@6.3.6/node_modules/@sveltejs/kit/src/exports/internal/event.js
var sync_store = null;
var als;
import("node:async_hooks")
  .then((hooks) => (als = new hooks.AsyncLocalStorage()))
  .catch(() => {});
function with_request_store(store, fn) {
  try {
    sync_store = store;
    return als ? als.run(store, fn) : fn();
  } finally {
    sync_store = null;
  }
}

// node_modules/.pnpm/@sveltejs+kit@2.42.1_@sveltejs+vite-plugin-svelte@6.2.0_svelte@5.38.10_vite@6.3.6__svelte@5.38.10_vite@6.3.6/node_modules/@sveltejs/kit/src/exports/internal/server.js
function merge_tracing(event_like, current) {
  return {
    ...event_like,
    tracing: {
      ...event_like.tracing,
      current,
    },
  };
}

// .svelte-kit/output/server/chunks/environment.js
var base = "";
var assets = base;
var app_dir = "_app";
var initial = { base, assets };
function override(paths) {
  base = paths.base;
  assets = paths.assets;
}
function reset() {
  base = initial.base;
  assets = initial.assets;
}

// ../../node_modules/devalue/src/utils.js
var escaped = {
  "<": "\\u003C",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};
var DevalueError = class extends Error {
  /**
   * @param {string} message
   * @param {string[]} keys
   */
  constructor(message, keys) {
    super(message);
    this.name = "DevalueError";
    this.path = keys.join("");
  }
};
function is_primitive(thing) {
  return Object(thing) !== thing;
}
var object_proto_names = /* @__PURE__ */ Object.getOwnPropertyNames(
  Object.prototype,
)
  .sort()
  .join("\0");
function is_plain_object(thing) {
  const proto = Object.getPrototypeOf(thing);
  return (
    proto === Object.prototype ||
    proto === null ||
    Object.getPrototypeOf(proto) === null ||
    Object.getOwnPropertyNames(proto).sort().join("\0") === object_proto_names
  );
}
function get_type(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function get_escaped_char(char) {
  switch (char) {
    case '"':
      return '\\"';
    case "<":
      return "\\u003C";
    case "\\":
      return "\\\\";
    case "\n":
      return "\\n";
    case "\r":
      return "\\r";
    case "	":
      return "\\t";
    case "\b":
      return "\\b";
    case "\f":
      return "\\f";
    case "\u2028":
      return "\\u2028";
    case "\u2029":
      return "\\u2029";
    default:
      return char < " "
        ? `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`
        : "";
  }
}
function stringify_string(str) {
  let result = "";
  let last_pos = 0;
  const len = str.length;
  for (let i = 0; i < len; i += 1) {
    const char = str[i];
    const replacement = get_escaped_char(char);
    if (replacement) {
      result += str.slice(last_pos, i) + replacement;
      last_pos = i + 1;
    }
  }
  return `"${last_pos === 0 ? str : result + str.slice(last_pos)}"`;
}
function enumerable_symbols(object) {
  return Object.getOwnPropertySymbols(object).filter(
    (symbol) => Object.getOwnPropertyDescriptor(object, symbol).enumerable,
  );
}
var is_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
function stringify_key(key2) {
  return is_identifier.test(key2)
    ? "." + key2
    : "[" + JSON.stringify(key2) + "]";
}

// ../../node_modules/devalue/src/uneval.js
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafe_chars = /[<\b\f\n\r\t\0\u2028\u2029]/g;
var reserved =
  /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
function uneval(value, replacer) {
  const counts = /* @__PURE__ */ new Map();
  const keys = [];
  const custom = /* @__PURE__ */ new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new DevalueError(`Cannot stringify a function`, keys);
    }
    if (!is_primitive(thing)) {
      if (counts.has(thing)) {
        counts.set(thing, counts.get(thing) + 1);
        return;
      }
      counts.set(thing, 1);
      if (replacer) {
        const str2 = replacer(thing);
        if (typeof str2 === "string") {
          custom.set(thing, str2);
          return;
        }
      }
      const type = get_type(thing);
      switch (type) {
        case "Number":
        case "BigInt":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
        case "URL":
        case "URLSearchParams":
          return;
        case "Array":
          thing.forEach((value2, i) => {
            keys.push(`[${i}]`);
            walk(value2);
            keys.pop();
          });
          break;
        case "Set":
          Array.from(thing).forEach(walk);
          break;
        case "Map":
          for (const [key2, value2] of thing) {
            keys.push(
              `.get(${is_primitive(key2) ? stringify_primitive(key2) : "..."})`,
            );
            walk(value2);
            keys.pop();
          }
          break;
        case "Int8Array":
        case "Uint8Array":
        case "Uint8ClampedArray":
        case "Int16Array":
        case "Uint16Array":
        case "Int32Array":
        case "Uint32Array":
        case "Float32Array":
        case "Float64Array":
        case "BigInt64Array":
        case "BigUint64Array":
          walk(thing.buffer);
          return;
        case "ArrayBuffer":
          return;
        case "Temporal.Duration":
        case "Temporal.Instant":
        case "Temporal.PlainDate":
        case "Temporal.PlainTime":
        case "Temporal.PlainDateTime":
        case "Temporal.PlainMonthDay":
        case "Temporal.PlainYearMonth":
        case "Temporal.ZonedDateTime":
          return;
        default:
          if (!is_plain_object(thing)) {
            throw new DevalueError(
              `Cannot stringify arbitrary non-POJOs`,
              keys,
            );
          }
          if (enumerable_symbols(thing).length > 0) {
            throw new DevalueError(
              `Cannot stringify POJOs with symbolic keys`,
              keys,
            );
          }
          for (const key2 in thing) {
            keys.push(stringify_key(key2));
            walk(thing[key2]);
            keys.pop();
          }
      }
    }
  }
  walk(value);
  const names = /* @__PURE__ */ new Map();
  Array.from(counts)
    .filter((entry) => entry[1] > 1)
    .sort((a, b) => b[1] - a[1])
    .forEach((entry, i) => {
      names.set(entry[0], get_name(i));
    });
  function stringify4(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (is_primitive(thing)) {
      return stringify_primitive(thing);
    }
    if (custom.has(thing)) {
      return custom.get(thing);
    }
    const type = get_type(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return `Object(${stringify4(thing.valueOf())})`;
      case "RegExp":
        return `new RegExp(${stringify_string(thing.source)}, "${thing.flags}")`;
      case "Date":
        return `new Date(${thing.getTime()})`;
      case "URL":
        return `new URL(${stringify_string(thing.toString())})`;
      case "URLSearchParams":
        return `new URLSearchParams(${stringify_string(thing.toString())})`;
      case "Array":
        const members =
          /** @type {any[]} */
          thing.map((v, i) => (i in thing ? stringify4(v) : ""));
        const tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return `[${members.join(",")}${tail}]`;
      case "Set":
      case "Map":
        return `new ${type}([${Array.from(thing).map(stringify4).join(",")}])`;
      case "Int8Array":
      case "Uint8Array":
      case "Uint8ClampedArray":
      case "Int16Array":
      case "Uint16Array":
      case "Int32Array":
      case "Uint32Array":
      case "Float32Array":
      case "Float64Array":
      case "BigInt64Array":
      case "BigUint64Array": {
        let str2 = `new ${type}`;
        if (counts.get(thing.buffer) === 1) {
          const array2 = new thing.constructor(thing.buffer);
          str2 += `([${array2}])`;
        } else {
          str2 += `([${stringify4(thing.buffer)}])`;
        }
        const a = thing.byteOffset;
        const b = a + thing.byteLength;
        if (a > 0 || b !== thing.buffer.byteLength) {
          const m = +/(\d+)/.exec(type)[1] / 8;
          str2 += `.subarray(${a / m},${b / m})`;
        }
        return str2;
      }
      case "ArrayBuffer": {
        const ui8 = new Uint8Array(thing);
        return `new Uint8Array([${ui8.toString()}]).buffer`;
      }
      case "Temporal.Duration":
      case "Temporal.Instant":
      case "Temporal.PlainDate":
      case "Temporal.PlainTime":
      case "Temporal.PlainDateTime":
      case "Temporal.PlainMonthDay":
      case "Temporal.PlainYearMonth":
      case "Temporal.ZonedDateTime":
        return `${type}.from(${stringify_string(thing.toString())})`;
      default:
        const obj = `{${Object.keys(thing)
          .map((key2) => `${safe_key(key2)}:${stringify4(thing[key2])}`)
          .join(",")}}`;
        const proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0
            ? `Object.assign(Object.create(null),${obj})`
            : `Object.create(null)`;
        }
        return obj;
    }
  }
  const str = stringify4(value);
  if (names.size) {
    const params = [];
    const statements = [];
    const values = [];
    names.forEach((name, thing) => {
      params.push(name);
      if (custom.has(thing)) {
        values.push(
          /** @type {string} */
          custom.get(thing),
        );
        return;
      }
      if (is_primitive(thing)) {
        values.push(stringify_primitive(thing));
        return;
      }
      const type = get_type(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values.push(`Object(${stringify4(thing.valueOf())})`);
          break;
        case "RegExp":
          values.push(thing.toString());
          break;
        case "Date":
          values.push(`new Date(${thing.getTime()})`);
          break;
        case "Array":
          values.push(`Array(${thing.length})`);
          thing.forEach((v, i) => {
            statements.push(`${name}[${i}]=${stringify4(v)}`);
          });
          break;
        case "Set":
          values.push(`new Set`);
          statements.push(
            `${name}.${Array.from(thing)
              .map((v) => `add(${stringify4(v)})`)
              .join(".")}`,
          );
          break;
        case "Map":
          values.push(`new Map`);
          statements.push(
            `${name}.${Array.from(thing)
              .map(([k, v]) => `set(${stringify4(k)}, ${stringify4(v)})`)
              .join(".")}`,
          );
          break;
        case "ArrayBuffer":
          values.push(
            `new Uint8Array([${new Uint8Array(thing).join(",")}]).buffer`,
          );
          break;
        default:
          values.push(
            Object.getPrototypeOf(thing) === null
              ? "Object.create(null)"
              : "{}",
          );
          Object.keys(thing).forEach((key2) => {
            statements.push(
              `${name}${safe_prop(key2)}=${stringify4(thing[key2])}`,
            );
          });
      }
    });
    statements.push(`return ${str}`);
    return `(function(${params.join(",")}){${statements.join(
      ";",
    )}}(${values.join(",")}))`;
  } else {
    return str;
  }
}
function get_name(num) {
  let name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? `${name}0` : name;
}
function escape_unsafe_char(c2) {
  return escaped[c2] || c2;
}
function escape_unsafe_chars(str) {
  return str.replace(unsafe_chars, escape_unsafe_char);
}
function safe_key(key2) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key2)
    ? key2
    : escape_unsafe_chars(JSON.stringify(key2));
}
function safe_prop(key2) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key2)
    ? `.${key2}`
    : `[${escape_unsafe_chars(JSON.stringify(key2))}]`;
}
function stringify_primitive(thing) {
  if (typeof thing === "string") return stringify_string(thing);
  if (thing === void 0) return "void 0";
  if (thing === 0 && 1 / thing < 0) return "-0";
  const str = String(thing);
  if (typeof thing === "number") return str.replace(/^(-)?0\./, "$1.");
  if (typeof thing === "bigint") return thing + "n";
  return str;
}

// ../../node_modules/devalue/src/base64.js
function encode64(arraybuffer) {
  const dv = new DataView(arraybuffer);
  let binaryString = "";
  for (let i = 0; i < arraybuffer.byteLength; i++) {
    binaryString += String.fromCharCode(dv.getUint8(i));
  }
  return binaryToAscii(binaryString);
}
function decode64(string) {
  const binaryString = asciiToBinary(string);
  const arraybuffer = new ArrayBuffer(binaryString.length);
  const dv = new DataView(arraybuffer);
  for (let i = 0; i < arraybuffer.byteLength; i++) {
    dv.setUint8(i, binaryString.charCodeAt(i));
  }
  return arraybuffer;
}
var KEY_STRING =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function asciiToBinary(data) {
  if (data.length % 4 === 0) {
    data = data.replace(/==?$/, "");
  }
  let output = "";
  let buffer = 0;
  let accumulatedBits = 0;
  for (let i = 0; i < data.length; i++) {
    buffer <<= 6;
    buffer |= KEY_STRING.indexOf(data[i]);
    accumulatedBits += 6;
    if (accumulatedBits === 24) {
      output += String.fromCharCode((buffer & 16711680) >> 16);
      output += String.fromCharCode((buffer & 65280) >> 8);
      output += String.fromCharCode(buffer & 255);
      buffer = accumulatedBits = 0;
    }
  }
  if (accumulatedBits === 12) {
    buffer >>= 4;
    output += String.fromCharCode(buffer);
  } else if (accumulatedBits === 18) {
    buffer >>= 2;
    output += String.fromCharCode((buffer & 65280) >> 8);
    output += String.fromCharCode(buffer & 255);
  }
  return output;
}
function binaryToAscii(str) {
  let out = "";
  for (let i = 0; i < str.length; i += 3) {
    const groupsOfSix = [void 0, void 0, void 0, void 0];
    groupsOfSix[0] = str.charCodeAt(i) >> 2;
    groupsOfSix[1] = (str.charCodeAt(i) & 3) << 4;
    if (str.length > i + 1) {
      groupsOfSix[1] |= str.charCodeAt(i + 1) >> 4;
      groupsOfSix[2] = (str.charCodeAt(i + 1) & 15) << 2;
    }
    if (str.length > i + 2) {
      groupsOfSix[2] |= str.charCodeAt(i + 2) >> 6;
      groupsOfSix[3] = str.charCodeAt(i + 2) & 63;
    }
    for (let j = 0; j < groupsOfSix.length; j++) {
      if (typeof groupsOfSix[j] === "undefined") {
        out += "=";
      } else {
        out += KEY_STRING[groupsOfSix[j]];
      }
    }
  }
  return out;
}

// ../../node_modules/devalue/src/constants.js
var UNDEFINED = -1;
var HOLE = -2;
var NAN = -3;
var POSITIVE_INFINITY = -4;
var NEGATIVE_INFINITY = -5;
var NEGATIVE_ZERO = -6;

// ../../node_modules/devalue/src/parse.js
function parse(serialized, revivers) {
  return unflatten(JSON.parse(serialized), revivers);
}
function unflatten(parsed, revivers) {
  if (typeof parsed === "number") return hydrate2(parsed, true);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Invalid input");
  }
  const values =
    /** @type {any[]} */
    parsed;
  const hydrated = Array(values.length);
  function hydrate2(index15, standalone = false) {
    if (index15 === UNDEFINED) return void 0;
    if (index15 === NAN) return NaN;
    if (index15 === POSITIVE_INFINITY) return Infinity;
    if (index15 === NEGATIVE_INFINITY) return -Infinity;
    if (index15 === NEGATIVE_ZERO) return -0;
    if (standalone || typeof index15 !== "number") {
      throw new Error(`Invalid input`);
    }
    if (index15 in hydrated) return hydrated[index15];
    const value = values[index15];
    if (!value || typeof value !== "object") {
      hydrated[index15] = value;
    } else if (Array.isArray(value)) {
      if (typeof value[0] === "string") {
        const type = value[0];
        const reviver = revivers?.[type];
        if (reviver) {
          return (hydrated[index15] = reviver(hydrate2(value[1])));
        }
        switch (type) {
          case "Date":
            hydrated[index15] = new Date(value[1]);
            break;
          case "Set":
            const set2 = /* @__PURE__ */ new Set();
            hydrated[index15] = set2;
            for (let i = 1; i < value.length; i += 1) {
              set2.add(hydrate2(value[i]));
            }
            break;
          case "Map":
            const map = /* @__PURE__ */ new Map();
            hydrated[index15] = map;
            for (let i = 1; i < value.length; i += 2) {
              map.set(hydrate2(value[i]), hydrate2(value[i + 1]));
            }
            break;
          case "RegExp":
            hydrated[index15] = new RegExp(value[1], value[2]);
            break;
          case "Object":
            hydrated[index15] = Object(value[1]);
            break;
          case "BigInt":
            hydrated[index15] = BigInt(value[1]);
            break;
          case "null":
            const obj = /* @__PURE__ */ Object.create(null);
            hydrated[index15] = obj;
            for (let i = 1; i < value.length; i += 2) {
              obj[value[i]] = hydrate2(value[i + 1]);
            }
            break;
          case "Int8Array":
          case "Uint8Array":
          case "Uint8ClampedArray":
          case "Int16Array":
          case "Uint16Array":
          case "Int32Array":
          case "Uint32Array":
          case "Float32Array":
          case "Float64Array":
          case "BigInt64Array":
          case "BigUint64Array": {
            const TypedArrayConstructor = globalThis[type];
            const typedArray = new TypedArrayConstructor(hydrate2(value[1]));
            hydrated[index15] =
              value[2] !== void 0
                ? typedArray.subarray(value[2], value[3])
                : typedArray;
            break;
          }
          case "ArrayBuffer": {
            const base64 = value[1];
            const arraybuffer = decode64(base64);
            hydrated[index15] = arraybuffer;
            break;
          }
          case "Temporal.Duration":
          case "Temporal.Instant":
          case "Temporal.PlainDate":
          case "Temporal.PlainTime":
          case "Temporal.PlainDateTime":
          case "Temporal.PlainMonthDay":
          case "Temporal.PlainYearMonth":
          case "Temporal.ZonedDateTime": {
            const temporalName = type.slice(9);
            hydrated[index15] = Temporal[temporalName].from(value[1]);
            break;
          }
          case "URL": {
            const url = new URL(value[1]);
            hydrated[index15] = url;
            break;
          }
          case "URLSearchParams": {
            const url = new URLSearchParams(value[1]);
            hydrated[index15] = url;
            break;
          }
          default:
            throw new Error(`Unknown type ${type}`);
        }
      } else {
        const array2 = new Array(value.length);
        hydrated[index15] = array2;
        for (let i = 0; i < value.length; i += 1) {
          const n2 = value[i];
          if (n2 === HOLE) continue;
          array2[i] = hydrate2(n2);
        }
      }
    } else {
      const object = {};
      hydrated[index15] = object;
      for (const key2 in value) {
        if (key2 === "__proto__") {
          throw new Error("Cannot parse an object with a `__proto__` property");
        }
        const n2 = value[key2];
        object[key2] = hydrate2(n2);
      }
    }
    return hydrated[index15];
  }
  return hydrate2(0);
}

// ../../node_modules/devalue/src/stringify.js
function stringify(value, reducers) {
  const stringified = [];
  const indexes = /* @__PURE__ */ new Map();
  const custom = [];
  if (reducers) {
    for (const key2 of Object.getOwnPropertyNames(reducers)) {
      custom.push({ key: key2, fn: reducers[key2] });
    }
  }
  const keys = [];
  let p = 0;
  function flatten(thing) {
    if (typeof thing === "function") {
      throw new DevalueError(`Cannot stringify a function`, keys);
    }
    if (thing === void 0) return UNDEFINED;
    if (Number.isNaN(thing)) return NAN;
    if (thing === Infinity) return POSITIVE_INFINITY;
    if (thing === -Infinity) return NEGATIVE_INFINITY;
    if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO;
    if (indexes.has(thing)) return indexes.get(thing);
    const index16 = p++;
    indexes.set(thing, index16);
    for (const { key: key2, fn } of custom) {
      const value2 = fn(thing);
      if (value2) {
        stringified[index16] = `["${key2}",${flatten(value2)}]`;
        return index16;
      }
    }
    let str = "";
    if (is_primitive(thing)) {
      str = stringify_primitive2(thing);
    } else {
      const type = get_type(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          str = `["Object",${stringify_primitive2(thing)}]`;
          break;
        case "BigInt":
          str = `["BigInt",${thing}]`;
          break;
        case "Date":
          const valid = !isNaN(thing.getDate());
          str = `["Date","${valid ? thing.toISOString() : ""}"]`;
          break;
        case "URL":
          str = `["URL",${stringify_string(thing.toString())}]`;
          break;
        case "URLSearchParams":
          str = `["URLSearchParams",${stringify_string(thing.toString())}]`;
          break;
        case "RegExp":
          const { source: source2, flags } = thing;
          str = flags
            ? `["RegExp",${stringify_string(source2)},"${flags}"]`
            : `["RegExp",${stringify_string(source2)}]`;
          break;
        case "Array":
          str = "[";
          for (let i = 0; i < thing.length; i += 1) {
            if (i > 0) str += ",";
            if (i in thing) {
              keys.push(`[${i}]`);
              str += flatten(thing[i]);
              keys.pop();
            } else {
              str += HOLE;
            }
          }
          str += "]";
          break;
        case "Set":
          str = '["Set"';
          for (const value2 of thing) {
            str += `,${flatten(value2)}`;
          }
          str += "]";
          break;
        case "Map":
          str = '["Map"';
          for (const [key2, value2] of thing) {
            keys.push(
              `.get(${is_primitive(key2) ? stringify_primitive2(key2) : "..."})`,
            );
            str += `,${flatten(key2)},${flatten(value2)}`;
            keys.pop();
          }
          str += "]";
          break;
        case "Int8Array":
        case "Uint8Array":
        case "Uint8ClampedArray":
        case "Int16Array":
        case "Uint16Array":
        case "Int32Array":
        case "Uint32Array":
        case "Float32Array":
        case "Float64Array":
        case "BigInt64Array":
        case "BigUint64Array": {
          const typedArray = thing;
          str = '["' + type + '",' + flatten(typedArray.buffer);
          const a = thing.byteOffset;
          const b = a + thing.byteLength;
          if (a > 0 || b !== typedArray.buffer.byteLength) {
            const m = +/(\d+)/.exec(type)[1] / 8;
            str += `,${a / m},${b / m}`;
          }
          str += "]";
          break;
        }
        case "ArrayBuffer": {
          const arraybuffer = thing;
          const base64 = encode64(arraybuffer);
          str = `["ArrayBuffer","${base64}"]`;
          break;
        }
        case "Temporal.Duration":
        case "Temporal.Instant":
        case "Temporal.PlainDate":
        case "Temporal.PlainTime":
        case "Temporal.PlainDateTime":
        case "Temporal.PlainMonthDay":
        case "Temporal.PlainYearMonth":
        case "Temporal.ZonedDateTime":
          str = `["${type}",${stringify_string(thing.toString())}]`;
          break;
        default:
          if (!is_plain_object(thing)) {
            throw new DevalueError(
              `Cannot stringify arbitrary non-POJOs`,
              keys,
            );
          }
          if (enumerable_symbols(thing).length > 0) {
            throw new DevalueError(
              `Cannot stringify POJOs with symbolic keys`,
              keys,
            );
          }
          if (Object.getPrototypeOf(thing) === null) {
            str = '["null"';
            for (const key2 in thing) {
              keys.push(stringify_key(key2));
              str += `,${stringify_string(key2)},${flatten(thing[key2])}`;
              keys.pop();
            }
            str += "]";
          } else {
            str = "{";
            let started = false;
            for (const key2 in thing) {
              if (started) str += ",";
              started = true;
              keys.push(stringify_key(key2));
              str += `${stringify_string(key2)}:${flatten(thing[key2])}`;
              keys.pop();
            }
            str += "}";
          }
      }
    }
    stringified[index16] = str;
    return index16;
  }
  const index15 = flatten(value);
  if (index15 < 0) return `${index15}`;
  return `[${stringified.join(",")}]`;
}
function stringify_primitive2(thing) {
  const type = typeof thing;
  if (type === "string") return stringify_string(thing);
  if (thing instanceof String) return stringify_string(thing.toString());
  if (thing === void 0) return UNDEFINED.toString();
  if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO.toString();
  if (type === "bigint") return `["BigInt","${thing}"]`;
  return String(thing);
}

// .svelte-kit/output/server/index.js
init_exports();
init_utils();
init_chunks();

// .svelte-kit/output/server/chunks/internal.js
init_index2();
init_clsx();
var public_env = {};
function set_private_env(environment) {}
function set_public_env(environment) {
  public_env = environment;
}
function hydration_mismatch(location) {
  {
    console.warn(`https://svelte.dev/e/hydration_mismatch`);
  }
}
var hydrating = false;
function set_hydrating(value) {
  hydrating = value;
}
var hydrate_node;
function set_hydrate_node(node) {
  if (node === null) {
    hydration_mismatch();
    throw HYDRATION_ERROR;
  }
  return (hydrate_node = node);
}
function hydrate_next() {
  return set_hydrate_node(
    /** @type {TemplateNode} */
    get_next_sibling(hydrate_node),
  );
}
var PASSIVE_EVENTS = ["touchstart", "touchmove"];
function is_passive_event(name) {
  return PASSIVE_EVENTS.includes(name);
}
var all_registered_events = /* @__PURE__ */ new Set();
var root_event_handles = /* @__PURE__ */ new Set();
var last_propagated_event = null;
function handle_event_propagation(event) {
  var handler_element = this;
  var owner_document =
    /** @type {Node} */
    handler_element.ownerDocument;
  var event_name = event.type;
  var path = event.composedPath?.() || [];
  var current_target =
    /** @type {null | Element} */
    path[0] || event.target;
  last_propagated_event = event;
  var path_idx = 0;
  var handled_at = last_propagated_event === event && event.__root;
  if (handled_at) {
    var at_idx = path.indexOf(handled_at);
    if (
      at_idx !== -1 &&
      (handler_element === document ||
        handler_element === /** @type {any} */ window)
    ) {
      event.__root = handler_element;
      return;
    }
    var handler_idx = path.indexOf(handler_element);
    if (handler_idx === -1) {
      return;
    }
    if (at_idx <= handler_idx) {
      path_idx = at_idx;
    }
  }
  current_target = /** @type {Element} */ path[path_idx] || event.target;
  if (current_target === handler_element) return;
  define_property(event, "currentTarget", {
    configurable: true,
    get() {
      return current_target || owner_document;
    },
  });
  var previous_reaction = active_reaction;
  var previous_effect = active_effect;
  set_active_reaction(null);
  set_active_effect(null);
  try {
    var throw_error;
    var other_errors = [];
    while (current_target !== null) {
      var parent_element =
        current_target.assignedSlot ||
        current_target.parentNode ||
        /** @type {any} */
        current_target.host ||
        null;
      try {
        var delegated = current_target["__" + event_name];
        if (
          delegated != null &&
          (!(/** @type {any} */ current_target.disabled) || // DOM could've been updated already by the time this is reached, so we check this as well
            // -> the target could not have been disabled because it emits the event in the first place
            event.target === current_target)
        ) {
          if (is_array(delegated)) {
            var [fn, ...data] = delegated;
            fn.apply(current_target, [event, ...data]);
          } else {
            delegated.call(current_target, event);
          }
        }
      } catch (error2) {
        if (throw_error) {
          other_errors.push(error2);
        } else {
          throw_error = error2;
        }
      }
      if (
        event.cancelBubble ||
        parent_element === handler_element ||
        parent_element === null
      ) {
        break;
      }
      current_target = parent_element;
    }
    if (throw_error) {
      for (let error2 of other_errors) {
        queueMicrotask(() => {
          throw error2;
        });
      }
      throw throw_error;
    }
  } finally {
    event.__root = handler_element;
    delete event.currentTarget;
    set_active_reaction(previous_reaction);
    set_active_effect(previous_effect);
  }
}
function assign_nodes(start, end) {
  var effect =
    /** @type {Effect} */
    active_effect;
  if (effect.nodes_start === null) {
    effect.nodes_start = start;
    effect.nodes_end = end;
  }
}
function mount(component15, options2) {
  return _mount(component15, options2);
}
function hydrate(component15, options2) {
  init_operations();
  options2.intro = options2.intro ?? false;
  const target = options2.target;
  const was_hydrating = hydrating;
  const previous_hydrate_node = hydrate_node;
  try {
    var anchor =
      /** @type {TemplateNode} */
      get_first_child(target);
    while (
      anchor &&
      (anchor.nodeType !== COMMENT_NODE ||
        /** @type {Comment} */
        anchor.data !== HYDRATION_START)
    ) {
      anchor = /** @type {TemplateNode} */ get_next_sibling(anchor);
    }
    if (!anchor) {
      throw HYDRATION_ERROR;
    }
    set_hydrating(true);
    set_hydrate_node(
      /** @type {Comment} */
      anchor,
    );
    hydrate_next();
    const instance = _mount(component15, { ...options2, anchor });
    if (
      hydrate_node === null ||
      hydrate_node.nodeType !== COMMENT_NODE ||
      /** @type {Comment} */
      hydrate_node.data !== HYDRATION_END
    ) {
      hydration_mismatch();
      throw HYDRATION_ERROR;
    }
    set_hydrating(false);
    return (
      /**  @type {Exports} */
      instance
    );
  } catch (error2) {
    if (
      error2 instanceof Error &&
      error2.message
        .split("\n")
        .some((line) => line.startsWith("https://svelte.dev/e/"))
    ) {
      throw error2;
    }
    if (error2 !== HYDRATION_ERROR) {
      console.warn("Failed to hydrate: ", error2);
    }
    if (options2.recover === false) {
      hydration_failed();
    }
    init_operations();
    clear_text_content(target);
    set_hydrating(false);
    return mount(component15, options2);
  } finally {
    set_hydrating(was_hydrating);
    set_hydrate_node(previous_hydrate_node);
  }
}
var document_listeners = /* @__PURE__ */ new Map();
function _mount(
  Component,
  { target, anchor, props = {}, events, context: context2, intro = true },
) {
  init_operations();
  var registered_events = /* @__PURE__ */ new Set();
  var event_handle = (events2) => {
    for (var i = 0; i < events2.length; i++) {
      var event_name = events2[i];
      if (registered_events.has(event_name)) continue;
      registered_events.add(event_name);
      var passive = is_passive_event(event_name);
      target.addEventListener(event_name, handle_event_propagation, {
        passive,
      });
      var n2 = document_listeners.get(event_name);
      if (n2 === void 0) {
        document.addEventListener(event_name, handle_event_propagation, {
          passive,
        });
        document_listeners.set(event_name, 1);
      } else {
        document_listeners.set(event_name, n2 + 1);
      }
    }
  };
  event_handle(array_from(all_registered_events));
  root_event_handles.add(event_handle);
  var component15 = void 0;
  var unmount2 = component_root(() => {
    var anchor_node = anchor ?? target.appendChild(create_text());
    branch(() => {
      if (context2) {
        push$1({});
        var ctx =
          /** @type {ComponentContext} */
          component_context;
        ctx.c = context2;
      }
      if (events) {
        props.$$events = events;
      }
      if (hydrating) {
        assign_nodes(
          /** @type {TemplateNode} */
          anchor_node,
          null,
        );
      }
      component15 = Component(anchor_node, props) || {};
      if (hydrating) {
        active_effect.nodes_end = hydrate_node;
      }
      if (context2) {
        pop$1();
      }
    });
    return () => {
      for (var event_name of registered_events) {
        target.removeEventListener(event_name, handle_event_propagation);
        var n2 =
          /** @type {number} */
          document_listeners.get(event_name);
        if (--n2 === 0) {
          document.removeEventListener(event_name, handle_event_propagation);
          document_listeners.delete(event_name);
        } else {
          document_listeners.set(event_name, n2);
        }
      }
      root_event_handles.delete(event_handle);
      if (anchor_node !== anchor) {
        anchor_node.parentNode?.removeChild(anchor_node);
      }
    };
  });
  mounted_components.set(component15, unmount2);
  return component15;
}
var mounted_components = /* @__PURE__ */ new WeakMap();
function unmount(component15, options2) {
  const fn = mounted_components.get(component15);
  if (fn) {
    mounted_components.delete(component15);
    return fn(options2);
  }
  return Promise.resolve();
}
function asClassComponent$1(component15) {
  return class extends Svelte4Component {
    /** @param {any} options */
    constructor(options2) {
      super({
        component: component15,
        ...options2,
      });
    }
  };
}
var Svelte4Component = class {
  /** @type {any} */
  #events;
  /** @type {Record<string, any>} */
  #instance;
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(options2) {
    var sources = /* @__PURE__ */ new Map();
    var add_source = (key2, value) => {
      var s3 = mutable_source(value, false, false);
      sources.set(key2, s3);
      return s3;
    };
    const props = new Proxy(
      { ...(options2.props || {}), $$events: {} },
      {
        get(target, prop) {
          return get(
            sources.get(prop) ?? add_source(prop, Reflect.get(target, prop)),
          );
        },
        has(target, prop) {
          if (prop === LEGACY_PROPS) return true;
          get(sources.get(prop) ?? add_source(prop, Reflect.get(target, prop)));
          return Reflect.has(target, prop);
        },
        set(target, prop, value) {
          set(sources.get(prop) ?? add_source(prop, value), value);
          return Reflect.set(target, prop, value);
        },
      },
    );
    this.#instance = (options2.hydrate ? hydrate : mount)(options2.component, {
      target: options2.target,
      anchor: options2.anchor,
      props,
      context: options2.context,
      intro: options2.intro ?? false,
      recover: options2.recover,
    });
    if (!options2?.props?.$$host || options2.sync === false) {
      flushSync();
    }
    this.#events = props.$$events;
    for (const key2 of Object.keys(this.#instance)) {
      if (key2 === "$set" || key2 === "$destroy" || key2 === "$on") continue;
      define_property(this, key2, {
        get() {
          return this.#instance[key2];
        },
        /** @param {any} value */
        set(value) {
          this.#instance[key2] = value;
        },
        enumerable: true,
      });
    }
    this.#instance.$set =
      /** @param {Record<string, any>} next */
      (next) => {
        Object.assign(props, next);
      };
    this.#instance.$destroy = () => {
      unmount(this.#instance);
    };
  }
  /** @param {Record<string, any>} props */
  $set(props) {
    this.#instance.$set(props);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(event, callback) {
    this.#events[event] = this.#events[event] || [];
    const cb = (...args) => callback.call(this, ...args);
    this.#events[event].push(cb);
    return () => {
      this.#events[event] = this.#events[event].filter(
        /** @param {any} fn */
        (fn) => fn !== cb,
      );
    };
  }
  $destroy() {
    this.#instance.$destroy();
  }
};
var read_implementation = null;
function set_read_implementation(fn) {
  read_implementation = fn;
}
function asClassComponent(component15) {
  const component_constructor = asClassComponent$1(component15);
  const _render = (props, { context: context2 } = {}) => {
    const result = render(component15, { props, context: context2 });
    return {
      css: { code: "", map: null },
      head: result.head,
      html: result.body,
    };
  };
  component_constructor.render = _render;
  return component_constructor;
}
function Root($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      stores: stores2,
      page: page3,
      constructors,
      components = [],
      form,
      data_0 = null,
      data_1 = null,
    } = $$props;
    {
      setContext("__svelte__", stores2);
    }
    {
      stores2.page.set(page3);
    }
    const Pyramid_1 = constructors[1];
    if (constructors[1]) {
      $$renderer2.push("<!--[-->");
      const Pyramid_0 = constructors[0];
      $$renderer2.push(`<!---->`);
      Pyramid_0($$renderer2, {
        data: data_0,
        form,
        params: page3.params,
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->`);
          Pyramid_1($$renderer3, { data: data_1, form, params: page3.params });
          $$renderer3.push(`<!---->`);
        },
        $$slots: { default: true },
      });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[!-->");
      const Pyramid_0 = constructors[0];
      $$renderer2.push(`<!---->`);
      Pyramid_0($$renderer2, { data: data_0, form, params: page3.params });
      $$renderer2.push(`<!---->`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
var root = asClassComponent(Root);
var options = {
  app_template_contains_nonce: false,
  csp: {
    mode: "auto",
    directives: {
      "upgrade-insecure-requests": false,
      "block-all-mixed-content": false,
    },
    reportOnly: {
      "upgrade-insecure-requests": false,
      "block-all-mixed-content": false,
    },
  },
  csrf_check_origin: true,
  csrf_trusted_origins: [],
  embedded: false,
  env_public_prefix: "PUBLIC_",
  env_private_prefix: "",
  hash_routing: false,
  hooks: null,
  // added lazily, via `get_hooks`
  preload_strategy: "modulepreload",
  root,
  service_worker: false,
  service_worker_options: void 0,
  templates: {
    app: ({ head, body: body2, assets: assets2, nonce, env }) =>
      '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <link rel="icon" href="/favicon.png" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>AtlasIT Governance</title>\n    ' +
      head +
      '\n  </head>\n  <body data-theme="dark">\n    <div style="display: contents">' +
      body2 +
      "</div>\n  </body>\n</html>\n",
    error: ({ status, message }) =>
      '<!doctype html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<title>' +
      message +
      `</title>

		<style>
			body {
				--bg: white;
				--fg: #222;
				--divider: #ccc;
				background: var(--bg);
				color: var(--fg);
				font-family:
					system-ui,
					-apple-system,
					BlinkMacSystemFont,
					'Segoe UI',
					Roboto,
					Oxygen,
					Ubuntu,
					Cantarell,
					'Open Sans',
					'Helvetica Neue',
					sans-serif;
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100vh;
				margin: 0;
			}

			.error {
				display: flex;
				align-items: center;
				max-width: 32rem;
				margin: 0 1rem;
			}

			.status {
				font-weight: 200;
				font-size: 3rem;
				line-height: 1;
				position: relative;
				top: -0.05rem;
			}

			.message {
				border-left: 1px solid var(--divider);
				padding: 0 0 0 1rem;
				margin: 0 0 0 1rem;
				min-height: 2.5rem;
				display: flex;
				align-items: center;
			}

			.message h1 {
				font-weight: 400;
				font-size: 1em;
				margin: 0;
			}

			@media (prefers-color-scheme: dark) {
				body {
					--bg: #222;
					--fg: #ddd;
					--divider: #666;
				}
			}
		</style>
	</head>
	<body>
		<div class="error">
			<span class="status">` +
      status +
      '</span>\n			<div class="message">\n				<h1>' +
      message +
      "</h1>\n			</div>\n		</div>\n	</body>\n</html>\n",
  },
  version_hash: "15e4k4x",
};
async function get_hooks() {
  let handle2;
  let handleFetch;
  let handleError;
  let handleValidationError;
  let init2;
  ({
    handle: handle2,
    handleFetch,
    handleError,
    handleValidationError,
    init: init2,
  } = await Promise.resolve().then(
    () => (init_hooks_server(), hooks_server_exports),
  ));
  let reroute;
  let transport;
  return {
    handle: handle2,
    handleFetch,
    handleError,
    handleValidationError,
    init: init2,
    reroute,
    transport,
  };
}

// .svelte-kit/output/server/chunks/shared.js
init_utils();
var INVALIDATED_PARAM = "x-sveltekit-invalidated";
var TRAILING_SLASH_PARAM = "x-sveltekit-trailing-slash";
function stringify3(data, transport) {
  const encoders = Object.fromEntries(
    Object.entries(transport).map(([k, v]) => [k, v.encode]),
  );
  return stringify(data, encoders);
}
function parse_remote_arg(string, transport) {
  if (!string) return void 0;
  const json_string = text_decoder2.decode(
    // no need to add back `=` characters, atob can handle it
    base64_decode(string.replaceAll("-", "+").replaceAll("_", "/")),
  );
  const decoders = Object.fromEntries(
    Object.entries(transport).map(([k, v]) => [k, v.decode]),
  );
  return parse(json_string, decoders);
}

// .svelte-kit/output/server/index.js
var import_cookie = __toESM(require_cookie(), 1);
var set_cookie_parser = __toESM(require_set_cookie(), 1);
var SVELTE_KIT_ASSETS = "/_svelte_kit_assets";
var ENDPOINT_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
];
var PAGE_METHODS = ["GET", "POST", "HEAD"];
function negotiate(accept, types) {
  const parts = [];
  accept.split(",").forEach((str, i) => {
    const match = /([^/ \t]+)\/([^; \t]+)[ \t]*(?:;[ \t]*q=([0-9.]+))?/.exec(
      str,
    );
    if (match) {
      const [, type, subtype, q = "1"] = match;
      parts.push({ type, subtype, q: +q, i });
    }
  });
  parts.sort((a, b) => {
    if (a.q !== b.q) {
      return b.q - a.q;
    }
    if ((a.subtype === "*") !== (b.subtype === "*")) {
      return a.subtype === "*" ? 1 : -1;
    }
    if ((a.type === "*") !== (b.type === "*")) {
      return a.type === "*" ? 1 : -1;
    }
    return a.i - b.i;
  });
  let accepted;
  let min_priority = Infinity;
  for (const mimetype of types) {
    const [type, subtype] = mimetype.split("/");
    const priority = parts.findIndex(
      (part) =>
        (part.type === type || part.type === "*") &&
        (part.subtype === subtype || part.subtype === "*"),
    );
    if (priority !== -1 && priority < min_priority) {
      accepted = mimetype;
      min_priority = priority;
    }
  }
  return accepted;
}
function is_content_type(request, ...types) {
  const type =
    request.headers.get("content-type")?.split(";", 1)[0].trim() ?? "";
  return types.includes(type.toLowerCase());
}
function is_form_content_type(request) {
  return is_content_type(
    request,
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "text/plain",
  );
}
function coalesce_to_error(err) {
  return err instanceof Error ||
    (err && /** @type {any} */ err.name && /** @type {any} */ err.message)
    ? /** @type {Error} */
      err
    : new Error(JSON.stringify(err));
}
function normalize_error(error2) {
  return (
    /** @type {import('../exports/internal/index.js').Redirect | HttpError | SvelteKitError | Error} */
    error2
  );
}
function get_status(error2) {
  return error2 instanceof HttpError || error2 instanceof SvelteKitError
    ? error2.status
    : 500;
}
function get_message(error2) {
  return error2 instanceof SvelteKitError ? error2.text : "Internal Error";
}
var escape_html_attr_dict = {
  "&": "&amp;",
  '"': "&quot;",
  // Svelte also escapes < because the escape function could be called inside a `noscript` there
  // https://github.com/sveltejs/svelte/security/advisories/GHSA-8266-84wp-wv5c
  // However, that doesn't apply in SvelteKit
};
var escape_html_dict = {
  "&": "&amp;",
  "<": "&lt;",
};
var surrogates =
  // high surrogate without paired low surrogate
  "[\\ud800-\\udbff](?![\\udc00-\\udfff])|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\udc00-\\udfff]";
var escape_html_attr_regex = new RegExp(
  `[${Object.keys(escape_html_attr_dict).join("")}]|` + surrogates,
  "g",
);
var escape_html_regex = new RegExp(
  `[${Object.keys(escape_html_dict).join("")}]|` + surrogates,
  "g",
);
function escape_html2(str, is_attr) {
  const dict = is_attr ? escape_html_attr_dict : escape_html_dict;
  const escaped_str = str.replace(
    is_attr ? escape_html_attr_regex : escape_html_regex,
    (match) => {
      if (match.length === 2) {
        return match;
      }
      return dict[match] ?? `&#${match.charCodeAt(0)};`;
    },
  );
  return escaped_str;
}
function method_not_allowed(mod, method) {
  return text(`${method} method not allowed`, {
    status: 405,
    headers: {
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
      // "The server must generate an Allow header field in a 405 status code response"
      allow: allowed_methods(mod).join(", "),
    },
  });
}
function allowed_methods(mod) {
  const allowed = ENDPOINT_METHODS.filter((method) => method in mod);
  if ("GET" in mod || "HEAD" in mod) allowed.push("HEAD");
  return allowed;
}
function get_global_name(options2) {
  return `__sveltekit_${options2.version_hash}`;
}
function static_error_page(options2, status, message) {
  let page3 = options2.templates.error({
    status,
    message: escape_html2(message),
  });
  return text(page3, {
    headers: { "content-type": "text/html; charset=utf-8" },
    status,
  });
}
async function handle_fatal_error(event, state2, options2, error2) {
  error2 = error2 instanceof HttpError ? error2 : coalesce_to_error(error2);
  const status = get_status(error2);
  const body2 = await handle_error_and_jsonify(event, state2, options2, error2);
  const type = negotiate(event.request.headers.get("accept") || "text/html", [
    "application/json",
    "text/html",
  ]);
  if (event.isDataRequest || type === "application/json") {
    return json(body2, {
      status,
    });
  }
  return static_error_page(options2, status, body2.message);
}
async function handle_error_and_jsonify(event, state2, options2, error2) {
  if (error2 instanceof HttpError) {
    return { message: "Unknown Error", ...error2.body };
  }
  const status = get_status(error2);
  const message = get_message(error2);
  return (
    (await with_request_store({ event, state: state2 }, () =>
      options2.hooks.handleError({ error: error2, event, status, message }),
    )) ?? { message }
  );
}
function redirect_response(status, location) {
  const response = new Response(void 0, {
    status,
    headers: { location },
  });
  return response;
}
function clarify_devalue_error(event, error2) {
  if (error2.path) {
    return `Data returned from \`load\` while rendering ${event.route.id} is not serializable: ${error2.message} (${error2.path}). If you need to serialize/deserialize custom types, use transport hooks: https://svelte.dev/docs/kit/hooks#Universal-hooks-transport.`;
  }
  if (error2.path === "") {
    return `Data returned from \`load\` while rendering ${event.route.id} is not a plain object`;
  }
  return error2.message;
}
function serialize_uses(node) {
  const uses = {};
  if (node.uses && node.uses.dependencies.size > 0) {
    uses.dependencies = Array.from(node.uses.dependencies);
  }
  if (node.uses && node.uses.search_params.size > 0) {
    uses.search_params = Array.from(node.uses.search_params);
  }
  if (node.uses && node.uses.params.size > 0) {
    uses.params = Array.from(node.uses.params);
  }
  if (node.uses?.parent) uses.parent = 1;
  if (node.uses?.route) uses.route = 1;
  if (node.uses?.url) uses.url = 1;
  return uses;
}
function has_prerendered_path(manifest2, pathname) {
  return (
    manifest2._.prerendered_routes.has(pathname) ||
    (pathname.at(-1) === "/" &&
      manifest2._.prerendered_routes.has(pathname.slice(0, -1)))
  );
}
function format_server_error(status, error2, event) {
  const formatted_text = `
\x1B[1;31m[${status}] ${event.request.method} ${event.url.pathname}\x1B[0m`;
  if (status === 404) {
    return formatted_text;
  }
  return `${formatted_text}
${error2.stack}`;
}
function get_node_type(node_id) {
  const parts = node_id?.split("/");
  const filename = parts?.at(-1);
  if (!filename) return "unknown";
  const dot_parts = filename.split(".");
  return dot_parts.slice(0, -1).join(".");
}
async function render_endpoint(event, event_state, mod, state2) {
  const method =
    /** @type {import('types').HttpMethod} */
    event.request.method;
  let handler = mod[method] || mod.fallback;
  if (method === "HEAD" && !mod.HEAD && mod.GET) {
    handler = mod.GET;
  }
  if (!handler) {
    return method_not_allowed(mod, method);
  }
  const prerender = mod.prerender ?? state2.prerender_default;
  if (prerender && (mod.POST || mod.PATCH || mod.PUT || mod.DELETE)) {
    throw new Error("Cannot prerender endpoints that have mutative methods");
  }
  if (
    state2.prerendering &&
    !state2.prerendering.inside_reroute &&
    !prerender
  ) {
    if (state2.depth > 0) {
      throw new Error(`${event.route.id} is not prerenderable`);
    } else {
      return new Response(void 0, { status: 204 });
    }
  }
  event_state.is_endpoint_request = true;
  try {
    const response = await with_request_store(
      { event, state: event_state },
      () =>
        handler(
          /** @type {import('@sveltejs/kit').RequestEvent<Record<string, any>>} */
          event,
        ),
    );
    if (!(response instanceof Response)) {
      throw new Error(
        `Invalid response from route ${event.url.pathname}: handler should return a Response object`,
      );
    }
    if (
      state2.prerendering &&
      (!state2.prerendering.inside_reroute || prerender)
    ) {
      const cloned = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });
      cloned.headers.set("x-sveltekit-prerender", String(prerender));
      if (state2.prerendering.inside_reroute && prerender) {
        cloned.headers.set(
          "x-sveltekit-routeid",
          encodeURI(
            /** @type {string} */
            event.route.id,
          ),
        );
        state2.prerendering.dependencies.set(event.url.pathname, {
          response: cloned,
          body: null,
        });
      } else {
        return cloned;
      }
    }
    return response;
  } catch (e3) {
    if (e3 instanceof Redirect) {
      return new Response(void 0, {
        status: e3.status,
        headers: { location: e3.location },
      });
    }
    throw e3;
  }
}
function is_endpoint_request(event) {
  const { method, headers: headers2 } = event.request;
  if (ENDPOINT_METHODS.includes(method) && !PAGE_METHODS.includes(method)) {
    return true;
  }
  if (method === "POST" && headers2.get("x-sveltekit-action") === "true")
    return false;
  const accept = event.request.headers.get("accept") ?? "*/*";
  return negotiate(accept, ["*", "text/html"]) !== "text/html";
}
function compact(arr) {
  return arr.filter(
    /** @returns {val is NonNullable<T>} */
    (val) => val != null,
  );
}
var DATA_SUFFIX = "/__data.json";
var HTML_DATA_SUFFIX = ".html__data.json";
function has_data_suffix2(pathname) {
  return pathname.endsWith(DATA_SUFFIX) || pathname.endsWith(HTML_DATA_SUFFIX);
}
function add_data_suffix2(pathname) {
  if (pathname.endsWith(".html"))
    return pathname.replace(/\.html$/, HTML_DATA_SUFFIX);
  return pathname.replace(/\/$/, "") + DATA_SUFFIX;
}
function strip_data_suffix2(pathname) {
  if (pathname.endsWith(HTML_DATA_SUFFIX)) {
    return pathname.slice(0, -HTML_DATA_SUFFIX.length) + ".html";
  }
  return pathname.slice(0, -DATA_SUFFIX.length);
}
var ROUTE_SUFFIX = "/__route.js";
function has_resolution_suffix2(pathname) {
  return pathname.endsWith(ROUTE_SUFFIX);
}
function add_resolution_suffix2(pathname) {
  return pathname.replace(/\/$/, "") + ROUTE_SUFFIX;
}
function strip_resolution_suffix2(pathname) {
  return pathname.slice(0, -ROUTE_SUFFIX.length);
}
var noop_span = {
  spanContext() {
    return noop_span_context;
  },
  setAttribute() {
    return this;
  },
  setAttributes() {
    return this;
  },
  addEvent() {
    return this;
  },
  setStatus() {
    return this;
  },
  updateName() {
    return this;
  },
  end() {
    return this;
  },
  isRecording() {
    return false;
  },
  recordException() {
    return this;
  },
  addLink() {
    return this;
  },
  addLinks() {
    return this;
  },
};
var noop_span_context = {
  traceId: "",
  spanId: "",
  traceFlags: 0,
};
async function record_span({ name, attributes, fn }) {
  {
    return fn(noop_span);
  }
}
function is_action_json_request(event) {
  const accept = negotiate(event.request.headers.get("accept") ?? "*/*", [
    "application/json",
    "text/html",
  ]);
  return accept === "application/json" && event.request.method === "POST";
}
async function handle_action_json_request(
  event,
  event_state,
  options2,
  server2,
) {
  const actions = server2?.actions;
  if (!actions) {
    const no_actions_error = new SvelteKitError(
      405,
      "Method Not Allowed",
      `POST method not allowed. No form actions exist for ${"this page"}`,
    );
    return action_json(
      {
        type: "error",
        error: await handle_error_and_jsonify(
          event,
          event_state,
          options2,
          no_actions_error,
        ),
      },
      {
        status: no_actions_error.status,
        headers: {
          // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
          // "The server must generate an Allow header field in a 405 status code response"
          allow: "GET",
        },
      },
    );
  }
  check_named_default_separate(actions);
  try {
    const data = await call_action(event, event_state, actions);
    if (BROWSER);
    if (data instanceof ActionFailure) {
      return action_json({
        type: "failure",
        status: data.status,
        // @ts-expect-error we assign a string to what is supposed to be an object. That's ok
        // because we don't use the object outside, and this way we have better code navigation
        // through knowing where the related interface is used.
        data: stringify_action_response(
          data.data,
          /** @type {string} */
          event.route.id,
          options2.hooks.transport,
        ),
      });
    } else {
      return action_json({
        type: "success",
        status: data ? 200 : 204,
        // @ts-expect-error see comment above
        data: stringify_action_response(
          data,
          /** @type {string} */
          event.route.id,
          options2.hooks.transport,
        ),
      });
    }
  } catch (e3) {
    const err = normalize_error(e3);
    if (err instanceof Redirect) {
      return action_json_redirect(err);
    }
    return action_json(
      {
        type: "error",
        error: await handle_error_and_jsonify(
          event,
          event_state,
          options2,
          check_incorrect_fail_use(err),
        ),
      },
      {
        status: get_status(err),
      },
    );
  }
}
function check_incorrect_fail_use(error2) {
  return error2 instanceof ActionFailure
    ? new Error('Cannot "throw fail()". Use "return fail()"')
    : error2;
}
function action_json_redirect(redirect) {
  return action_json({
    type: "redirect",
    status: redirect.status,
    location: redirect.location,
  });
}
function action_json(data, init2) {
  return json(data, init2);
}
function is_action_request(event) {
  return event.request.method === "POST";
}
async function handle_action_request(event, event_state, server2) {
  const actions = server2?.actions;
  if (!actions) {
    event.setHeaders({
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
      // "The server must generate an Allow header field in a 405 status code response"
      allow: "GET",
    });
    return {
      type: "error",
      error: new SvelteKitError(
        405,
        "Method Not Allowed",
        `POST method not allowed. No form actions exist for ${"this page"}`,
      ),
    };
  }
  check_named_default_separate(actions);
  try {
    const data = await call_action(event, event_state, actions);
    if (BROWSER);
    if (data instanceof ActionFailure) {
      return {
        type: "failure",
        status: data.status,
        data: data.data,
      };
    } else {
      return {
        type: "success",
        status: 200,
        // @ts-expect-error this will be removed upon serialization, so `undefined` is the same as omission
        data,
      };
    }
  } catch (e3) {
    const err = normalize_error(e3);
    if (err instanceof Redirect) {
      return {
        type: "redirect",
        status: err.status,
        location: err.location,
      };
    }
    return {
      type: "error",
      error: check_incorrect_fail_use(err),
    };
  }
}
function check_named_default_separate(actions) {
  if (actions.default && Object.keys(actions).length > 1) {
    throw new Error(
      "When using named actions, the default action cannot be used. See the docs for more info: https://svelte.dev/docs/kit/form-actions#named-actions",
    );
  }
}
async function call_action(event, event_state, actions) {
  const url = new URL(event.request.url);
  let name = "default";
  for (const param of url.searchParams) {
    if (param[0].startsWith("/")) {
      name = param[0].slice(1);
      if (name === "default") {
        throw new Error('Cannot use reserved action name "default"');
      }
      break;
    }
  }
  const action = actions[name];
  if (!action) {
    throw new SvelteKitError(
      404,
      "Not Found",
      `No action with name '${name}' found`,
    );
  }
  if (!is_form_content_type(event.request)) {
    throw new SvelteKitError(
      415,
      "Unsupported Media Type",
      `Form actions expect form-encoded data \u2014 received ${event.request.headers.get(
        "content-type",
      )}`,
    );
  }
  return record_span({
    name: "sveltekit.form_action",
    attributes: {
      "http.route": event.route.id || "unknown",
    },
    fn: async (current) => {
      const traced_event = merge_tracing(event, current);
      const result = await with_request_store(
        { event: traced_event, state: event_state },
        () => action(traced_event),
      );
      if (result instanceof ActionFailure) {
        current.setAttributes({
          "sveltekit.form_action.result.type": "failure",
          "sveltekit.form_action.result.status": result.status,
        });
      }
      return result;
    },
  });
}
function uneval_action_response(data, route_id, transport) {
  const replacer = (thing) => {
    for (const key2 in transport) {
      const encoded = transport[key2].encode(thing);
      if (encoded) {
        return `app.decode('${key2}', ${uneval(encoded, replacer)})`;
      }
    }
  };
  return try_serialize(data, (value) => uneval(value, replacer), route_id);
}
function stringify_action_response(data, route_id, transport) {
  const encoders = Object.fromEntries(
    Object.entries(transport).map(([key2, value]) => [key2, value.encode]),
  );
  return try_serialize(data, (value) => stringify(value, encoders), route_id);
}
function try_serialize(data, fn, route_id) {
  try {
    return fn(data);
  } catch (e3) {
    const error2 =
      /** @type {any} */
      e3;
    if (data instanceof Response) {
      throw new Error(
        `Data returned from action inside ${route_id} is not serializable. Form actions need to return plain objects or fail(). E.g. return { success: true } or return fail(400, { message: "invalid" });`,
      );
    }
    if ("path" in error2) {
      let message = `Data returned from action inside ${route_id} is not serializable: ${error2.message}`;
      if (error2.path !== "") message += ` (data.${error2.path})`;
      throw new Error(message);
    }
    throw error2;
  }
}
function defer() {
  let fulfil;
  let reject;
  const promise = new Promise((f, r3) => {
    fulfil = f;
    reject = r3;
  });
  return { promise, fulfil, reject };
}
function create_async_iterator() {
  let count = 0;
  const deferred2 = [defer()];
  return {
    iterate: (transform = (x) => x) => {
      return {
        [Symbol.asyncIterator]() {
          return {
            next: async () => {
              const next = await deferred2[0].promise;
              if (!next.done) {
                deferred2.shift();
                return { value: transform(next.value), done: false };
              }
              return next;
            },
          };
        },
      };
    },
    add: (promise) => {
      count += 1;
      void promise.then((value) => {
        deferred2[deferred2.length - 1].fulfil({
          value,
          done: false,
        });
        deferred2.push(defer());
        if (--count === 0) {
          deferred2[deferred2.length - 1].fulfil({ done: true });
        }
      });
    },
  };
}
function server_data_serializer(event, event_state, options2) {
  let promise_id = 1;
  let max_nodes = -1;
  const iterator = create_async_iterator();
  const global = get_global_name(options2);
  function get_replacer(index15) {
    return function replacer(thing) {
      if (typeof thing?.then === "function") {
        const id = promise_id++;
        const promise = thing
          .then(
            /** @param {any} data */
            (data) => ({ data }),
          )
          .catch(
            /** @param {any} error */
            async (error2) => ({
              error: await handle_error_and_jsonify(
                event,
                event_state,
                options2,
                error2,
              ),
            }),
          )
          .then(
            /**
             * @param {{data: any; error: any}} result
             */
            async ({ data, error: error2 }) => {
              let str;
              try {
                str = uneval(error2 ? [, error2] : [data], replacer);
              } catch {
                error2 = await handle_error_and_jsonify(
                  event,
                  event_state,
                  options2,
                  new Error(
                    `Failed to serialize promise while rendering ${event.route.id}`,
                  ),
                );
                data = void 0;
                str = uneval([, error2], replacer);
              }
              return {
                index: index15,
                str: `${global}.resolve(${id}, ${str.includes("app.decode") ? `(app) => ${str}` : `() => ${str}`})`,
              };
            },
          );
        iterator.add(promise);
        return `${global}.defer(${id})`;
      } else {
        for (const key2 in options2.hooks.transport) {
          const encoded = options2.hooks.transport[key2].encode(thing);
          if (encoded) {
            return `app.decode('${key2}', ${uneval(encoded, replacer)})`;
          }
        }
      }
    };
  }
  const strings =
    /** @type {string[]} */
    [];
  return {
    set_max_nodes(i) {
      max_nodes = i;
    },
    add_node(i, node) {
      try {
        if (!node) {
          strings[i] = "null";
          return;
        }
        const payload = {
          type: "data",
          data: node.data,
          uses: serialize_uses(node),
        };
        if (node.slash) payload.slash = node.slash;
        strings[i] = uneval(payload, get_replacer(i));
      } catch (e3) {
        e3.path = e3.path.slice(1);
        throw new Error(
          clarify_devalue_error(
            event,
            /** @type {any} */
            e3,
          ),
        );
      }
    },
    get_data(csp) {
      const open = `<script${csp.script_needs_nonce ? ` nonce="${csp.nonce}"` : ""}>`;
      const close = `<\/script>
`;
      return {
        data: `[${compact(max_nodes > -1 ? strings.slice(0, max_nodes) : strings).join(",")}]`,
        chunks:
          promise_id > 1
            ? iterator.iterate(({ index: index15, str }) => {
                if (max_nodes > -1 && index15 >= max_nodes) {
                  return "";
                }
                return open + str + close;
              })
            : null,
      };
    },
  };
}
function server_data_serializer_json(event, event_state, options2) {
  let promise_id = 1;
  const iterator = create_async_iterator();
  const reducers = {
    ...Object.fromEntries(
      Object.entries(options2.hooks.transport).map(([key2, value]) => [
        key2,
        value.encode,
      ]),
    ),
    /** @param {any} thing */
    Promise: (thing) => {
      if (typeof thing?.then !== "function") {
        return;
      }
      const id = promise_id++;
      let key2 = "data";
      const promise = thing
        .catch(
          /** @param {any} e */
          async (e3) => {
            key2 = "error";
            return handle_error_and_jsonify(
              event,
              event_state,
              options2,
              /** @type {any} */
              e3,
            );
          },
        )
        .then(
          /** @param {any} value */
          async (value) => {
            let str;
            try {
              str = stringify(value, reducers);
            } catch {
              const error2 = await handle_error_and_jsonify(
                event,
                event_state,
                options2,
                new Error(
                  `Failed to serialize promise while rendering ${event.route.id}`,
                ),
              );
              key2 = "error";
              str = stringify(error2, reducers);
            }
            return `{"type":"chunk","id":${id},"${key2}":${str}}
`;
          },
        );
      iterator.add(promise);
      return id;
    },
  };
  const strings =
    /** @type {string[]} */
    [];
  return {
    add_node(i, node) {
      try {
        if (!node) {
          strings[i] = "null";
          return;
        }
        if (node.type === "error" || node.type === "skip") {
          strings[i] = JSON.stringify(node);
          return;
        }
        strings[i] =
          `{"type":"data","data":${stringify(node.data, reducers)},"uses":${JSON.stringify(
            serialize_uses(node),
          )}${node.slash ? `,"slash":${JSON.stringify(node.slash)}` : ""}}`;
      } catch (e3) {
        e3.path = "data" + e3.path;
        throw new Error(
          clarify_devalue_error(
            event,
            /** @type {any} */
            e3,
          ),
        );
      }
    },
    get_data() {
      return {
        data: `{"type":"data","nodes":[${strings.join(",")}]}
`,
        chunks: promise_id > 1 ? iterator.iterate() : null,
      };
    },
  };
}
var NULL_BODY_STATUS = [101, 103, 204, 205, 304];
async function load_server_data({
  event,
  event_state,
  state: state2,
  node,
  parent,
}) {
  if (!node?.server) return null;
  let is_tracking = true;
  const uses = {
    dependencies: /* @__PURE__ */ new Set(),
    params: /* @__PURE__ */ new Set(),
    parent: false,
    route: false,
    url: false,
    search_params: /* @__PURE__ */ new Set(),
  };
  const load4 = node.server.load;
  const slash = node.server.trailingSlash;
  if (!load4) {
    return { type: "data", data: null, uses, slash };
  }
  const url = make_trackable(
    event.url,
    () => {
      if (is_tracking) {
        uses.url = true;
      }
    },
    (param) => {
      if (is_tracking) {
        uses.search_params.add(param);
      }
    },
  );
  if (state2.prerendering) {
    disable_search(url);
  }
  const result = await record_span({
    name: "sveltekit.load",
    attributes: {
      "sveltekit.load.node_id": node.server_id || "unknown",
      "sveltekit.load.node_type": get_node_type(node.server_id),
      "http.route": event.route.id || "unknown",
    },
    fn: async (current) => {
      const traced_event = merge_tracing(event, current);
      const result2 = await with_request_store(
        { event: traced_event, state: event_state },
        () =>
          load4.call(null, {
            ...traced_event,
            fetch: (info, init2) => {
              new URL(info instanceof Request ? info.url : info, event.url);
              return event.fetch(info, init2);
            },
            /** @param {string[]} deps */
            depends: (...deps) => {
              for (const dep of deps) {
                const { href } = new URL(dep, event.url);
                uses.dependencies.add(href);
              }
            },
            params: new Proxy(event.params, {
              get: (target, key2) => {
                if (is_tracking) {
                  uses.params.add(key2);
                }
                return (
                  /** @type {string} */
                  target[key2]
                );
              },
            }),
            parent: async () => {
              if (is_tracking) {
                uses.parent = true;
              }
              return parent();
            },
            route: new Proxy(event.route, {
              get: (target, key2) => {
                if (is_tracking) {
                  uses.route = true;
                }
                return (
                  /** @type {'id'} */
                  target[key2]
                );
              },
            }),
            url,
            untrack(fn) {
              is_tracking = false;
              try {
                return fn();
              } finally {
                is_tracking = true;
              }
            },
          }),
      );
      return result2;
    },
  });
  return {
    type: "data",
    data: result ?? null,
    uses,
    slash,
  };
}
async function load_data({
  event,
  event_state,
  fetched,
  node,
  parent,
  server_data_promise,
  state: state2,
  resolve_opts,
  csr,
}) {
  const server_data_node = await server_data_promise;
  const load4 = node?.universal?.load;
  if (!load4) {
    return server_data_node?.data ?? null;
  }
  const result = await record_span({
    name: "sveltekit.load",
    attributes: {
      "sveltekit.load.node_id": node.universal_id || "unknown",
      "sveltekit.load.node_type": get_node_type(node.universal_id),
      "http.route": event.route.id || "unknown",
    },
    fn: async (current) => {
      const traced_event = merge_tracing(event, current);
      return await with_request_store(
        { event: traced_event, state: event_state },
        () =>
          load4.call(null, {
            url: event.url,
            params: event.params,
            data: server_data_node?.data ?? null,
            route: event.route,
            fetch: create_universal_fetch(
              event,
              state2,
              fetched,
              csr,
              resolve_opts,
            ),
            setHeaders: event.setHeaders,
            depends: () => {},
            parent,
            untrack: (fn) => fn(),
            tracing: traced_event.tracing,
          }),
      );
    },
  });
  return result ?? null;
}
function create_universal_fetch(event, state2, fetched, csr, resolve_opts) {
  const universal_fetch = async (input, init2) => {
    const cloned_body =
      input instanceof Request && input.body ? input.clone().body : null;
    const cloned_headers =
      input instanceof Request && [...input.headers].length
        ? new Headers(input.headers)
        : init2?.headers;
    let response = await event.fetch(input, init2);
    const url = new URL(
      input instanceof Request ? input.url : input,
      event.url,
    );
    const same_origin = url.origin === event.url.origin;
    let dependency;
    if (same_origin) {
      if (state2.prerendering) {
        dependency = { response, body: null };
        state2.prerendering.dependencies.set(url.pathname, dependency);
      }
    } else if (url.protocol === "https:" || url.protocol === "http:") {
      const mode =
        input instanceof Request ? input.mode : (init2?.mode ?? "cors");
      if (mode === "no-cors") {
        response = new Response("", {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } else {
        const acao = response.headers.get("access-control-allow-origin");
        if (!acao || (acao !== event.url.origin && acao !== "*")) {
          throw new Error(
            `CORS error: ${acao ? "Incorrect" : "No"} 'Access-Control-Allow-Origin' header is present on the requested resource`,
          );
        }
      }
    }
    let teed_body;
    const proxy2 = new Proxy(response, {
      get(response2, key2, _receiver) {
        async function push_fetched(body2, is_b64) {
          const status_number = Number(response2.status);
          if (isNaN(status_number)) {
            throw new Error(
              `response.status is not a number. value: "${response2.status}" type: ${typeof response2.status}`,
            );
          }
          fetched.push({
            url: same_origin
              ? url.href.slice(event.url.origin.length)
              : url.href,
            method: event.request.method,
            request_body:
              /** @type {string | ArrayBufferView | undefined} */
              input instanceof Request && cloned_body
                ? await stream_to_string(cloned_body)
                : init2?.body,
            request_headers: cloned_headers,
            response_body: body2,
            response: response2,
            is_b64,
          });
        }
        if (key2 === "body") {
          if (response2.body === null) {
            return null;
          }
          if (teed_body) {
            return teed_body;
          }
          const [a, b] = response2.body.tee();
          void (async () => {
            let result = new Uint8Array();
            for await (const chunk of a) {
              const combined = new Uint8Array(result.length + chunk.length);
              combined.set(result, 0);
              combined.set(chunk, result.length);
              result = combined;
            }
            if (dependency) {
              dependency.body = new Uint8Array(result);
            }
            void push_fetched(base64_encode(result), true);
          })();
          return (teed_body = b);
        }
        if (key2 === "arrayBuffer") {
          return async () => {
            const buffer = await response2.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            if (dependency) {
              dependency.body = bytes;
            }
            if (buffer instanceof ArrayBuffer) {
              await push_fetched(base64_encode(bytes), true);
            }
            return buffer;
          };
        }
        async function text2() {
          const body2 = await response2.text();
          if (body2 === "" && NULL_BODY_STATUS.includes(response2.status)) {
            await push_fetched(void 0, false);
            return void 0;
          }
          if (!body2 || typeof body2 === "string") {
            await push_fetched(body2, false);
          }
          if (dependency) {
            dependency.body = body2;
          }
          return body2;
        }
        if (key2 === "text") {
          return text2;
        }
        if (key2 === "json") {
          return async () => {
            const body2 = await text2();
            return body2 ? JSON.parse(body2) : void 0;
          };
        }
        return Reflect.get(response2, key2, response2);
      },
    });
    if (csr) {
      const get2 = response.headers.get;
      response.headers.get = (key2) => {
        const lower = key2.toLowerCase();
        const value = get2.call(response.headers, lower);
        if (value && !lower.startsWith("x-sveltekit-")) {
          const included = resolve_opts.filterSerializedResponseHeaders(
            lower,
            value,
          );
          if (!included) {
            throw new Error(
              `Failed to get response header "${lower}" \u2014 it must be included by the \`filterSerializedResponseHeaders\` option: https://svelte.dev/docs/kit/hooks#Server-hooks-handle (at ${event.route.id})`,
            );
          }
        }
        return value;
      };
    }
    return proxy2;
  };
  return (input, init2) => {
    const response = universal_fetch(input, init2);
    response.catch(() => {});
    return response;
  };
}
async function stream_to_string(stream) {
  let result = "";
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result += text_decoder2.decode(value);
  }
  return result;
}
function hash(...values) {
  let hash2 = 5381;
  for (const value of values) {
    if (typeof value === "string") {
      let i = value.length;
      while (i) hash2 = (hash2 * 33) ^ value.charCodeAt(--i);
    } else if (ArrayBuffer.isView(value)) {
      const buffer = new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength,
      );
      let i = buffer.length;
      while (i) hash2 = (hash2 * 33) ^ buffer[--i];
    } else {
      throw new TypeError("value must be a string or TypedArray");
    }
  }
  return (hash2 >>> 0).toString(36);
}
var replacements2 = {
  "<": "\\u003C",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};
var pattern = new RegExp(`[${Object.keys(replacements2).join("")}]`, "g");
function serialize_data(fetched, filter, prerendering = false) {
  const headers2 = {};
  let cache_control = null;
  let age = null;
  let varyAny = false;
  for (const [key2, value] of fetched.response.headers) {
    if (filter(key2, value)) {
      headers2[key2] = value;
    }
    if (key2 === "cache-control") cache_control = value;
    else if (key2 === "age") age = value;
    else if (key2 === "vary" && value.trim() === "*") varyAny = true;
  }
  const payload = {
    status: fetched.response.status,
    statusText: fetched.response.statusText,
    headers: headers2,
    body: fetched.response_body,
  };
  const safe_payload = JSON.stringify(payload).replace(
    pattern,
    (match) => replacements2[match],
  );
  const attrs = [
    'type="application/json"',
    "data-sveltekit-fetched",
    `data-url="${escape_html2(fetched.url, true)}"`,
  ];
  if (fetched.is_b64) {
    attrs.push("data-b64");
  }
  if (fetched.request_headers || fetched.request_body) {
    const values = [];
    if (fetched.request_headers) {
      values.push([...new Headers(fetched.request_headers)].join(","));
    }
    if (fetched.request_body) {
      values.push(fetched.request_body);
    }
    attrs.push(`data-hash="${hash(...values)}"`);
  }
  if (!prerendering && fetched.method === "GET" && cache_control && !varyAny) {
    const match =
      /s-maxage=(\d+)/g.exec(cache_control) ??
      /max-age=(\d+)/g.exec(cache_control);
    if (match) {
      const ttl = +match[1] - +(age ?? "0");
      attrs.push(`data-ttl="${ttl}"`);
    }
  }
  return `<script ${attrs.join(" ")}>${safe_payload}<\/script>`;
}
var s = JSON.stringify;
function sha256(data) {
  if (!key[0]) precompute();
  const out = init.slice(0);
  const array2 = encode(data);
  for (let i = 0; i < array2.length; i += 16) {
    const w = array2.subarray(i, i + 16);
    let tmp;
    let a;
    let b;
    let out0 = out[0];
    let out1 = out[1];
    let out2 = out[2];
    let out3 = out[3];
    let out4 = out[4];
    let out5 = out[5];
    let out6 = out[6];
    let out7 = out[7];
    for (let i2 = 0; i2 < 64; i2++) {
      if (i2 < 16) {
        tmp = w[i2];
      } else {
        a = w[(i2 + 1) & 15];
        b = w[(i2 + 14) & 15];
        tmp = w[i2 & 15] =
          (((a >>> 7) ^ (a >>> 18) ^ (a >>> 3) ^ (a << 25) ^ (a << 14)) +
            ((b >>> 17) ^ (b >>> 19) ^ (b >>> 10) ^ (b << 15) ^ (b << 13)) +
            w[i2 & 15] +
            w[(i2 + 9) & 15]) |
          0;
      }
      tmp =
        tmp +
        out7 +
        ((out4 >>> 6) ^
          (out4 >>> 11) ^
          (out4 >>> 25) ^
          (out4 << 26) ^
          (out4 << 21) ^
          (out4 << 7)) +
        (out6 ^ (out4 & (out5 ^ out6))) +
        key[i2];
      out7 = out6;
      out6 = out5;
      out5 = out4;
      out4 = (out3 + tmp) | 0;
      out3 = out2;
      out2 = out1;
      out1 = out0;
      out0 =
        (tmp +
          ((out1 & out2) ^ (out3 & (out1 ^ out2))) +
          ((out1 >>> 2) ^
            (out1 >>> 13) ^
            (out1 >>> 22) ^
            (out1 << 30) ^
            (out1 << 19) ^
            (out1 << 10))) |
        0;
    }
    out[0] = (out[0] + out0) | 0;
    out[1] = (out[1] + out1) | 0;
    out[2] = (out[2] + out2) | 0;
    out[3] = (out[3] + out3) | 0;
    out[4] = (out[4] + out4) | 0;
    out[5] = (out[5] + out5) | 0;
    out[6] = (out[6] + out6) | 0;
    out[7] = (out[7] + out7) | 0;
  }
  const bytes = new Uint8Array(out.buffer);
  reverse_endianness(bytes);
  return btoa(String.fromCharCode(...bytes));
}
var init = new Uint32Array(8);
var key = new Uint32Array(64);
function precompute() {
  function frac(x) {
    return (x - Math.floor(x)) * 4294967296;
  }
  let prime = 2;
  for (let i = 0; i < 64; prime++) {
    let is_prime = true;
    for (let factor = 2; factor * factor <= prime; factor++) {
      if (prime % factor === 0) {
        is_prime = false;
        break;
      }
    }
    if (is_prime) {
      if (i < 8) {
        init[i] = frac(prime ** (1 / 2));
      }
      key[i] = frac(prime ** (1 / 3));
      i++;
    }
  }
}
function reverse_endianness(bytes) {
  for (let i = 0; i < bytes.length; i += 4) {
    const a = bytes[i + 0];
    const b = bytes[i + 1];
    const c2 = bytes[i + 2];
    const d = bytes[i + 3];
    bytes[i + 0] = d;
    bytes[i + 1] = c2;
    bytes[i + 2] = b;
    bytes[i + 3] = a;
  }
}
function encode(str) {
  const encoded = text_encoder2.encode(str);
  const length = encoded.length * 8;
  const size = 512 * Math.ceil((length + 65) / 512);
  const bytes = new Uint8Array(size / 8);
  bytes.set(encoded);
  bytes[encoded.length] = 128;
  reverse_endianness(bytes);
  const words = new Uint32Array(bytes.buffer);
  words[words.length - 2] = Math.floor(length / 4294967296);
  words[words.length - 1] = length;
  return words;
}
var array = new Uint8Array(16);
function generate_nonce() {
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}
var quoted = /* @__PURE__ */ new Set([
  "self",
  "unsafe-eval",
  "unsafe-hashes",
  "unsafe-inline",
  "none",
  "strict-dynamic",
  "report-sample",
  "wasm-unsafe-eval",
  "script",
]);
var crypto_pattern = /^(nonce|sha\d\d\d)-/;
var BaseProvider = class {
  /** @type {boolean} */
  #use_hashes;
  /** @type {boolean} */
  #script_needs_csp;
  /** @type {boolean} */
  #script_src_needs_csp;
  /** @type {boolean} */
  #script_src_elem_needs_csp;
  /** @type {boolean} */
  #style_needs_csp;
  /** @type {boolean} */
  #style_src_needs_csp;
  /** @type {boolean} */
  #style_src_attr_needs_csp;
  /** @type {boolean} */
  #style_src_elem_needs_csp;
  /** @type {import('types').CspDirectives} */
  #directives;
  /** @type {import('types').Csp.Source[]} */
  #script_src;
  /** @type {import('types').Csp.Source[]} */
  #script_src_elem;
  /** @type {import('types').Csp.Source[]} */
  #style_src;
  /** @type {import('types').Csp.Source[]} */
  #style_src_attr;
  /** @type {import('types').Csp.Source[]} */
  #style_src_elem;
  /** @type {string} */
  #nonce;
  /**
   * @param {boolean} use_hashes
   * @param {import('types').CspDirectives} directives
   * @param {string} nonce
   */
  constructor(use_hashes, directives, nonce) {
    this.#use_hashes = use_hashes;
    this.#directives = directives;
    const d = this.#directives;
    this.#script_src = [];
    this.#script_src_elem = [];
    this.#style_src = [];
    this.#style_src_attr = [];
    this.#style_src_elem = [];
    const effective_script_src = d["script-src"] || d["default-src"];
    const script_src_elem = d["script-src-elem"];
    const effective_style_src = d["style-src"] || d["default-src"];
    const style_src_attr = d["style-src-attr"];
    const style_src_elem = d["style-src-elem"];
    const needs_csp = (directive) =>
      !!directive && !directive.some((value) => value === "unsafe-inline");
    this.#script_src_needs_csp = needs_csp(effective_script_src);
    this.#script_src_elem_needs_csp = needs_csp(script_src_elem);
    this.#style_src_needs_csp = needs_csp(effective_style_src);
    this.#style_src_attr_needs_csp = needs_csp(style_src_attr);
    this.#style_src_elem_needs_csp = needs_csp(style_src_elem);
    this.#script_needs_csp =
      this.#script_src_needs_csp || this.#script_src_elem_needs_csp;
    this.#style_needs_csp =
      this.#style_src_needs_csp ||
      this.#style_src_attr_needs_csp ||
      this.#style_src_elem_needs_csp;
    this.script_needs_nonce = this.#script_needs_csp && !this.#use_hashes;
    this.style_needs_nonce = this.#style_needs_csp && !this.#use_hashes;
    this.#nonce = nonce;
  }
  /** @param {string} content */
  add_script(content) {
    if (!this.#script_needs_csp) return;
    const source2 = this.#use_hashes
      ? `sha256-${sha256(content)}`
      : `nonce-${this.#nonce}`;
    if (this.#script_src_needs_csp) {
      this.#script_src.push(source2);
    }
    if (this.#script_src_elem_needs_csp) {
      this.#script_src_elem.push(source2);
    }
  }
  /** @param {string} content */
  add_style(content) {
    if (!this.#style_needs_csp) return;
    const source2 = this.#use_hashes
      ? `sha256-${sha256(content)}`
      : `nonce-${this.#nonce}`;
    if (this.#style_src_needs_csp) {
      this.#style_src.push(source2);
    }
    if (this.#style_src_attr_needs_csp) {
      this.#style_src_attr.push(source2);
    }
    if (this.#style_src_elem_needs_csp) {
      const sha256_empty_comment_hash =
        "sha256-9OlNO0DNEeaVzHL4RZwCLsBHA8WBQ8toBp/4F5XV2nc=";
      const d = this.#directives;
      if (
        d["style-src-elem"] &&
        !d["style-src-elem"].includes(sha256_empty_comment_hash) &&
        !this.#style_src_elem.includes(sha256_empty_comment_hash)
      ) {
        this.#style_src_elem.push(sha256_empty_comment_hash);
      }
      if (source2 !== sha256_empty_comment_hash) {
        this.#style_src_elem.push(source2);
      }
    }
  }
  /**
   * @param {boolean} [is_meta]
   */
  get_header(is_meta = false) {
    const header = [];
    const directives = { ...this.#directives };
    if (this.#style_src.length > 0) {
      directives["style-src"] = [
        ...(directives["style-src"] || directives["default-src"] || []),
        ...this.#style_src,
      ];
    }
    if (this.#style_src_attr.length > 0) {
      directives["style-src-attr"] = [
        ...(directives["style-src-attr"] || []),
        ...this.#style_src_attr,
      ];
    }
    if (this.#style_src_elem.length > 0) {
      directives["style-src-elem"] = [
        ...(directives["style-src-elem"] || []),
        ...this.#style_src_elem,
      ];
    }
    if (this.#script_src.length > 0) {
      directives["script-src"] = [
        ...(directives["script-src"] || directives["default-src"] || []),
        ...this.#script_src,
      ];
    }
    if (this.#script_src_elem.length > 0) {
      directives["script-src-elem"] = [
        ...(directives["script-src-elem"] || []),
        ...this.#script_src_elem,
      ];
    }
    for (const key2 in directives) {
      if (
        is_meta &&
        (key2 === "frame-ancestors" ||
          key2 === "report-uri" ||
          key2 === "sandbox")
      ) {
        continue;
      }
      const value =
        /** @type {string[] | true} */
        directives[key2];
      if (!value) continue;
      const directive = [key2];
      if (Array.isArray(value)) {
        value.forEach((value2) => {
          if (quoted.has(value2) || crypto_pattern.test(value2)) {
            directive.push(`'${value2}'`);
          } else {
            directive.push(value2);
          }
        });
      }
      header.push(directive.join(" "));
    }
    return header.join("; ");
  }
};
var CspProvider = class extends BaseProvider {
  get_meta() {
    const content = this.get_header(true);
    if (!content) {
      return;
    }
    return `<meta http-equiv="content-security-policy" content="${escape_html2(content, true)}">`;
  }
};
var CspReportOnlyProvider = class extends BaseProvider {
  /**
   * @param {boolean} use_hashes
   * @param {import('types').CspDirectives} directives
   * @param {string} nonce
   */
  constructor(use_hashes, directives, nonce) {
    super(use_hashes, directives, nonce);
    if (Object.values(directives).filter((v) => !!v).length > 0) {
      const has_report_to = directives["report-to"]?.length ?? 0 > 0;
      const has_report_uri = directives["report-uri"]?.length ?? 0 > 0;
      if (!has_report_to && !has_report_uri) {
        throw Error(
          "`content-security-policy-report-only` must be specified with either the `report-to` or `report-uri` directives, or both",
        );
      }
    }
  }
};
var Csp = class {
  /** @readonly */
  nonce = generate_nonce();
  /** @type {CspProvider} */
  csp_provider;
  /** @type {CspReportOnlyProvider} */
  report_only_provider;
  /**
   * @param {import('./types.js').CspConfig} config
   * @param {import('./types.js').CspOpts} opts
   */
  constructor({ mode, directives, reportOnly }, { prerender }) {
    const use_hashes = mode === "hash" || (mode === "auto" && prerender);
    this.csp_provider = new CspProvider(use_hashes, directives, this.nonce);
    this.report_only_provider = new CspReportOnlyProvider(
      use_hashes,
      reportOnly,
      this.nonce,
    );
  }
  get script_needs_nonce() {
    return (
      this.csp_provider.script_needs_nonce ||
      this.report_only_provider.script_needs_nonce
    );
  }
  get style_needs_nonce() {
    return (
      this.csp_provider.style_needs_nonce ||
      this.report_only_provider.style_needs_nonce
    );
  }
  /** @param {string} content */
  add_script(content) {
    this.csp_provider.add_script(content);
    this.report_only_provider.add_script(content);
  }
  /** @param {string} content */
  add_style(content) {
    this.csp_provider.add_style(content);
    this.report_only_provider.add_style(content);
  }
};
function exec(match, params, matchers) {
  const result = {};
  const values = match.slice(1);
  const values_needing_match = values.filter((value) => value !== void 0);
  let buffered = 0;
  for (let i = 0; i < params.length; i += 1) {
    const param = params[i];
    let value = values[i - buffered];
    if (param.chained && param.rest && buffered) {
      value = values
        .slice(i - buffered, i + 1)
        .filter((s22) => s22)
        .join("/");
      buffered = 0;
    }
    if (value === void 0) {
      if (param.rest) result[param.name] = "";
      continue;
    }
    if (!param.matcher || matchers[param.matcher](value)) {
      result[param.name] = value;
      const next_param = params[i + 1];
      const next_value = values[i + 1];
      if (
        next_param &&
        !next_param.rest &&
        next_param.optional &&
        next_value &&
        param.chained
      ) {
        buffered = 0;
      }
      if (
        !next_param &&
        !next_value &&
        Object.keys(result).length === values_needing_match.length
      ) {
        buffered = 0;
      }
      continue;
    }
    if (param.optional && param.chained) {
      buffered++;
      continue;
    }
    return;
  }
  if (buffered) return;
  return result;
}
function generate_route_object(route, url, manifest2) {
  const { errors, layouts, leaf } = route;
  const nodes = [...errors, ...layouts.map((l) => l?.[1]), leaf[1]]
    .filter((n2) => typeof n2 === "number")
    .map(
      (n2) =>
        `'${n2}': () => ${create_client_import(manifest2._.client.nodes?.[n2], url)}`,
    )
    .join(",\n		");
  return [
    `{
	id: ${s(route.id)}`,
    `errors: ${s(route.errors)}`,
    `layouts: ${s(route.layouts)}`,
    `leaf: ${s(route.leaf)}`,
    `nodes: {
		${nodes}
	}
}`,
  ].join(",\n	");
}
function create_client_import(import_path, url) {
  if (!import_path) return "Promise.resolve({})";
  if (import_path[0] === "/") {
    return `import('${import_path}')`;
  }
  if (assets !== "") {
    return `import('${assets}/${import_path}')`;
  }
  let path = get_relative_path(url.pathname, `${base}/${import_path}`);
  if (path[0] !== ".") path = `./${path}`;
  return `import('${path}')`;
}
async function resolve_route(resolved_path, url, manifest2) {
  if (!manifest2._.client.routes) {
    return text("Server-side route resolution disabled", { status: 400 });
  }
  let route = null;
  let params = {};
  const matchers = await manifest2._.matchers();
  for (const candidate of manifest2._.client.routes) {
    const match = candidate.pattern.exec(resolved_path);
    if (!match) continue;
    const matched = exec(match, candidate.params, matchers);
    if (matched) {
      route = candidate;
      params = decode_params(matched);
      break;
    }
  }
  return create_server_routing_response(route, params, url, manifest2).response;
}
function create_server_routing_response(route, params, url, manifest2) {
  const headers2 = new Headers({
    "content-type": "application/javascript; charset=utf-8",
  });
  if (route) {
    const csr_route = generate_route_object(route, url, manifest2);
    const body2 = `${create_css_import(route, url, manifest2)}
export const route = ${csr_route}; export const params = ${JSON.stringify(params)};`;
    return { response: text(body2, { headers: headers2 }), body: body2 };
  } else {
    return { response: text("", { headers: headers2 }), body: "" };
  }
}
function create_css_import(route, url, manifest2) {
  const { errors, layouts, leaf } = route;
  let css = "";
  for (const node of [...errors, ...layouts.map((l) => l?.[1]), leaf[1]]) {
    if (typeof node !== "number") continue;
    const node_css = manifest2._.client.css?.[node];
    for (const css_path of node_css ?? []) {
      css += `'${assets || base}/${css_path}',`;
    }
  }
  if (!css) return "";
  return `${create_client_import(
    /** @type {string} */
    manifest2._.client.start,
    url,
  )}.then(x => x.load_css([${css}]));`;
}
var updated = {
  ...readable(false),
  check: () => false,
};
async function render_response({
  branch: branch2,
  fetched,
  options: options2,
  manifest: manifest2,
  state: state2,
  page_config,
  status,
  error: error2 = null,
  event,
  event_state,
  resolve_opts,
  action_result,
  data_serializer,
}) {
  if (state2.prerendering) {
    if (options2.csp.mode === "nonce") {
      throw new Error(
        'Cannot use prerendering if config.kit.csp.mode === "nonce"',
      );
    }
    if (options2.app_template_contains_nonce) {
      throw new Error(
        "Cannot use prerendering if page template contains %sveltekit.nonce%",
      );
    }
  }
  const { client } = manifest2._;
  const modulepreloads = new Set(client.imports);
  const stylesheets15 = new Set(client.stylesheets);
  const fonts15 = new Set(client.fonts);
  const link_headers = /* @__PURE__ */ new Set();
  const link_tags = /* @__PURE__ */ new Set();
  const inline_styles = /* @__PURE__ */ new Map();
  let rendered;
  const form_value =
    action_result?.type === "success" || action_result?.type === "failure"
      ? (action_result.data ?? null)
      : null;
  let base$1 = base;
  let assets$1 = assets;
  let base_expression = s(base);
  {
    if (!state2.prerendering?.fallback) {
      const segments = event.url.pathname
        .slice(base.length)
        .split("/")
        .slice(2);
      base$1 = segments.map(() => "..").join("/") || ".";
      base_expression = `new URL(${s(base$1)}, location).pathname.slice(0, -1)`;
      if (!assets || (assets[0] === "/" && assets !== SVELTE_KIT_ASSETS)) {
        assets$1 = base$1;
      }
    } else if (options2.hash_routing) {
      base_expression = "new URL('.', location).pathname.slice(0, -1)";
    }
  }
  if (page_config.ssr) {
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        updated,
      },
      constructors: await Promise.all(
        branch2.map(({ node }) => {
          if (!node.component) {
            throw new Error(
              `Missing +page.svelte component for route ${event.route.id}`,
            );
          }
          return node.component();
        }),
      ),
      form: form_value,
    };
    let data2 = {};
    for (let i = 0; i < branch2.length; i += 1) {
      data2 = { ...data2, ...branch2[i].data };
      props[`data_${i}`] = data2;
    }
    props.page = {
      error: error2,
      params:
        /** @type {Record<string, any>} */
        event.params,
      route: event.route,
      status,
      url: event.url,
      data: data2,
      form: form_value,
      state: {},
    };
    override({ base: base$1, assets: assets$1 });
    const render_opts = {
      context: /* @__PURE__ */ new Map([
        [
          "__request__",
          {
            page: props.page,
          },
        ],
      ]),
    };
    {
      try {
        rendered = with_request_store({ event, state: event_state }, () =>
          options2.root.render(props, render_opts),
        );
      } finally {
        reset();
      }
    }
    for (const { node } of branch2) {
      for (const url of node.imports) modulepreloads.add(url);
      for (const url of node.stylesheets) stylesheets15.add(url);
      for (const url of node.fonts) fonts15.add(url);
      if (node.inline_styles && !client.inline) {
        Object.entries(await node.inline_styles()).forEach(([k, v]) =>
          inline_styles.set(k, v),
        );
      }
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  let head = "";
  let body2 = rendered.html;
  const csp = new Csp(options2.csp, {
    prerender: !!state2.prerendering,
  });
  const prefixed = (path) => {
    if (path.startsWith("/")) {
      return base + path;
    }
    return `${assets$1}/${path}`;
  };
  const style = client.inline
    ? client.inline?.style
    : Array.from(inline_styles.values()).join("\n");
  if (style) {
    const attributes = [];
    if (csp.style_needs_nonce) attributes.push(` nonce="${csp.nonce}"`);
    csp.add_style(style);
    head += `
	<style${attributes.join("")}>${style}</style>`;
  }
  for (const dep of stylesheets15) {
    const path = prefixed(dep);
    const attributes = ['rel="stylesheet"'];
    if (inline_styles.has(dep)) {
      attributes.push("disabled", 'media="(max-width: 0)"');
    } else {
      if (resolve_opts.preload({ type: "css", path })) {
        link_headers.add(
          `<${encodeURI(path)}>; rel="preload"; as="style"; nopush`,
        );
      }
    }
    head += `
		<link href="${path}" ${attributes.join(" ")}>`;
  }
  for (const dep of fonts15) {
    const path = prefixed(dep);
    if (resolve_opts.preload({ type: "font", path })) {
      const ext = dep.slice(dep.lastIndexOf(".") + 1);
      link_tags.add(
        `<link rel="preload" as="font" type="font/${ext}" href="${path}" crossorigin>`,
      );
      link_headers.add(
        `<${encodeURI(path)}>; rel="preload"; as="font"; type="font/${ext}"; crossorigin; nopush`,
      );
    }
  }
  const global = get_global_name(options2);
  const { data, chunks } = data_serializer.get_data(csp);
  if (page_config.ssr && page_config.csr) {
    body2 += `
			${fetched
        .map((item) =>
          serialize_data(
            item,
            resolve_opts.filterSerializedResponseHeaders,
            !!state2.prerendering,
          ),
        )
        .join("\n			")}`;
  }
  if (page_config.csr) {
    const route =
      manifest2._.client.routes?.find((r3) => r3.id === event.route.id) ?? null;
    if (client.uses_env_dynamic_public && state2.prerendering) {
      modulepreloads.add(`${app_dir}/env.js`);
    }
    if (!client.inline) {
      const included_modulepreloads = Array.from(modulepreloads, (dep) =>
        prefixed(dep),
      ).filter((path) => resolve_opts.preload({ type: "js", path }));
      for (const path of included_modulepreloads) {
        link_headers.add(`<${encodeURI(path)}>; rel="modulepreload"; nopush`);
        if (options2.preload_strategy !== "modulepreload") {
          head += `
		<link rel="preload" as="script" crossorigin="anonymous" href="${path}">`;
        } else {
          link_tags.add(`<link rel="modulepreload" href="${path}">`);
        }
      }
    }
    if (state2.prerendering && link_tags.size > 0) {
      head += Array.from(link_tags)
        .map(
          (tag) => `
		${tag}`,
        )
        .join("");
    }
    if (
      manifest2._.client.routes &&
      state2.prerendering &&
      !state2.prerendering.fallback
    ) {
      const pathname = add_resolution_suffix2(event.url.pathname);
      state2.prerendering.dependencies.set(
        pathname,
        create_server_routing_response(
          route,
          event.params,
          new URL(pathname, event.url),
          manifest2,
        ),
      );
    }
    const blocks = [];
    const load_env_eagerly =
      client.uses_env_dynamic_public && state2.prerendering;
    const properties = [`base: ${base_expression}`];
    if (assets) {
      properties.push(`assets: ${s(assets)}`);
    }
    if (client.uses_env_dynamic_public) {
      properties.push(`env: ${load_env_eagerly ? "null" : s(public_env)}`);
    }
    if (chunks) {
      blocks.push("const deferred = new Map();");
      properties.push(`defer: (id) => new Promise((fulfil, reject) => {
							deferred.set(id, { fulfil, reject });
						})`);
      let app_declaration = "";
      if (Object.keys(options2.hooks.transport).length > 0) {
        if (client.inline) {
          app_declaration = `const app = __sveltekit_${options2.version_hash}.app.app;`;
        } else if (client.app) {
          app_declaration = `const app = await import(${s(prefixed(client.app))});`;
        } else {
          app_declaration = `const { app } = await import(${s(prefixed(client.start))});`;
        }
      }
      const prelude = app_declaration
        ? `${app_declaration}
							const [data, error] = fn(app);`
        : `const [data, error] = fn();`;
      properties.push(`resolve: async (id, fn) => {
							${prelude}

							const try_to_resolve = () => {
								if (!deferred.has(id)) {
									setTimeout(try_to_resolve, 0);
									return;
								}
								const { fulfil, reject } = deferred.get(id);
								deferred.delete(id);
								if (error) reject(error);
								else fulfil(data);
							}
							try_to_resolve();
						}`);
    }
    blocks.push(`${global} = {
						${properties.join(",\n						")}
					};`);
    const args = ["element"];
    blocks.push("const element = document.currentScript.parentElement;");
    if (page_config.ssr) {
      const serialized = { form: "null", error: "null" };
      if (form_value) {
        serialized.form = uneval_action_response(
          form_value,
          /** @type {string} */
          event.route.id,
          options2.hooks.transport,
        );
      }
      if (error2) {
        serialized.error = uneval(error2);
      }
      const hydrate2 = [
        `node_ids: [${branch2.map(({ node }) => node.index).join(", ")}]`,
        `data: ${data}`,
        `form: ${serialized.form}`,
        `error: ${serialized.error}`,
      ];
      if (status !== 200) {
        hydrate2.push(`status: ${status}`);
      }
      if (manifest2._.client.routes) {
        if (route) {
          const stringified = generate_route_object(
            route,
            event.url,
            manifest2,
          ).replaceAll("\n", "\n							");
          hydrate2.push(
            `params: ${uneval(event.params)}`,
            `server_route: ${stringified}`,
          );
        }
      } else if (options2.embedded) {
        hydrate2.push(
          `params: ${uneval(event.params)}`,
          `route: ${s(event.route)}`,
        );
      }
      const indent = "	".repeat(load_env_eagerly ? 7 : 6);
      args.push(`{
${indent}	${hydrate2.join(`,
${indent}	`)}
${indent}}`);
    }
    const { remote_data } = event_state;
    let serialized_remote_data = "";
    if (remote_data) {
      const remote = {};
      for (const key2 in remote_data) {
        remote[key2] = await remote_data[key2];
      }
      const replacer = (thing) => {
        for (const key2 in options2.hooks.transport) {
          const encoded = options2.hooks.transport[key2].encode(thing);
          if (encoded) {
            return `app.decode('${key2}', ${uneval(encoded, replacer)})`;
          }
        }
      };
      serialized_remote_data = `${global}.data = ${uneval(remote, replacer)};

						`;
    }
    const boot = client.inline
      ? `${client.inline.script}

					${serialized_remote_data}${global}.app.start(${args.join(", ")});`
      : client.app
        ? `Promise.all([
						import(${s(prefixed(client.start))}),
						import(${s(prefixed(client.app))})
					]).then(([kit, app]) => {
						${serialized_remote_data}kit.start(app, ${args.join(", ")});
					});`
        : `import(${s(prefixed(client.start))}).then((app) => {
						${serialized_remote_data}app.start(${args.join(", ")})
					});`;
    if (load_env_eagerly) {
      blocks.push(`import(${s(`${base$1}/${app_dir}/env.js`)}).then(({ env }) => {
						${global}.env = env;

						${boot.replace(/\n/g, "\n	")}
					});`);
    } else {
      blocks.push(boot);
    }
    if (options2.service_worker) {
      let opts = "";
      if (options2.service_worker_options != null) {
        const service_worker_options = { ...options2.service_worker_options };
        opts = `, ${s(service_worker_options)}`;
      }
      blocks.push(`if ('serviceWorker' in navigator) {
						addEventListener('load', function () {
							navigator.serviceWorker.register('${prefixed("service-worker.js")}'${opts});
						});
					}`);
    }
    const init_app = `
				{
					${blocks.join("\n\n					")}
				}
			`;
    csp.add_script(init_app);
    body2 += `
			<script${csp.script_needs_nonce ? ` nonce="${csp.nonce}"` : ""}>${init_app}<\/script>
		`;
  }
  const headers2 = new Headers({
    "x-sveltekit-page": "true",
    "content-type": "text/html",
  });
  if (state2.prerendering) {
    const http_equiv = [];
    const csp_headers = csp.csp_provider.get_meta();
    if (csp_headers) {
      http_equiv.push(csp_headers);
    }
    if (state2.prerendering.cache) {
      http_equiv.push(
        `<meta http-equiv="cache-control" content="${state2.prerendering.cache}">`,
      );
    }
    if (http_equiv.length > 0) {
      head = http_equiv.join("\n") + head;
    }
  } else {
    const csp_header = csp.csp_provider.get_header();
    if (csp_header) {
      headers2.set("content-security-policy", csp_header);
    }
    const report_only_header = csp.report_only_provider.get_header();
    if (report_only_header) {
      headers2.set("content-security-policy-report-only", report_only_header);
    }
    if (link_headers.size) {
      headers2.set("link", Array.from(link_headers).join(", "));
    }
  }
  head += rendered.head;
  const html = options2.templates.app({
    head,
    body: body2,
    assets: assets$1,
    nonce:
      /** @type {string} */
      csp.nonce,
    env: public_env,
  });
  const transformed =
    (await resolve_opts.transformPageChunk({
      html,
      done: true,
    })) || "";
  if (!chunks) {
    headers2.set("etag", `"${hash(transformed)}"`);
  }
  return !chunks
    ? text(transformed, {
        status,
        headers: headers2,
      })
    : new Response(
        new ReadableStream({
          async start(controller2) {
            controller2.enqueue(text_encoder2.encode(transformed + "\n"));
            for await (const chunk of chunks) {
              controller2.enqueue(text_encoder2.encode(chunk));
            }
            controller2.close();
          },
          type: "bytes",
        }),
        {
          headers: headers2,
        },
      );
}
var PageNodes = class {
  data;
  /**
   * @param {Array<import('types').SSRNode | undefined>} nodes
   */
  constructor(nodes) {
    this.data = nodes;
  }
  layouts() {
    return this.data.slice(0, -1);
  }
  page() {
    return this.data.at(-1);
  }
  validate() {
    for (const layout of this.layouts()) {
      if (layout) {
        validate_layout_server_exports(
          layout.server,
          /** @type {string} */
          layout.server_id,
        );
        validate_layout_exports(
          layout.universal,
          /** @type {string} */
          layout.universal_id,
        );
      }
    }
    const page3 = this.page();
    if (page3) {
      validate_page_server_exports(
        page3.server,
        /** @type {string} */
        page3.server_id,
      );
      validate_page_exports(
        page3.universal,
        /** @type {string} */
        page3.universal_id,
      );
    }
  }
  /**
   * @template {'prerender' | 'ssr' | 'csr' | 'trailingSlash'} Option
   * @param {Option} option
   * @returns {Value | undefined}
   */
  #get_option(option) {
    return this.data.reduce(
      (value, node) => {
        return node?.universal?.[option] ?? node?.server?.[option] ?? value;
      },
      /** @type {Value | undefined} */
      void 0,
    );
  }
  csr() {
    return this.#get_option("csr") ?? true;
  }
  ssr() {
    return this.#get_option("ssr") ?? true;
  }
  prerender() {
    return this.#get_option("prerender") ?? false;
  }
  trailing_slash() {
    return this.#get_option("trailingSlash") ?? "never";
  }
  get_config() {
    let current = {};
    for (const node of this.data) {
      if (!node?.universal?.config && !node?.server?.config) continue;
      current = {
        ...current,
        // TODO: should we override the server config value with the universal value similar to other page options?
        ...node?.universal?.config,
        ...node?.server?.config,
      };
    }
    return Object.keys(current).length ? current : void 0;
  }
  should_prerender_data() {
    return this.data.some(
      // prerender in case of trailingSlash because the client retrieves that value from the server
      (node) => node?.server?.load || node?.server?.trailingSlash !== void 0,
    );
  }
};
async function respond_with_error({
  event,
  event_state,
  options: options2,
  manifest: manifest2,
  state: state2,
  status,
  error: error2,
  resolve_opts,
}) {
  if (event.request.headers.get("x-sveltekit-error")) {
    return static_error_page(
      options2,
      status,
      /** @type {Error} */
      error2.message,
    );
  }
  const fetched = [];
  try {
    const branch2 = [];
    const default_layout = await manifest2._.nodes[0]();
    const nodes = new PageNodes([default_layout]);
    const ssr = nodes.ssr();
    const csr = nodes.csr();
    const data_serializer = server_data_serializer(
      event,
      event_state,
      options2,
    );
    if (ssr) {
      state2.error = true;
      const server_data_promise = load_server_data({
        event,
        event_state,
        state: state2,
        node: default_layout,
        // eslint-disable-next-line @typescript-eslint/require-await
        parent: async () => ({}),
      });
      const server_data = await server_data_promise;
      data_serializer.add_node(0, server_data);
      const data = await load_data({
        event,
        event_state,
        fetched,
        node: default_layout,
        // eslint-disable-next-line @typescript-eslint/require-await
        parent: async () => ({}),
        resolve_opts,
        server_data_promise,
        state: state2,
        csr,
      });
      branch2.push(
        {
          node: default_layout,
          server_data,
          data,
        },
        {
          node: await manifest2._.nodes[1](),
          // 1 is always the root error
          data: null,
          server_data: null,
        },
      );
    }
    return await render_response({
      options: options2,
      manifest: manifest2,
      state: state2,
      page_config: {
        ssr,
        csr,
      },
      status,
      error: await handle_error_and_jsonify(
        event,
        event_state,
        options2,
        error2,
      ),
      branch: branch2,
      fetched,
      event,
      event_state,
      resolve_opts,
      data_serializer,
    });
  } catch (e3) {
    if (e3 instanceof Redirect) {
      return redirect_response(e3.status, e3.location);
    }
    return static_error_page(
      options2,
      get_status(e3),
      (await handle_error_and_jsonify(event, event_state, options2, e3))
        .message,
    );
  }
}
async function handle_remote_call(event, state2, options2, manifest2, id) {
  return record_span({
    name: "sveltekit.remote.call",
    attributes: {},
    fn: (current) => {
      const traced_event = merge_tracing(event, current);
      return with_request_store({ event: traced_event, state: state2 }, () =>
        handle_remote_call_internal(
          traced_event,
          state2,
          options2,
          manifest2,
          id,
        ),
      );
    },
  });
}
async function handle_remote_call_internal(
  event,
  state2,
  options2,
  manifest2,
  id,
) {
  const [hash2, name, prerender_args] = id.split("/");
  const remotes = manifest2._.remotes;
  if (!remotes[hash2]) error(404);
  const module = await remotes[hash2]();
  const fn = module.default[name];
  if (!fn) error(404);
  const info = fn.__;
  const transport = options2.hooks.transport;
  event.tracing.current.setAttributes({
    "sveltekit.remote.call.type": info.type,
    "sveltekit.remote.call.name": info.name,
  });
  let form_client_refreshes;
  try {
    if (info.type === "query_batch") {
      if (event.request.method !== "POST") {
        throw new SvelteKitError(
          405,
          "Method Not Allowed",
          `\`query.batch\` functions must be invoked via POST request, not ${event.request.method}`,
        );
      }
      const { payloads } = await event.request.json();
      const args = payloads.map((payload2) =>
        parse_remote_arg(payload2, transport),
      );
      const get_result = await with_request_store(
        { event, state: state2 },
        () => info.run(args),
      );
      const results = await Promise.all(
        args.map(async (arg, i) => {
          try {
            return { type: "result", data: get_result(arg, i) };
          } catch (error2) {
            return {
              type: "error",
              error: await handle_error_and_jsonify(
                event,
                state2,
                options2,
                error2,
              ),
              status:
                error2 instanceof HttpError || error2 instanceof SvelteKitError
                  ? error2.status
                  : 500,
            };
          }
        }),
      );
      return json(
        /** @type {RemoteFunctionResponse} */
        {
          type: "result",
          result: stringify3(results, transport),
        },
      );
    }
    if (info.type === "form") {
      if (event.request.method !== "POST") {
        throw new SvelteKitError(
          405,
          "Method Not Allowed",
          `\`form\` functions must be invoked via POST request, not ${event.request.method}`,
        );
      }
      if (!is_form_content_type(event.request)) {
        throw new SvelteKitError(
          415,
          "Unsupported Media Type",
          `\`form\` functions expect form-encoded data \u2014 received ${event.request.headers.get(
            "content-type",
          )}`,
        );
      }
      const form_data = await event.request.formData();
      form_client_refreshes =
        /** @type {string[]} */
        JSON.parse(
          /** @type {string} */
          form_data.get("sveltekit:remote_refreshes") ?? "[]",
        );
      form_data.delete("sveltekit:remote_refreshes");
      const fn2 = info.fn;
      const data2 = await with_request_store({ event, state: state2 }, () =>
        fn2(form_data),
      );
      return json(
        /** @type {RemoteFunctionResponse} */
        {
          type: "result",
          result: stringify3(data2, { ...transport, File: file_transport }),
          refreshes: data2.issues
            ? {}
            : await serialize_refreshes(form_client_refreshes),
        },
      );
    }
    if (info.type === "command") {
      const { payload: payload2, refreshes } = await event.request.json();
      const arg = parse_remote_arg(payload2, transport);
      const data2 = await with_request_store({ event, state: state2 }, () =>
        fn(arg),
      );
      return json(
        /** @type {RemoteFunctionResponse} */
        {
          type: "result",
          result: stringify3(data2, transport),
          refreshes: await serialize_refreshes(refreshes),
        },
      );
    }
    const payload =
      info.type === "prerender"
        ? prerender_args
        : /** @type {string} */
          // new URL(...) necessary because we're hiding the URL from the user in the event object
          new URL(event.request.url).searchParams.get("payload");
    const data = await with_request_store({ event, state: state2 }, () =>
      fn(parse_remote_arg(payload, transport)),
    );
    return json(
      /** @type {RemoteFunctionResponse} */
      {
        type: "result",
        result: stringify3(data, transport),
      },
    );
  } catch (error2) {
    if (error2 instanceof Redirect) {
      return json(
        /** @type {RemoteFunctionResponse} */
        {
          type: "redirect",
          location: error2.location,
          refreshes: await serialize_refreshes(form_client_refreshes ?? []),
        },
      );
    }
    const status =
      error2 instanceof HttpError || error2 instanceof SvelteKitError
        ? error2.status
        : 500;
    return json(
      /** @type {RemoteFunctionResponse} */
      {
        type: "error",
        error: await handle_error_and_jsonify(event, state2, options2, error2),
        status,
      },
      {
        // By setting a non-200 during prerendering we fail the prerender process (unless handleHttpError handles it).
        // Errors at runtime will be passed to the client and are handled there
        status: state2.prerendering ? status : void 0,
        headers: {
          "cache-control": "private, no-store",
        },
      },
    );
  }
  async function serialize_refreshes(client_refreshes) {
    const refreshes = state2.refreshes ?? {};
    for (const key2 of client_refreshes) {
      if (refreshes[key2] !== void 0) continue;
      const [hash3, name2, payload] = key2.split("/");
      const loader = manifest2._.remotes[hash3];
      const fn2 = (await loader?.())?.default?.[name2];
      if (!fn2) error(400, "Bad Request");
      refreshes[key2] = with_request_store({ event, state: state2 }, () =>
        fn2(parse_remote_arg(payload, transport)),
      );
    }
    if (Object.keys(refreshes).length === 0) {
      return void 0;
    }
    return stringify3(
      Object.fromEntries(
        await Promise.all(
          Object.entries(refreshes).map(async ([key2, promise]) => [
            key2,
            await promise,
          ]),
        ),
      ),
      transport,
    );
  }
}
async function handle_remote_form_post(event, state2, manifest2, id) {
  return record_span({
    name: "sveltekit.remote.form.post",
    attributes: {},
    fn: (current) => {
      const traced_event = merge_tracing(event, current);
      return with_request_store({ event: traced_event, state: state2 }, () =>
        handle_remote_form_post_internal(traced_event, state2, manifest2, id),
      );
    },
  });
}
async function handle_remote_form_post_internal(event, state2, manifest2, id) {
  const [hash2, name, action_id] = id.split("/");
  const remotes = manifest2._.remotes;
  const module = await remotes[hash2]?.();
  let form =
    /** @type {RemoteForm<any, any>} */
    module?.default[name];
  if (!form) {
    event.setHeaders({
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
      // "The server must generate an Allow header field in a 405 status code response"
      allow: "GET",
    });
    return {
      type: "error",
      error: new SvelteKitError(
        405,
        "Method Not Allowed",
        `POST method not allowed. No form actions exist for ${"this page"}`,
      ),
    };
  }
  if (action_id) {
    form = with_request_store({ event, state: state2 }, () =>
      form.for(JSON.parse(action_id)),
    );
  }
  try {
    const form_data = await event.request.formData();
    const fn =
      /** @type {RemoteInfo & { type: 'form' }} */
      /** @type {any} */
      form.__.fn;
    await with_request_store({ event, state: state2 }, () => fn(form_data));
    return {
      type: "success",
      status: 200,
    };
  } catch (e3) {
    const err = normalize_error(e3);
    if (err instanceof Redirect) {
      return {
        type: "redirect",
        status: err.status,
        location: err.location,
      };
    }
    return {
      type: "error",
      error: check_incorrect_fail_use(err),
    };
  }
}
function get_remote_id(url) {
  return (
    url.pathname.startsWith(`${base}/${app_dir}/remote/`) &&
    url.pathname.replace(`${base}/${app_dir}/remote/`, "")
  );
}
function get_remote_action(url) {
  return url.searchParams.get("/remote");
}
var MAX_DEPTH = 10;
async function render_page(
  event,
  event_state,
  page3,
  options2,
  manifest2,
  state2,
  nodes,
  resolve_opts,
) {
  if (state2.depth > MAX_DEPTH) {
    return text(`Not found: ${event.url.pathname}`, {
      status: 404,
      // TODO in some cases this should be 500. not sure how to differentiate
    });
  }
  if (is_action_json_request(event)) {
    const node = await manifest2._.nodes[page3.leaf]();
    return handle_action_json_request(
      event,
      event_state,
      options2,
      node?.server,
    );
  }
  try {
    const leaf_node =
      /** @type {import('types').SSRNode} */
      nodes.page();
    let status = 200;
    let action_result = void 0;
    if (is_action_request(event)) {
      const remote_id = get_remote_action(event.url);
      if (remote_id) {
        action_result = await handle_remote_form_post(
          event,
          event_state,
          manifest2,
          remote_id,
        );
      } else {
        action_result = await handle_action_request(
          event,
          event_state,
          leaf_node.server,
        );
      }
      if (action_result?.type === "redirect") {
        return redirect_response(action_result.status, action_result.location);
      }
      if (action_result?.type === "error") {
        status = get_status(action_result.error);
      }
      if (action_result?.type === "failure") {
        status = action_result.status;
      }
    }
    const should_prerender = nodes.prerender();
    if (should_prerender) {
      const mod = leaf_node.server;
      if (mod?.actions) {
        throw new Error("Cannot prerender pages with actions");
      }
    } else if (state2.prerendering) {
      return new Response(void 0, {
        status: 204,
      });
    }
    state2.prerender_default = should_prerender;
    const should_prerender_data = nodes.should_prerender_data();
    const data_pathname = add_data_suffix2(event.url.pathname);
    const fetched = [];
    const ssr = nodes.ssr();
    const csr = nodes.csr();
    if (ssr === false && !(state2.prerendering && should_prerender_data)) {
      if (
        BROWSER &&
        action_result &&
        !event.request.headers.has("x-sveltekit-action")
      );
      return await render_response({
        branch: [],
        fetched,
        page_config: {
          ssr: false,
          csr,
        },
        status,
        error: null,
        event,
        event_state,
        options: options2,
        manifest: manifest2,
        state: state2,
        resolve_opts,
        data_serializer: server_data_serializer(event, event_state, options2),
      });
    }
    const branch2 = [];
    let load_error = null;
    const data_serializer = server_data_serializer(
      event,
      event_state,
      options2,
    );
    const data_serializer_json =
      state2.prerendering && should_prerender_data
        ? server_data_serializer_json(event, event_state, options2)
        : null;
    const server_promises = nodes.data.map((node, i) => {
      if (load_error) {
        throw load_error;
      }
      return Promise.resolve().then(async () => {
        try {
          if (node === leaf_node && action_result?.type === "error") {
            throw action_result.error;
          }
          const server_data = await load_server_data({
            event,
            event_state,
            state: state2,
            node,
            parent: async () => {
              const data = {};
              for (let j = 0; j < i; j += 1) {
                const parent = await server_promises[j];
                if (parent) Object.assign(data, parent.data);
              }
              return data;
            },
          });
          if (node) {
            data_serializer.add_node(i, server_data);
          }
          data_serializer_json?.add_node(i, server_data);
          return server_data;
        } catch (e3) {
          load_error = /** @type {Error} */ e3;
          throw load_error;
        }
      });
    });
    const load_promises = nodes.data.map((node, i) => {
      if (load_error) throw load_error;
      return Promise.resolve().then(async () => {
        try {
          return await load_data({
            event,
            event_state,
            fetched,
            node,
            parent: async () => {
              const data = {};
              for (let j = 0; j < i; j += 1) {
                Object.assign(data, await load_promises[j]);
              }
              return data;
            },
            resolve_opts,
            server_data_promise: server_promises[i],
            state: state2,
            csr,
          });
        } catch (e3) {
          load_error = /** @type {Error} */ e3;
          throw load_error;
        }
      });
    });
    for (const p of server_promises) p.catch(() => {});
    for (const p of load_promises) p.catch(() => {});
    for (let i = 0; i < nodes.data.length; i += 1) {
      const node = nodes.data[i];
      if (node) {
        try {
          const server_data = await server_promises[i];
          const data = await load_promises[i];
          branch2.push({ node, server_data, data });
        } catch (e3) {
          const err = normalize_error(e3);
          if (err instanceof Redirect) {
            if (state2.prerendering && should_prerender_data) {
              const body2 = JSON.stringify({
                type: "redirect",
                location: err.location,
              });
              state2.prerendering.dependencies.set(data_pathname, {
                response: text(body2),
                body: body2,
              });
            }
            return redirect_response(err.status, err.location);
          }
          const status2 = get_status(err);
          const error2 = await handle_error_and_jsonify(
            event,
            event_state,
            options2,
            err,
          );
          while (i--) {
            if (page3.errors[i]) {
              const index15 =
                /** @type {number} */
                page3.errors[i];
              const node2 = await manifest2._.nodes[index15]();
              let j = i;
              while (!branch2[j]) j -= 1;
              data_serializer.set_max_nodes(j + 1);
              const layouts = compact(branch2.slice(0, j + 1));
              const nodes2 = new PageNodes(
                layouts.map((layout) => layout.node),
              );
              return await render_response({
                event,
                event_state,
                options: options2,
                manifest: manifest2,
                state: state2,
                resolve_opts,
                page_config: {
                  ssr: nodes2.ssr(),
                  csr: nodes2.csr(),
                },
                status: status2,
                error: error2,
                branch: layouts.concat({
                  node: node2,
                  data: null,
                  server_data: null,
                }),
                fetched,
                data_serializer,
              });
            }
          }
          return static_error_page(options2, status2, error2.message);
        }
      } else {
        branch2.push(null);
      }
    }
    if (state2.prerendering && data_serializer_json) {
      let { data, chunks } = data_serializer_json.get_data();
      if (chunks) {
        for await (const chunk of chunks) {
          data += chunk;
        }
      }
      state2.prerendering.dependencies.set(data_pathname, {
        response: text(data),
        body: data,
      });
    }
    return await render_response({
      event,
      event_state,
      options: options2,
      manifest: manifest2,
      state: state2,
      resolve_opts,
      page_config: {
        csr,
        ssr,
      },
      status,
      error: null,
      branch: ssr === false ? [] : compact(branch2),
      action_result,
      fetched,
      data_serializer:
        ssr === false
          ? server_data_serializer(event, event_state, options2)
          : data_serializer,
    });
  } catch (e3) {
    return await respond_with_error({
      event,
      event_state,
      options: options2,
      manifest: manifest2,
      state: state2,
      status: 500,
      error: e3,
      resolve_opts,
    });
  }
}
function once(fn) {
  let done = false;
  let result;
  return () => {
    if (done) return result;
    done = true;
    return (result = fn());
  };
}
async function render_data(
  event,
  event_state,
  route,
  options2,
  manifest2,
  state2,
  invalidated_data_nodes,
  trailing_slash,
) {
  if (!route.page) {
    return new Response(void 0, {
      status: 404,
    });
  }
  try {
    const node_ids = [...route.page.layouts, route.page.leaf];
    const invalidated = invalidated_data_nodes ?? node_ids.map(() => true);
    let aborted = false;
    const url = new URL(event.url);
    url.pathname = normalize_path(url.pathname, trailing_slash);
    const new_event = { ...event, url };
    const functions = node_ids.map((n2, i) => {
      return once(async () => {
        try {
          if (aborted) {
            return (
              /** @type {import('types').ServerDataSkippedNode} */
              {
                type: "skip",
              }
            );
          }
          const node = n2 == void 0 ? n2 : await manifest2._.nodes[n2]();
          return load_server_data({
            event: new_event,
            event_state,
            state: state2,
            node,
            parent: async () => {
              const data2 = {};
              for (let j = 0; j < i; j += 1) {
                const parent =
                  /** @type {import('types').ServerDataNode | null} */
                  await functions[j]();
                if (parent) {
                  Object.assign(data2, parent.data);
                }
              }
              return data2;
            },
          });
        } catch (e3) {
          aborted = true;
          throw e3;
        }
      });
    });
    const promises = functions.map(async (fn, i) => {
      if (!invalidated[i]) {
        return (
          /** @type {import('types').ServerDataSkippedNode} */
          {
            type: "skip",
          }
        );
      }
      return fn();
    });
    let length = promises.length;
    const nodes = await Promise.all(
      promises.map((p, i) =>
        p.catch(async (error2) => {
          if (error2 instanceof Redirect) {
            throw error2;
          }
          length = Math.min(length, i + 1);
          return (
            /** @type {import('types').ServerErrorNode} */
            {
              type: "error",
              error: await handle_error_and_jsonify(
                event,
                event_state,
                options2,
                error2,
              ),
              status:
                error2 instanceof HttpError || error2 instanceof SvelteKitError
                  ? error2.status
                  : void 0,
            }
          );
        }),
      ),
    );
    const data_serializer = server_data_serializer_json(
      event,
      event_state,
      options2,
    );
    for (let i = 0; i < nodes.length; i++)
      data_serializer.add_node(i, nodes[i]);
    const { data, chunks } = data_serializer.get_data();
    if (!chunks) {
      return json_response(data);
    }
    return new Response(
      new ReadableStream({
        async start(controller2) {
          controller2.enqueue(text_encoder2.encode(data));
          for await (const chunk of chunks) {
            controller2.enqueue(text_encoder2.encode(chunk));
          }
          controller2.close();
        },
        type: "bytes",
      }),
      {
        headers: {
          // we use a proprietary content type to prevent buffering.
          // the `text` prefix makes it inspectable
          "content-type": "text/sveltekit-data",
          "cache-control": "private, no-store",
        },
      },
    );
  } catch (e3) {
    const error2 = normalize_error(e3);
    if (error2 instanceof Redirect) {
      return redirect_json_response(error2);
    } else {
      return json_response(
        await handle_error_and_jsonify(event, event_state, options2, error2),
        500,
      );
    }
  }
}
function json_response(json2, status = 200) {
  return text(typeof json2 === "string" ? json2 : JSON.stringify(json2), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "private, no-store",
    },
  });
}
function redirect_json_response(redirect) {
  return json_response(
    /** @type {import('types').ServerRedirectNode} */
    {
      type: "redirect",
      location: redirect.location,
    },
  );
}
var INVALID_COOKIE_CHARACTER_REGEX = /[\x00-\x1F\x7F()<>@,;:"/[\]?={} \t]/;
function validate_options(options2) {
  if (options2?.path === void 0) {
    throw new Error(
      "You must specify a `path` when setting, deleting or serializing cookies",
    );
  }
}
function generate_cookie_key(domain, path, name) {
  return `${domain || ""}${path}?${encodeURIComponent(name)}`;
}
function get_cookies(request, url) {
  const header = request.headers.get("cookie") ?? "";
  const initial_cookies = (0, import_cookie.parse)(header, {
    decode: (value) => value,
  });
  let normalized_url;
  const new_cookies = /* @__PURE__ */ new Map();
  const defaults = {
    httpOnly: true,
    sameSite: "lax",
    secure:
      url.hostname === "localhost" && url.protocol === "http:" ? false : true,
  };
  const cookies = {
    // The JSDoc param annotations appearing below for get, set and delete
    // are necessary to expose the `cookie` library types to
    // typescript users. `@type {import('@sveltejs/kit').Cookies}` above is not
    // sufficient to do so.
    /**
     * @param {string} name
     * @param {import('cookie').CookieParseOptions} [opts]
     */
    get(name, opts) {
      const best_match = Array.from(new_cookies.values())
        .filter((c2) => {
          return (
            c2.name === name &&
            domain_matches(url.hostname, c2.options.domain) &&
            path_matches(url.pathname, c2.options.path)
          );
        })
        .sort((a, b) => b.options.path.length - a.options.path.length)[0];
      if (best_match) {
        return best_match.options.maxAge === 0 ? void 0 : best_match.value;
      }
      const req_cookies = (0, import_cookie.parse)(header, {
        decode: opts?.decode,
      });
      const cookie = req_cookies[name];
      return cookie;
    },
    /**
     * @param {import('cookie').CookieParseOptions} [opts]
     */
    getAll(opts) {
      const cookies2 = (0, import_cookie.parse)(header, {
        decode: opts?.decode,
      });
      const lookup = /* @__PURE__ */ new Map();
      for (const c2 of new_cookies.values()) {
        if (
          domain_matches(url.hostname, c2.options.domain) &&
          path_matches(url.pathname, c2.options.path)
        ) {
          const existing = lookup.get(c2.name);
          if (
            !existing ||
            c2.options.path.length > existing.options.path.length
          ) {
            lookup.set(c2.name, c2);
          }
        }
      }
      for (const c2 of lookup.values()) {
        cookies2[c2.name] = c2.value;
      }
      return Object.entries(cookies2).map(([name, value]) => ({ name, value }));
    },
    /**
     * @param {string} name
     * @param {string} value
     * @param {import('./page/types.js').Cookie['options']} options
     */
    set(name, value, options2) {
      const illegal_characters = name.match(INVALID_COOKIE_CHARACTER_REGEX);
      if (illegal_characters) {
        console.warn(
          `The cookie name "${name}" will be invalid in SvelteKit 3.0 as it contains ${illegal_characters.join(
            " and ",
          )}. See RFC 2616 for more details https://datatracker.ietf.org/doc/html/rfc2616#section-2.2`,
        );
      }
      validate_options(options2);
      set_internal(name, value, { ...defaults, ...options2 });
    },
    /**
     * @param {string} name
     *  @param {import('./page/types.js').Cookie['options']} options
     */
    delete(name, options2) {
      validate_options(options2);
      cookies.set(name, "", { ...options2, maxAge: 0 });
    },
    /**
     * @param {string} name
     * @param {string} value
     *  @param {import('./page/types.js').Cookie['options']} options
     */
    serialize(name, value, options2) {
      validate_options(options2);
      let path = options2.path;
      if (!options2.domain || options2.domain === url.hostname) {
        if (!normalized_url) {
          throw new Error(
            "Cannot serialize cookies until after the route is determined",
          );
        }
        path = resolve(normalized_url, path);
      }
      return (0, import_cookie.serialize)(name, value, {
        ...defaults,
        ...options2,
        path,
      });
    },
  };
  function get_cookie_header(destination, header2) {
    const combined_cookies = {
      // cookies sent by the user agent have lowest precedence
      ...initial_cookies,
    };
    for (const cookie of new_cookies.values()) {
      if (!domain_matches(destination.hostname, cookie.options.domain))
        continue;
      if (!path_matches(destination.pathname, cookie.options.path)) continue;
      const encoder = cookie.options.encode || encodeURIComponent;
      combined_cookies[cookie.name] = encoder(cookie.value);
    }
    if (header2) {
      const parsed = (0, import_cookie.parse)(header2, {
        decode: (value) => value,
      });
      for (const name in parsed) {
        combined_cookies[name] = parsed[name];
      }
    }
    return Object.entries(combined_cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
  const internal_queue = [];
  function set_internal(name, value, options2) {
    if (!normalized_url) {
      internal_queue.push(() => set_internal(name, value, options2));
      return;
    }
    let path = options2.path;
    if (!options2.domain || options2.domain === url.hostname) {
      path = resolve(normalized_url, path);
    }
    const cookie_key = generate_cookie_key(options2.domain, path, name);
    const cookie = { name, value, options: { ...options2, path } };
    new_cookies.set(cookie_key, cookie);
  }
  function set_trailing_slash(trailing_slash) {
    normalized_url = normalize_path(url.pathname, trailing_slash);
    internal_queue.forEach((fn) => fn());
  }
  return {
    cookies,
    new_cookies,
    get_cookie_header,
    set_internal,
    set_trailing_slash,
  };
}
function domain_matches(hostname, constraint) {
  if (!constraint) return true;
  const normalized = constraint[0] === "." ? constraint.slice(1) : constraint;
  if (hostname === normalized) return true;
  return hostname.endsWith("." + normalized);
}
function path_matches(path, constraint) {
  if (!constraint) return true;
  const normalized = constraint.endsWith("/")
    ? constraint.slice(0, -1)
    : constraint;
  if (path === normalized) return true;
  return path.startsWith(normalized + "/");
}
function add_cookies_to_headers(headers2, cookies) {
  for (const new_cookie of cookies) {
    const { name, value, options: options2 } = new_cookie;
    headers2.append(
      "set-cookie",
      (0, import_cookie.serialize)(name, value, options2),
    );
    if (options2.path.endsWith(".html")) {
      const path = add_data_suffix2(options2.path);
      headers2.append(
        "set-cookie",
        (0, import_cookie.serialize)(name, value, { ...options2, path }),
      );
    }
  }
}
function create_fetch({
  event,
  options: options2,
  manifest: manifest2,
  state: state2,
  get_cookie_header,
  set_internal,
}) {
  const server_fetch = async (info, init2) => {
    const original_request = normalize_fetch_input(info, init2, event.url);
    let mode = (info instanceof Request ? info.mode : init2?.mode) ?? "cors";
    let credentials =
      (info instanceof Request ? info.credentials : init2?.credentials) ??
      "same-origin";
    return options2.hooks.handleFetch({
      event,
      request: original_request,
      fetch: async (info2, init3) => {
        const request = normalize_fetch_input(info2, init3, event.url);
        const url = new URL(request.url);
        if (!request.headers.has("origin")) {
          request.headers.set("origin", event.url.origin);
        }
        if (info2 !== original_request) {
          mode =
            (info2 instanceof Request ? info2.mode : init3?.mode) ?? "cors";
          credentials =
            (info2 instanceof Request
              ? info2.credentials
              : init3?.credentials) ?? "same-origin";
        }
        if (
          (request.method === "GET" || request.method === "HEAD") &&
          ((mode === "no-cors" && url.origin !== event.url.origin) ||
            url.origin === event.url.origin)
        ) {
          request.headers.delete("origin");
        }
        if (url.origin !== event.url.origin) {
          if (
            `.${url.hostname}`.endsWith(`.${event.url.hostname}`) &&
            credentials !== "omit"
          ) {
            const cookie = get_cookie_header(
              url,
              request.headers.get("cookie"),
            );
            if (cookie) request.headers.set("cookie", cookie);
          }
          return fetch(request);
        }
        const prefix = assets || base;
        const decoded = decodeURIComponent(url.pathname);
        const filename = (
          decoded.startsWith(prefix) ? decoded.slice(prefix.length) : decoded
        ).slice(1);
        const filename_html = `${filename}/index.html`;
        const is_asset =
          manifest2.assets.has(filename) ||
          filename in manifest2._.server_assets;
        const is_asset_html =
          manifest2.assets.has(filename_html) ||
          filename_html in manifest2._.server_assets;
        if (is_asset || is_asset_html) {
          const file = is_asset ? filename : filename_html;
          if (state2.read) {
            const type = is_asset
              ? manifest2.mimeTypes[filename.slice(filename.lastIndexOf("."))]
              : "text/html";
            return new Response(state2.read(file), {
              headers: type ? { "content-type": type } : {},
            });
          } else if (read_implementation && file in manifest2._.server_assets) {
            const length = manifest2._.server_assets[file];
            const type = manifest2.mimeTypes[file.slice(file.lastIndexOf("."))];
            return new Response(read_implementation(file), {
              headers: {
                "Content-Length": "" + length,
                "Content-Type": type,
              },
            });
          }
          return await fetch(request);
        }
        if (has_prerendered_path(manifest2, base + decoded)) {
          return await fetch(request);
        }
        if (credentials !== "omit") {
          const cookie = get_cookie_header(url, request.headers.get("cookie"));
          if (cookie) {
            request.headers.set("cookie", cookie);
          }
          const authorization = event.request.headers.get("authorization");
          if (authorization && !request.headers.has("authorization")) {
            request.headers.set("authorization", authorization);
          }
        }
        if (!request.headers.has("accept")) {
          request.headers.set("accept", "*/*");
        }
        if (!request.headers.has("accept-language")) {
          request.headers.set(
            "accept-language",
            /** @type {string} */
            event.request.headers.get("accept-language"),
          );
        }
        const response = await internal_fetch(
          request,
          options2,
          manifest2,
          state2,
        );
        const set_cookie = response.headers.get("set-cookie");
        if (set_cookie) {
          for (const str of set_cookie_parser.splitCookiesString(set_cookie)) {
            const { name, value, ...options3 } = set_cookie_parser.parseString(
              str,
              {
                decodeValues: false,
              },
            );
            const path =
              options3.path ??
              (url.pathname.split("/").slice(0, -1).join("/") || "/");
            set_internal(name, value, {
              path,
              encode: (value2) => value2,
              .../** @type {import('cookie').CookieSerializeOptions} */
              options3,
            });
          }
        }
        return response;
      },
    });
  };
  return (input, init2) => {
    const response = server_fetch(input, init2);
    response.catch(() => {});
    return response;
  };
}
function normalize_fetch_input(info, init2, url) {
  if (info instanceof Request) {
    return info;
  }
  return new Request(
    typeof info === "string" ? new URL(info, url) : info,
    init2,
  );
}
async function internal_fetch(request, options2, manifest2, state2) {
  if (request.signal) {
    if (request.signal.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }
    let remove_abort_listener = () => {};
    const abort_promise = new Promise((_, reject) => {
      const on_abort = () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      };
      request.signal.addEventListener("abort", on_abort, { once: true });
      remove_abort_listener = () =>
        request.signal.removeEventListener("abort", on_abort);
    });
    const result = await Promise.race([
      respond(request, options2, manifest2, {
        ...state2,
        depth: state2.depth + 1,
      }),
      abort_promise,
    ]);
    remove_abort_listener();
    return result;
  } else {
    return await respond(request, options2, manifest2, {
      ...state2,
      depth: state2.depth + 1,
    });
  }
}
var body;
var etag;
var headers;
function get_public_env(request) {
  body ??= `export const env=${JSON.stringify(public_env)}`;
  etag ??= `W/${Date.now()}`;
  headers ??= new Headers({
    "content-type": "application/javascript; charset=utf-8",
    etag,
  });
  if (request.headers.get("if-none-match") === etag) {
    return new Response(void 0, { status: 304, headers });
  }
  return new Response(body, { headers });
}
var default_transform = ({ html }) => html;
var default_filter = () => false;
var default_preload = ({ type }) => type === "js" || type === "css";
var page_methods = /* @__PURE__ */ new Set(["GET", "HEAD", "POST"]);
var allowed_page_methods = /* @__PURE__ */ new Set(["GET", "HEAD", "OPTIONS"]);
var respond = propagate_context(internal_respond);
async function internal_respond(request, options2, manifest2, state2) {
  const url = new URL(request.url);
  const is_route_resolution_request = has_resolution_suffix2(url.pathname);
  const is_data_request = has_data_suffix2(url.pathname);
  const remote_id = get_remote_id(url);
  {
    const request_origin = request.headers.get("origin");
    if (remote_id) {
      if (request.method !== "GET" && request_origin !== url.origin) {
        const message = "Cross-site remote requests are forbidden";
        return json({ message }, { status: 403 });
      }
    } else if (options2.csrf_check_origin) {
      const forbidden =
        is_form_content_type(request) &&
        (request.method === "POST" ||
          request.method === "PUT" ||
          request.method === "PATCH" ||
          request.method === "DELETE") &&
        request_origin !== url.origin &&
        (!request_origin ||
          !options2.csrf_trusted_origins.includes(request_origin));
      if (forbidden) {
        const message = `Cross-site ${request.method} form submissions are forbidden`;
        const opts = { status: 403 };
        if (request.headers.get("accept") === "application/json") {
          return json({ message }, opts);
        }
        return text(message, opts);
      }
    }
  }
  if (
    options2.hash_routing &&
    url.pathname !== base + "/" &&
    url.pathname !== "/[fallback]"
  ) {
    return text("Not found", { status: 404 });
  }
  let invalidated_data_nodes;
  if (is_route_resolution_request) {
    url.pathname = strip_resolution_suffix2(url.pathname);
  } else if (is_data_request) {
    url.pathname =
      strip_data_suffix2(url.pathname) +
        (url.searchParams.get(TRAILING_SLASH_PARAM) === "1" ? "/" : "") || "/";
    url.searchParams.delete(TRAILING_SLASH_PARAM);
    invalidated_data_nodes = url.searchParams
      .get(INVALIDATED_PARAM)
      ?.split("")
      .map((node) => node === "1");
    url.searchParams.delete(INVALIDATED_PARAM);
  } else if (remote_id) {
    url.pathname = base;
    url.search = "";
  }
  const headers2 = {};
  const {
    cookies,
    new_cookies,
    get_cookie_header,
    set_internal,
    set_trailing_slash,
  } = get_cookies(request, url);
  const event_state = {
    prerendering: state2.prerendering,
    transport: options2.hooks.transport,
    handleValidationError: options2.hooks.handleValidationError,
    tracing: {
      record_span,
    },
  };
  const event = {
    cookies,
    // @ts-expect-error `fetch` needs to be created after the `event` itself
    fetch: null,
    getClientAddress:
      state2.getClientAddress ||
      (() => {
        throw new Error(
          `${"@sveltejs/adapter-cloudflare"} does not specify getClientAddress. Please raise an issue`,
        );
      }),
    locals: {},
    params: {},
    platform: state2.platform,
    request,
    route: { id: null },
    setHeaders: (new_headers) => {
      for (const key2 in new_headers) {
        const lower = key2.toLowerCase();
        const value = new_headers[key2];
        if (lower === "set-cookie") {
          throw new Error(
            "Use `event.cookies.set(name, value, options)` instead of `event.setHeaders` to set cookies",
          );
        } else if (lower in headers2) {
          throw new Error(`"${key2}" header is already set`);
        } else {
          headers2[lower] = value;
          if (state2.prerendering && lower === "cache-control") {
            state2.prerendering.cache = /** @type {string} */ value;
          }
        }
      }
    },
    url,
    isDataRequest: is_data_request,
    isSubRequest: state2.depth > 0,
    isRemoteRequest: !!remote_id,
  };
  event.fetch = create_fetch({
    event,
    options: options2,
    manifest: manifest2,
    state: state2,
    get_cookie_header,
    set_internal,
  });
  if (state2.emulator?.platform) {
    event.platform = await state2.emulator.platform({
      config: {},
      prerender: !!state2.prerendering?.fallback,
    });
  }
  let resolved_path = url.pathname;
  if (!remote_id) {
    const prerendering_reroute_state = state2.prerendering?.inside_reroute;
    try {
      if (state2.prerendering) state2.prerendering.inside_reroute = true;
      resolved_path =
        (await options2.hooks.reroute({
          url: new URL(url),
          fetch: event.fetch,
        })) ?? url.pathname;
    } catch {
      return text("Internal Server Error", {
        status: 500,
      });
    } finally {
      if (state2.prerendering)
        state2.prerendering.inside_reroute = prerendering_reroute_state;
    }
  }
  try {
    resolved_path = decode_pathname(resolved_path);
  } catch {
    return text("Malformed URI", { status: 400 });
  }
  if (
    resolved_path !== url.pathname &&
    !state2.prerendering?.fallback &&
    has_prerendered_path(manifest2, resolved_path)
  ) {
    const url2 = new URL(request.url);
    url2.pathname = is_data_request
      ? add_data_suffix2(resolved_path)
      : is_route_resolution_request
        ? add_resolution_suffix2(resolved_path)
        : resolved_path;
    const response = await fetch(url2, request);
    const headers22 = new Headers(response.headers);
    if (headers22.has("content-encoding")) {
      headers22.delete("content-encoding");
      headers22.delete("content-length");
    }
    return new Response(response.body, {
      headers: headers22,
      status: response.status,
      statusText: response.statusText,
    });
  }
  let route = null;
  if (base && !state2.prerendering?.fallback) {
    if (!resolved_path.startsWith(base)) {
      return text("Not found", { status: 404 });
    }
    resolved_path = resolved_path.slice(base.length) || "/";
  }
  if (is_route_resolution_request) {
    return resolve_route(resolved_path, new URL(request.url), manifest2);
  }
  if (resolved_path === `/${app_dir}/env.js`) {
    return get_public_env(request);
  }
  if (!remote_id && resolved_path.startsWith(`/${app_dir}`)) {
    const headers22 = new Headers();
    headers22.set("cache-control", "public, max-age=0, must-revalidate");
    return text("Not found", { status: 404, headers: headers22 });
  }
  if (!state2.prerendering?.fallback && !remote_id) {
    const matchers = await manifest2._.matchers();
    for (const candidate of manifest2._.routes) {
      const match = candidate.pattern.exec(resolved_path);
      if (!match) continue;
      const matched = exec(match, candidate.params, matchers);
      if (matched) {
        route = candidate;
        event.route = { id: route.id };
        event.params = decode_params(matched);
        break;
      }
    }
  }
  let resolve_opts = {
    transformPageChunk: default_transform,
    filterSerializedResponseHeaders: default_filter,
    preload: default_preload,
  };
  let trailing_slash = "never";
  try {
    const page_nodes = route?.page
      ? new PageNodes(await load_page_nodes(route.page, manifest2))
      : void 0;
    if (route) {
      if (url.pathname === base || url.pathname === base + "/") {
        trailing_slash = "always";
      } else if (page_nodes) {
        if (BROWSER);
        trailing_slash = page_nodes.trailing_slash();
      } else if (route.endpoint) {
        const node = await route.endpoint();
        trailing_slash = node.trailingSlash ?? "never";
        if (BROWSER);
      }
      if (!is_data_request) {
        const normalized = normalize_path(url.pathname, trailing_slash);
        if (normalized !== url.pathname && !state2.prerendering?.fallback) {
          return new Response(void 0, {
            status: 308,
            headers: {
              "x-sveltekit-normalize": "1",
              location:
                // ensure paths starting with '//' are not treated as protocol-relative
                (normalized.startsWith("//")
                  ? url.origin + normalized
                  : normalized) + (url.search === "?" ? "" : url.search),
            },
          });
        }
      }
      if (state2.before_handle || state2.emulator?.platform) {
        let config = {};
        let prerender = false;
        if (route.endpoint) {
          const node = await route.endpoint();
          config = node.config ?? config;
          prerender = node.prerender ?? prerender;
        } else if (page_nodes) {
          config = page_nodes.get_config() ?? config;
          prerender = page_nodes.prerender();
        }
        if (state2.before_handle) {
          state2.before_handle(event, config, prerender);
        }
        if (state2.emulator?.platform) {
          event.platform = await state2.emulator.platform({
            config,
            prerender,
          });
        }
      }
    }
    set_trailing_slash(trailing_slash);
    if (
      state2.prerendering &&
      !state2.prerendering.fallback &&
      !state2.prerendering.inside_reroute
    ) {
      disable_search(url);
    }
    const response = await record_span({
      name: "sveltekit.handle.root",
      attributes: {
        "http.route": event.route.id || "unknown",
        "http.method": event.request.method,
        "http.url": event.url.href,
        "sveltekit.is_data_request": is_data_request,
        "sveltekit.is_sub_request": event.isSubRequest,
      },
      fn: async (root_span) => {
        const traced_event = {
          ...event,
          tracing: {
            enabled: false,
            root: root_span,
            current: root_span,
          },
        };
        return await with_request_store(
          { event: traced_event, state: event_state },
          () =>
            options2.hooks.handle({
              event: traced_event,
              resolve: (event2, opts) => {
                return record_span({
                  name: "sveltekit.resolve",
                  attributes: {
                    "http.route": event2.route.id || "unknown",
                  },
                  fn: (resolve_span) => {
                    return with_request_store(null, () =>
                      resolve2(
                        merge_tracing(event2, resolve_span),
                        page_nodes,
                        opts,
                      ).then((response2) => {
                        for (const key2 in headers2) {
                          const value = headers2[key2];
                          response2.headers.set(
                            key2,
                            /** @type {string} */
                            value,
                          );
                        }
                        add_cookies_to_headers(
                          response2.headers,
                          new_cookies.values(),
                        );
                        if (state2.prerendering && event2.route.id !== null) {
                          response2.headers.set(
                            "x-sveltekit-routeid",
                            encodeURI(event2.route.id),
                          );
                        }
                        resolve_span.setAttributes({
                          "http.response.status_code": response2.status,
                          "http.response.body.size":
                            response2.headers.get("content-length") ||
                            "unknown",
                        });
                        return response2;
                      }),
                    );
                  },
                });
              },
            }),
        );
      },
    });
    if (response.status === 200 && response.headers.has("etag")) {
      let if_none_match_value = request.headers.get("if-none-match");
      if (if_none_match_value?.startsWith('W/"')) {
        if_none_match_value = if_none_match_value.substring(2);
      }
      const etag2 =
        /** @type {string} */
        response.headers.get("etag");
      if (if_none_match_value === etag2) {
        const headers22 = new Headers({ etag: etag2 });
        for (const key2 of [
          "cache-control",
          "content-location",
          "date",
          "expires",
          "vary",
          "set-cookie",
        ]) {
          const value = response.headers.get(key2);
          if (value) headers22.set(key2, value);
        }
        return new Response(void 0, {
          status: 304,
          headers: headers22,
        });
      }
    }
    if (is_data_request && response.status >= 300 && response.status <= 308) {
      const location = response.headers.get("location");
      if (location) {
        return redirect_json_response(
          new Redirect(
            /** @type {any} */
            response.status,
            location,
          ),
        );
      }
    }
    return response;
  } catch (e3) {
    if (e3 instanceof Redirect) {
      const response =
        is_data_request || remote_id
          ? redirect_json_response(e3)
          : route?.page && is_action_json_request(event)
            ? action_json_redirect(e3)
            : redirect_response(e3.status, e3.location);
      add_cookies_to_headers(response.headers, new_cookies.values());
      return response;
    }
    return await handle_fatal_error(event, event_state, options2, e3);
  }
  async function resolve2(event2, page_nodes, opts) {
    try {
      if (opts) {
        resolve_opts = {
          transformPageChunk: opts.transformPageChunk || default_transform,
          filterSerializedResponseHeaders:
            opts.filterSerializedResponseHeaders || default_filter,
          preload: opts.preload || default_preload,
        };
      }
      if (options2.hash_routing || state2.prerendering?.fallback) {
        return await render_response({
          event: event2,
          event_state,
          options: options2,
          manifest: manifest2,
          state: state2,
          page_config: { ssr: false, csr: true },
          status: 200,
          error: null,
          branch: [],
          fetched: [],
          resolve_opts,
          data_serializer: server_data_serializer(
            event2,
            event_state,
            options2,
          ),
        });
      }
      if (remote_id) {
        return await handle_remote_call(
          event2,
          event_state,
          options2,
          manifest2,
          remote_id,
        );
      }
      if (route) {
        const method =
          /** @type {import('types').HttpMethod} */
          event2.request.method;
        let response2;
        if (is_data_request) {
          response2 = await render_data(
            event2,
            event_state,
            route,
            options2,
            manifest2,
            state2,
            invalidated_data_nodes,
            trailing_slash,
          );
        } else if (
          route.endpoint &&
          (!route.page || is_endpoint_request(event2))
        ) {
          response2 = await render_endpoint(
            event2,
            event_state,
            await route.endpoint(),
            state2,
          );
        } else if (route.page) {
          if (!page_nodes) {
            throw new Error("page_nodes not found. This should never happen");
          } else if (page_methods.has(method)) {
            response2 = await render_page(
              event2,
              event_state,
              route.page,
              options2,
              manifest2,
              state2,
              page_nodes,
              resolve_opts,
            );
          } else {
            const allowed_methods2 = new Set(allowed_page_methods);
            const node = await manifest2._.nodes[route.page.leaf]();
            if (node?.server?.actions) {
              allowed_methods2.add("POST");
            }
            if (method === "OPTIONS") {
              response2 = new Response(null, {
                status: 204,
                headers: {
                  allow: Array.from(allowed_methods2.values()).join(", "),
                },
              });
            } else {
              const mod = [...allowed_methods2].reduce(
                (acc, curr) => {
                  acc[curr] = true;
                  return acc;
                },
                /** @type {Record<string, any>} */
                {},
              );
              response2 = method_not_allowed(mod, method);
            }
          }
        } else {
          throw new Error(
            "Route is neither page nor endpoint. This should never happen",
          );
        }
        if (request.method === "GET" && route.page && route.endpoint) {
          const vary = response2.headers
            .get("vary")
            ?.split(",")
            ?.map((v) => v.trim().toLowerCase());
          if (!(vary?.includes("accept") || vary?.includes("*"))) {
            response2 = new Response(response2.body, {
              status: response2.status,
              statusText: response2.statusText,
              headers: new Headers(response2.headers),
            });
            response2.headers.append("Vary", "Accept");
          }
        }
        return response2;
      }
      if (state2.error && event2.isSubRequest) {
        const headers22 = new Headers(request.headers);
        headers22.set("x-sveltekit-error", "true");
        return await fetch(request, { headers: headers22 });
      }
      if (state2.error) {
        return text("Internal Server Error", {
          status: 500,
        });
      }
      if (state2.depth === 0) {
        if (
          BROWSER &&
          event2.url.pathname ===
            "/.well-known/appspecific/com.chrome.devtools.json"
        );
        return await respond_with_error({
          event: event2,
          event_state,
          options: options2,
          manifest: manifest2,
          state: state2,
          status: 404,
          error: new SvelteKitError(
            404,
            "Not Found",
            `Not found: ${event2.url.pathname}`,
          ),
          resolve_opts,
        });
      }
      if (state2.prerendering) {
        return text("not found", { status: 404 });
      }
      const response = await fetch(request);
      return new Response(response.body, response);
    } catch (e3) {
      return await handle_fatal_error(event2, event_state, options2, e3);
    } finally {
      event2.cookies.set = () => {
        throw new Error(
          "Cannot use `cookies.set(...)` after the response has been generated",
        );
      };
      event2.setHeaders = () => {
        throw new Error(
          "Cannot use `setHeaders(...)` after the response has been generated",
        );
      };
    }
  }
}
function load_page_nodes(page3, manifest2) {
  return Promise.all([
    // we use == here rather than === because [undefined] serializes as "[null]"
    ...page3.layouts.map((n2) => (n2 == void 0 ? n2 : manifest2._.nodes[n2]())),
    manifest2._.nodes[page3.leaf](),
  ]);
}
function propagate_context(fn) {
  return async (req, ...rest) => {
    {
      return fn(req, ...rest);
    }
  };
}
function filter_env(env, allowed, disallowed) {
  return Object.fromEntries(
    Object.entries(env).filter(
      ([k]) =>
        k.startsWith(allowed) &&
        (disallowed === "" || !k.startsWith(disallowed)),
    ),
  );
}
function set_app(value) {}
var init_promise;
var Server = class {
  /** @type {import('types').SSROptions} */
  #options;
  /** @type {import('@sveltejs/kit').SSRManifest} */
  #manifest;
  /** @param {import('@sveltejs/kit').SSRManifest} manifest */
  constructor(manifest2) {
    this.#options = options;
    this.#manifest = manifest2;
  }
  /**
   * @param {import('@sveltejs/kit').ServerInitOptions} opts
   */
  async init({ env, read }) {
    const { env_public_prefix, env_private_prefix } = this.#options;
    set_private_env(filter_env(env, env_private_prefix, env_public_prefix));
    set_public_env(filter_env(env, env_public_prefix, env_private_prefix));
    if (read) {
      const wrapped_read = (file) => {
        const result = read(file);
        if (result instanceof ReadableStream) {
          return result;
        } else {
          return new ReadableStream({
            async start(controller2) {
              try {
                const stream = await Promise.resolve(result);
                if (!stream) {
                  controller2.close();
                  return;
                }
                const reader = stream.getReader();
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  controller2.enqueue(value);
                }
                controller2.close();
              } catch (error2) {
                controller2.error(error2);
              }
            },
          });
        }
      };
      set_read_implementation(wrapped_read);
    }
    await (init_promise ??= (async () => {
      try {
        const module = await get_hooks();
        this.#options.hooks = {
          handle:
            module.handle ||
            (({ event, resolve: resolve2 }) => resolve2(event)),
          handleError:
            module.handleError ||
            (({ status, error: error2, event }) => {
              const error_message = format_server_error(
                status,
                /** @type {Error} */
                error2,
                event,
              );
              console.error(error_message);
            }),
          handleFetch:
            module.handleFetch ||
            (({ request, fetch: fetch2 }) => fetch2(request)),
          handleValidationError:
            module.handleValidationError ||
            (({ issues }) => {
              console.error(
                "Remote function schema validation failed:",
                issues,
              );
              return { message: "Bad Request" };
            }),
          reroute: module.reroute || (() => {}),
          transport: module.transport || {},
        };
        set_app({
          decoders: module.transport
            ? Object.fromEntries(
                Object.entries(module.transport).map(([k, v]) => [k, v.decode]),
              )
            : {},
        });
        if (module.init) {
          await module.init();
        }
      } catch (e3) {
        {
          throw e3;
        }
      }
    })());
  }
  /**
   * @param {Request} request
   * @param {import('types').RequestOptions} options
   */
  async respond(request, options2) {
    return respond(request, this.#options, this.#manifest, {
      ...options2,
      error: false,
      depth: 0,
    });
  }
};

// .svelte-kit/cloudflare-tmp/manifest.js
var manifest = (() => {
  function __memo(fn) {
    let value;
    return () => (value ??= value = fn());
  }
  return {
    appDir: "_app",
    appPath: "_app",
    assets: /* @__PURE__ */ new Set([]),
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
        __memo(() => Promise.resolve().then(() => (init__(), __exports))),
        __memo(() => Promise.resolve().then(() => (init__2(), __exports2))),
        __memo(() => Promise.resolve().then(() => (init__3(), __exports3))),
        __memo(() => Promise.resolve().then(() => (init__4(), __exports4))),
        __memo(() => Promise.resolve().then(() => (init__5(), __exports5))),
        __memo(() => Promise.resolve().then(() => (init__6(), __exports6))),
        __memo(() => Promise.resolve().then(() => (init__7(), __exports7))),
        __memo(() => Promise.resolve().then(() => (init__8(), __exports8))),
        __memo(() => Promise.resolve().then(() => (init__9(), __exports9))),
        __memo(() => Promise.resolve().then(() => (init__10(), __exports10))),
        __memo(() => Promise.resolve().then(() => (init__11(), __exports11))),
        __memo(() => Promise.resolve().then(() => (init__12(), __exports12))),
        __memo(() => Promise.resolve().then(() => (init__13(), __exports13))),
        __memo(() => Promise.resolve().then(() => (init__14(), __exports14))),
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
          endpoint: __memo(() =>
            Promise.resolve().then(() => (init_server_ts(), server_ts_exports)),
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
      prerendered_routes: /* @__PURE__ */ new Set([]),
      matchers: async () => {
        return {};
      },
      server_assets: {},
    },
  };
})();
var prerendered = /* @__PURE__ */ new Set([]);
var base_path = "";

// .svelte-kit/cloudflare-tmp/_worker.js
async function e(e3, t2) {
  let n2 = "string" != typeof t2 && "HEAD" === t2.method;
  n2 && (t2 = new Request(t2, { method: "GET" }));
  let r3 = await e3.match(t2);
  return (n2 && r3 && (r3 = new Response(null, r3)), r3);
}
function t(e3, t2, n2, o2) {
  return (
    ("string" == typeof t2 || "GET" === t2.method) &&
      r(n2) &&
      (n2.headers.has("Set-Cookie") &&
        (n2 = new Response(n2.body, n2)).headers.append(
          "Cache-Control",
          "private=Set-Cookie",
        ),
      o2.waitUntil(e3.put(t2, n2.clone()))),
    n2
  );
}
var n = /* @__PURE__ */ new Set([
  200, 203, 204, 300, 301, 404, 405, 410, 414, 501,
]);
function r(e3) {
  if (!n.has(e3.status)) return false;
  if (~(e3.headers.get("Vary") || "").indexOf("*")) return false;
  let t2 = e3.headers.get("Cache-Control") || "";
  return !/(private|no-cache|no-store)/i.test(t2);
}
function o(n2) {
  return async function (r3, o2) {
    let a = await e(n2, r3);
    if (a) return a;
    o2.defer((e3) => {
      t(n2, r3, e3, o2);
    });
  };
}
var s2 = caches.default;
var c = t.bind(0, s2);
var r2 = e.bind(0, s2);
var e2 = o.bind(0, s2);
var server = new Server(manifest);
var app_path = `/${manifest.appPath}`;
var immutable = `${app_path}/immutable/`;
var version_file = `${app_path}/version.json`;
var worker = {
  async fetch(req, env, context2) {
    await server.init({ env });
    let pragma = req.headers.get("cache-control") || "";
    let res = !pragma.includes("no-cache") && (await r2(req));
    if (res) return res;
    let { pathname, search } = new URL(req.url);
    try {
      pathname = decodeURIComponent(pathname);
    } catch {}
    const stripped_pathname = pathname.replace(/\/$/, "");
    let is_static_asset = false;
    const filename = stripped_pathname.slice(base_path.length + 1);
    if (filename) {
      is_static_asset =
        manifest.assets.has(filename) ||
        manifest.assets.has(filename + "/index.html") ||
        filename in manifest._.server_assets ||
        filename + "/index.html" in manifest._.server_assets;
    }
    let location = pathname.at(-1) === "/" ? stripped_pathname : pathname + "/";
    if (
      is_static_asset ||
      prerendered.has(pathname) ||
      pathname === version_file ||
      pathname.startsWith(immutable)
    ) {
      res = await env.ASSETS.fetch(req);
    } else if (location && prerendered.has(location)) {
      if (search) location += search;
      res = new Response("", {
        status: 308,
        headers: {
          location,
        },
      });
    } else {
      res = await server.respond(req, {
        // @ts-ignore
        platform: { env, context: context2, caches, cf: req.cf },
        getClientAddress() {
          return req.headers.get("cf-connecting-ip");
        },
      });
    }
    pragma = res.headers.get("cache-control") || "";
    return pragma && res.status < 400 ? c(req, res, context2) : res;
  },
};
var worker_default = worker;
export { worker_default as default };
/*! Bundled license information:

cookie/index.js:
  (*!
   * cookie
   * Copyright(c) 2012-2014 Roman Shtylman
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)
*/
//# sourceMappingURL=_worker.js.map
