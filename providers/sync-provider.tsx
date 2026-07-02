"use client";

import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PLAYERS_QUERY_KEY } from "@/hooks/use-players";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { subscribeToKey } from "@/lib/storage/local-store";
import { startSync, stopSync } from "@/lib/sync/sync-engine";
import {
  normalizeWorkspaceCode,
  WORKSPACE_ENABLED_KEY,
  WORKSPACE_KEY,
} from "@/lib/sync/workspace";

export function SyncProvider({ children }: { children: ReactNode }) {
  const [rawCode] = useLocalStorageState(WORKSPACE_KEY, "");
  const [enabled] = useLocalStorageState(WORKSPACE_ENABLED_KEY, true);
  const code = normalizeWorkspaceCode(rawCode);
  const queryClient = useQueryClient();

  // A saved code with sync toggled off means "use this device only" — skip
  // startSync so no data is published or pulled.
  useEffect(() => {
    if (!code || !enabled) return;
    void startSync(code);
    return () => stopSync();
  }, [code, enabled]);

  // React Query caches the players list; refresh it whenever the underlying
  // store changes (remote sync or another tab).
  useEffect(
    () =>
      subscribeToKey("juiz:players", () => {
        void queryClient.invalidateQueries({ queryKey: PLAYERS_QUERY_KEY });
      }),
    [queryClient]
  );

  return <>{children}</>;
}
