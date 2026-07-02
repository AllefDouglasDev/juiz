"use client";

import { useCallback, useSyncExternalStore } from "react";

type Updater<T> = T | ((current: T) => T);

const listenersByKey = new Map<string, Set<() => void>>();

// getSnapshot must return a referentially stable value, so parsed results
// are cached per key and only recomputed when the raw string changes.
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function emit(key: string) {
  listenersByKey.get(key)?.forEach((listener) => listener());
}

function readSnapshot<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) {
    return cached.value as T;
  }
  let value: T;
  if (raw === null) {
    value = fallback;
  } else {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

// For device-local preferences that will never move to the shared database
// (draw settings, last draw result, timer duration). `fallback` must be a
// stable module-level value, or SSR/client snapshots will disagree.
export function useLocalStorageState<T>(key: string, fallback: T) {
  const subscribe = useCallback(
    (listener: () => void) => {
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
    },
    [key]
  );

  const value = useSyncExternalStore(
    subscribe,
    () => readSnapshot(key, fallback),
    () => fallback
  );

  const setValue = useCallback(
    (updater: Updater<T>) => {
      const current = readSnapshot(key, fallback);
      const next =
        typeof updater === "function"
          ? (updater as (c: T) => T)(current)
          : updater;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage unavailable — value is lost on reload, but the UI still works.
        snapshotCache.set(key, { raw: null, value: next });
      }
      emit(key);
    },
    [key, fallback]
  );

  return [value, setValue] as const;
}
