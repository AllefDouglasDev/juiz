export const WORKSPACE_KEY = "juiz:workspace";
// Device-local preferences (not synced to Firebase): whether sync is on even
// when a code is saved, and the list of recently used codes.
export const WORKSPACE_ENABLED_KEY = "juiz:workspace:enabled";
export const WORKSPACE_HISTORY_KEY = "juiz:workspace:history";
export const HISTORY_LIMIT = 5;
// Stable module-level fallback for useLocalStorageState (SSR-safe).
export const EMPTY_HISTORY: string[] = [];

// Firebase RTDB keys can't contain . # $ [ ] / — restrict codes to a safe
// slug. Must match the `.write` rule in firebase/database.rules.json.
const CODE_PATTERN = /^[a-z0-9_-]{4,64}$/;

export function normalizeWorkspaceCode(raw: string): string | null {
  const code = raw.trim().toLowerCase();
  return CODE_PATTERN.test(code) ? code : null;
}

// Most-recent-first, de-duplicated, capped at HISTORY_LIMIT.
export function addToHistory(history: string[], code: string): string[] {
  return [code, ...history.filter((c) => c !== code)].slice(0, HISTORY_LIMIT);
}
