export interface ControlItem {
  key: string;
  name: string;
  framework?: string;
  tags?: string[];
}

// Simple filter over control list by query (matches key or name substring case-insensitive)
export function filterControls(
  items: ControlItem[],
  query: string,
): ControlItem[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (i) =>
      i.key.toLowerCase().includes(q) ||
      (i.name && i.name.toLowerCase().includes(q)),
  );
}
