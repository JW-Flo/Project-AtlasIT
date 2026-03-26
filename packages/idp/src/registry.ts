import {
  AdapterRegistrationOptions,
  IdpAdapter,
  ListedAdapter,
  RegisteredAdapter,
} from "./types.js";

type RegistryEntry = RegisteredAdapter;

const registry = new Map<string, RegistryEntry>();

function toListedAdapter(entry: RegistryEntry): ListedAdapter {
  const enabled = process.env[entry.flagEnvVar] === "1";
  return { ...entry, enabled };
}

export function registerAdapter(
  id: string,
  impl: IdpAdapter,
  options: AdapterRegistrationOptions,
): void {
  const adapterId = id?.trim();
  if (!adapterId) {
    throw new Error("Adapter id is required");
  }
  if (!impl) {
    throw new Error(`Adapter implementation is required for \"${adapterId}\"`);
  }
  if (!options?.flagEnvVar) {
    throw new Error(`flagEnvVar is required for adapter \"${adapterId}\"`);
  }

  registry.set(adapterId, {
    id: adapterId,
    impl,
    flagEnvVar: options.flagEnvVar,
  });
}

export function getAdapter(id: string): IdpAdapter {
  const entry = registry.get(id);
  if (!entry) {
    throw new Error(`Adapter \"${id}\" is not registered`);
  }
  return entry.impl;
}

export function getRegistration(id: string): RegisteredAdapter | undefined {
  return registry.get(id);
}

export interface ListAdaptersOptions {
  enabledOnly?: boolean;
}

export function listAdapters(
  options: ListAdaptersOptions = {},
): ListedAdapter[] {
  const entries = Array.from(registry.values()).map(toListedAdapter);
  return options.enabledOnly
    ? entries.filter((entry) => entry.enabled)
    : entries;
}

export function clearRegistry(): void {
  registry.clear();
}

export function isAdapterEnabled(id: string): boolean {
  const entry = registry.get(id);
  if (!entry) {
    return false;
  }
  return process.env[entry.flagEnvVar] === "1";
}

export function getRegisteredAdapters(): ListedAdapter[] {
  return listAdapters();
}
