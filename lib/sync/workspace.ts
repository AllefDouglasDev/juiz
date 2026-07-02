export const WORKSPACE_KEY = "juiz:workspace";

// Firebase RTDB keys can't contain . # $ [ ] / — restrict codes to a safe
// slug. Must match the `.write` rule in firebase/database.rules.json.
const CODE_PATTERN = /^[a-z0-9_-]{4,64}$/;

export function normalizeWorkspaceCode(raw: string): string | null {
  const code = raw.trim().toLowerCase();
  return CODE_PATTERN.test(code) ? code : null;
}
