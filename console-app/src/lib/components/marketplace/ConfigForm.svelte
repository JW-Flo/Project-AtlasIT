<script lang="ts">
  import type { ConfigField } from "$lib/api/marketplace";

  export let configFields: ConfigField[] = [];
  export let values: Record<string, unknown> = {};
  export let onSubmit: ((values: Record<string, unknown>) => void) | undefined =
    undefined;
  export let loading: boolean = false;
  export let submitLabel: string = "Save Configuration";

  let errors: Record<string, string> = {};

  function validate(): boolean {
    errors = {};
    for (const field of configFields) {
      const val = values[field.key];
      if (field.required && (val === undefined || val === null || val === "")) {
        errors[field.key] = `${field.label} is required`;
        continue;
      }
      if (val === undefined || val === null || val === "") continue;

      if (field.type === "number") {
        const num = Number(val);
        if (isNaN(num)) {
          errors[field.key] = `${field.label} must be a number`;
          continue;
        }
        if (field.validation?.min !== undefined && num < field.validation.min) {
          errors[field.key] = `Minimum value is ${field.validation.min}`;
        }
        if (field.validation?.max !== undefined && num > field.validation.max) {
          errors[field.key] = `Maximum value is ${field.validation.max}`;
        }
      }

      if (field.type === "url" && typeof val === "string") {
        try {
          new URL(val);
        } catch {
          errors[field.key] = "Must be a valid URL";
        }
      }

      if (field.type === "email" && typeof val === "string") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errors[field.key] = "Must be a valid email address";
        }
      }

      if (
        field.validation?.pattern &&
        typeof val === "string" &&
        !new RegExp(field.validation.pattern).test(val)
      ) {
        errors[field.key] = `Invalid format`;
      }
    }
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit?.(values);
  }

  function inputType(field: ConfigField): string {
    switch (field.type) {
      case "number":
        return "number";
      case "url":
        return "url";
      case "email":
        return "email";
      case "secret":
        return "password";
      default:
        return "text";
    }
  }

  function toggleMultiselect(key: string, optionValue: string) {
    const current = (values[key] as string[]) || [];
    if (current.includes(optionValue)) {
      values[key] = current.filter((v) => v !== optionValue);
    } else {
      values[key] = [...current, optionValue];
    }
    values = values;
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  {#each configFields as field}
    <div>
      <label
        class="block text-sm mb-1.5 font-medium"
        style="color: var(--color-text);"
        for="config-{field.key}"
      >
        {field.label}
        {#if field.required}<span class="text-red-400">*</span>{/if}
      </label>

      {#if field.description}
        <p class="text-[11px] mb-1.5" style="color: var(--color-text-dim);">
          {field.description}
        </p>
      {/if}

      {#if field.type === "boolean"}
        <label
          class="relative inline-flex items-center cursor-pointer gap-2"
          for="config-{field.key}"
        >
          <input
            type="checkbox"
            id="config-{field.key}"
            checked={!!values[field.key]}
            on:change={(e) => {
              values[field.key] = e.currentTarget.checked;
              values = values;
            }}
            class="sr-only peer"
          />
          <div
            class="w-9 h-5 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:rounded-full after:h-4 after:w-4 after:transition-all"
            style="background: {values[field.key]
              ? 'var(--color-accent)'
              : 'var(--color-border)'}; "
          >
            <div
              class="absolute top-[2px] start-[2px] rounded-full h-4 w-4 transition-transform bg-white"
              style="transform: translateX({values[field.key] ? '16px' : '0'});"
            ></div>
          </div>
          <span class="text-xs" style="color: var(--color-text-dim);">
            {values[field.key] ? "Enabled" : "Disabled"}
          </span>
        </label>
      {:else if field.type === "select"}
        <select
          id="config-{field.key}"
          class="w-full px-3 py-2 rounded text-sm appearance-none"
          style="background: var(--color-bg); border: 1px solid {errors[field.key]
            ? '#ef4444'
            : 'var(--color-border)'}; color: var(--color-text);"
          bind:value={values[field.key]}
        >
          <option value="">Select...</option>
          {#each field.options || [] as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      {:else if field.type === "multiselect"}
        <div class="space-y-1.5">
          {#each field.options || [] as opt}
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={((values[field.key] as string[]) || []).includes(
                  opt.value,
                )}
                on:change={() => toggleMultiselect(field.key, opt.value)}
                class="rounded"
                style="accent-color: var(--color-accent);"
              />
              <span class="text-xs" style="color: var(--color-text);">
                {opt.label}
              </span>
            </label>
          {/each}
        </div>
      {:else}
        <input
          id="config-{field.key}"
          type={inputType(field)}
          placeholder={field.placeholder || ""}
          class="w-full px-3 py-2 rounded text-sm"
          style="background: var(--color-bg); border: 1px solid {errors[field.key]
            ? '#ef4444'
            : 'var(--color-border)'}; color: var(--color-text);"
          bind:value={values[field.key]}
          min={field.validation?.min}
          max={field.validation?.max}
        />
      {/if}

      {#if errors[field.key]}
        <p class="text-[11px] mt-1 text-red-400">{errors[field.key]}</p>
      {/if}
    </div>
  {/each}

  {#if configFields.length > 0}
    <button
      type="submit"
      disabled={loading}
      class="w-full py-2.5 text-sm font-medium rounded text-white transition-colors disabled:opacity-50"
      style="background: var(--color-accent);"
    >
      {#if loading}
        Saving...
      {:else}
        {submitLabel}
      {/if}
    </button>
  {/if}
</form>
