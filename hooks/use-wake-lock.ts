"use client";

import { useEffect } from "react";

// Keeps the screen on while `active` (e.g. match timer running).
// Supported on iOS ≥ 16.4; silently does nothing elsewhere.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel = lock;
      } catch {
        // Denied (low battery / unsupported) — screen just dims as usual.
      }
    };

    void acquire();
    // The lock is auto-released when the tab is hidden; re-acquire on return.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
