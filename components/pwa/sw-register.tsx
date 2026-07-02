"use client";

import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    // Dev builds change on every edit — a service worker would serve stale
    // assets, so register only in production.
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // Offline support is progressive enhancement — never break the app.
      });
  }, []);

  return null;
}
