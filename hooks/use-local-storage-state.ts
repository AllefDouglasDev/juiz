"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getStoredValue,
  setStoredValue,
  subscribeToKey,
} from "@/lib/storage/local-store";

type Updater<T> = T | ((current: T) => T);

// Thin hook over the shared local store. Keys registered in the sync engine
// (players, draw, match) are mirrored to Firebase when a workspace code is
// set; every other key stays device-local. `fallback` must be a stable
// module-level value, or SSR/client snapshots will disagree.
export function useLocalStorageState<T>(key: string, fallback: T) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeToKey(key, listener),
    [key]
  );

  const value = useSyncExternalStore(
    subscribe,
    () => getStoredValue(key, fallback),
    () => fallback
  );

  const setValue = useCallback(
    (updater: Updater<T>) => {
      const current = getStoredValue(key, fallback);
      const next =
        typeof updater === "function"
          ? (updater as (c: T) => T)(current)
          : updater;
      setStoredValue(key, next);
    },
    [key, fallback]
  );

  return [value, setValue] as const;
}
