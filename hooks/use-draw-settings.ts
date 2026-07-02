"use client";

import { useLocalStorageState } from "./use-local-storage-state";
import type { DrawSettings } from "@/lib/types";

const DEFAULT_DRAW_SETTINGS: DrawSettings = {
  teamCount: 2,
  playersPerTeam: 4,
  useStrength: false,
};

export function useDrawSettings() {
  return useLocalStorageState<DrawSettings>(
    "juiz:draw:settings",
    DEFAULT_DRAW_SETTINGS
  );
}
