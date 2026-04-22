import { w as writable } from './index-C1X1AO8K.js';

const { subscribe, update } = writable([]);
const toasts = { subscribe };
function push(toast) {
  const id = crypto.randomUUID();
  const ttl = toast.ttl ?? 4e3;
  update((list) => [...list, { ...toast, id, ttl }]);
  if (ttl > 0) setTimeout(() => dismiss(id), ttl);
  return id;
}
function dismiss(id) {
  update((list) => list.filter((t) => t.id !== id));
}

export { push as p, toasts as t };
//# sourceMappingURL=toastStore-X6rW096m.js.map
