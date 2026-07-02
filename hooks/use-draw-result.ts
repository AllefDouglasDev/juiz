"use client";

import { useLocalStorageState } from "./use-local-storage-state";
import type { DrawResult } from "@/lib/types";

const NO_RESULT: DrawResult | null = null;

export function useDrawResult() {
  return useLocalStorageState<DrawResult | null>("juiz:draw:result", NO_RESULT);
}
