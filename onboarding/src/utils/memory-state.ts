// Simple in-memory fallback store for onboarding state used by tests
// This persists within the module isolate between fetches.
export const memoryState = new Map<string, string>();
