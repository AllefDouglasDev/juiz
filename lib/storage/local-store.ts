// Shared observable store over localStorage. All app-state writes flow
// through here so the sync engine can publish local changes to Firebase and
// inject remote ones back (source "remote" is never re-published).

export type WriteSource = "local" | "remote";

type Publisher = (key: string, value: unknown) => void;

const listenersByKey = new Map<string, Set<() => void>>();

// getSnapshot must return a referentially stable value, so parsed results
// are cached per key and only recomputed when the raw string changes.
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

let publisher: Publisher | null = null;

// The sync engine registers itself here; keys it doesn't know are ignored.
export function registerPublisher(fn: Publisher | null): void {
  publisher = fn;
}

function emit(key: string) {
  listenersByKey.get(key)?.forEach((listener) => listener());
}

export function getStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = window.localStorage.getItem(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) {
    return cached.value as T;
  }
  // Absent keys are not cached: different callers may use different
  // fallbacks for the same key, and fallbacks are already stable values.
  if (raw === null) {
    return fallback;
  }
  try {
    const value = JSON.parse(raw) as T;
    snapshotCache.set(key, { raw, value });
    return value;
  } catch {
    return fallback;
  }
}

export function setStoredValue<T>(
  key: string,
  value: T,
  opts?: { source?: WriteSource }
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable — value is lost on reload, but the UI still works.
    snapshotCache.set(key, { raw: null, value });
  }
  emit(key);
  if ((opts?.source ?? "local") === "local") {
    publisher?.(key, value);
  }
}

// Removing the key (instead of writing "null") lets each consumer's own
// fallback apply again — the right meaning for "this node no longer exists".
export function removeStoredValue(
  key: string,
  opts?: { source?: WriteSource }
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable — nothing to remove.
  }
  snapshotCache.delete(key);
  emit(key);
  if ((opts?.source ?? "local") === "local") {
    publisher?.(key, null);
  }
}

export function subscribeToKey(key: string, listener: () => void): () => void {
  let listeners = listenersByKey.get(key);
  if (!listeners) {
    listeners = new Set();
    listenersByKey.set(key, listeners);
  }
  listeners.add(listener);
  // Keep multiple tabs in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) emit(key);
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
