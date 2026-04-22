<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-svelte";
  import { cn } from "$lib/utils";

  type ColumnDef = {
    key: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    render?: (value: any, row: any) => string;
    class?: string;
  };

  export let columns: ColumnDef[];
  export let data: any[];
  export let rowKey = "id";
  export let emptyMessage = "No data available";
  export let filterPlaceholder = "Filter...";

  const dispatch = createEventDispatcher();

  let filterText = "";
  let sortColumn: string | null = null;
  let sortDirection: "asc" | "desc" = "asc";

  // Filter data
  $: filteredData = data.filter((row) => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return columns.some((col) => {
      if (col.filterable === false) return false;
      const value = row[col.key];
      if (value == null) return false;
      return String(value).toLowerCase().includes(searchLower);
    });
  });

  // Sort data
  $: sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal == bVal) return 0;
    const cmp = aVal < bVal ? -1 : 1;
    return sortDirection === "asc" ? cmp : -cmp;
  });

  function handleSort(columnKey: string) {
    const column = columns.find((c) => c.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = columnKey;
      sortDirection = "asc";
    }
  }

  function getCellValue(row: any, column: ColumnDef): string {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    return value ?? "";
  }

  function handleRowClick(row: any) {
    dispatch("rowClick", row);
  }
</script>

<div class="space-y-3">
  <!-- Filter input -->
  <div class="relative">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <input
      type="text"
      bind:value={filterText}
      placeholder={filterPlaceholder}
      class="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
    />
  </div>

  <!-- Table -->
  <div class="border border-border rounded-lg overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-muted/50 border-b border-border">
          <tr>
            {#each columns as column}
              <th
                class={cn(
                  "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                  column.sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
                  column.class
                )}
                on:click={() => handleSort(column.key)}
              >
                <div class="flex items-center gap-2">
                  <span>{column.label}</span>
                  {#if column.sortable}
                    {#if sortColumn === column.key}
                      {#if sortDirection === "asc"}
                        <ArrowUp class="h-3.5 w-3.5" />
                      {:else}
                        <ArrowDown class="h-3.5 w-3.5" />
                      {/if}
                    {:else}
                      <ArrowUpDown class="h-3.5 w-3.5 opacity-30" />
                    {/if}
                  {/if}
                </div>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="bg-background divide-y divide-border">
          {#if sortedData.length === 0}
            <tr>
              <td colspan={columns.length} class="px-4 py-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          {:else}
            {#each sortedData as row (row[rowKey])}
              <tr
                class="hover:bg-muted/30 transition-colors cursor-pointer"
                on:click={() => handleRowClick(row)}
              >
                {#each columns as column}
                  <td class={cn("px-4 py-3 text-sm text-foreground", column.class)}>
                    {@html getCellValue(row, column)}
                  </td>
                {/each}
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Results count -->
  {#if filterText || sortColumn}
    <div class="text-xs text-muted-foreground text-center">
      Showing {sortedData.length} of {data.length} {data.length === 1 ? 'row' : 'rows'}
    </div>
  {/if}
</div>
