"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorageState } from "./use-local-storage-state";
import { serverNow } from "@/lib/firebase/client";
import {
  DEFAULT_DURATION_MIN,
  type MatchState,
  type MatchStatus,
} from "@/lib/types";

const MATCH_KEY = "juiz:match";
const LEGACY_DURATION_KEY = "juiz:timer:duration";
const TICK_MS = 250;
// A finish detected this long after endAt means the app was closed/asleep
// when time ran out — finish silently instead of blasting the whistle.
const STALE_FINISH_MS = 3_000;

const DEFAULT_MATCH: MatchState = {
  status: "idle",
  endAt: null,
  remainingMs: DEFAULT_DURATION_MIN * 60_000,
  elapsedBeforeMs: 0,
  runStartedAt: null,
  durationMin: DEFAULT_DURATION_MIN,
  updatedAt: 0,
};

// One-time migration: the duration used to live on its own key. Written
// straight to localStorage on module load — before the sync engine starts —
// so it can never overwrite a workspace's live match in Firebase.
if (typeof window !== "undefined") {
  try {
    if (window.localStorage.getItem(MATCH_KEY) === null) {
      const legacy = window.localStorage.getItem(LEGACY_DURATION_KEY);
      const durationMin = legacy === null ? NaN : Number(JSON.parse(legacy));
      if (Number.isFinite(durationMin) && durationMin >= 1 && durationMin <= 60) {
        window.localStorage.setItem(
          MATCH_KEY,
          JSON.stringify({
            ...DEFAULT_MATCH,
            durationMin,
            remainingMs: durationMin * 60_000,
          })
        );
      }
    }
  } catch {
    // Ignore — worst case the user re-picks the duration.
  }
}

// Timestamp-based countdown over a shared MatchState: remaining time is
// always recomputed from an absolute endAt (server clock), so every device
// with the same workspace code shows the same clock, and interval drift or
// background-tab throttling never make it wrong. The 250ms tick only drives
// rendering — nothing is written to the store except on user actions.
export function useMatchState(onFinish: () => void) {
  const [match, setMatch] = useLocalStorageState<MatchState>(
    MATCH_KEY,
    DEFAULT_MATCH
  );
  const [now, setNow] = useState(() => serverNow());

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const finishWrittenRef = useRef(false);
  const skipFinishWhistleRef = useRef(false);
  const prevStatusRef = useRef<MatchStatus | null>(null);

  // The whistle fires on any live running→finished transition — whether this
  // device's tick crossed endAt or another device finished first.
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = match.status;
    if (match.status !== "finished") {
      skipFinishWhistleRef.current = false;
      return;
    }
    if (prev !== "running") return;
    if (skipFinishWhistleRef.current) {
      skipFinishWhistleRef.current = false;
      return;
    }
    onFinishRef.current();
  }, [match.status]);

  useEffect(() => {
    if (match.status !== "running" || match.endAt === null) return;
    finishWrittenRef.current = false;
    const endAt = match.endAt;
    const runStartedAt = match.runStartedAt ?? endAt;
    // Already expired when this effect starts = we're rehydrating an old
    // running state (reload, or joining a code after the match ended).
    const staleAtStart = serverNow() - endAt > STALE_FINISH_MS;

    const tick = () => {
      const current = serverNow();
      if (current < endAt) {
        setNow(current);
        return;
      }
      if (finishWrittenRef.current) return;
      finishWrittenRef.current = true;
      if (staleAtStart) skipFinishWhistleRef.current = true;
      setMatch((s) =>
        s.status !== "running"
          ? s
          : {
              ...s,
              status: "finished",
              endAt: null,
              remainingMs: 0,
              elapsedBeforeMs:
                s.elapsedBeforeMs + Math.max(0, endAt - runStartedAt),
              runStartedAt: null,
              updatedAt: current,
            }
      );
    };

    tick();
    const id = setInterval(tick, TICK_MS);
    // Catch up immediately when the tab becomes visible again.
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [match.status, match.endAt, match.runStartedAt, setMatch]);

  const start = useCallback(() => {
    setMatch((s) => {
      if (s.status === "running" || s.status === "finished") return s;
      const current = serverNow();
      return {
        ...s,
        status: "running",
        endAt: current + s.remainingMs,
        runStartedAt: current,
        updatedAt: current,
      };
    });
  }, [setMatch]);

  const pause = useCallback(() => {
    setMatch((s) => {
      if (s.status !== "running" || s.endAt === null || s.runStartedAt === null) {
        return s;
      }
      const current = serverNow();
      return {
        ...s,
        status: "paused",
        endAt: null,
        remainingMs: Math.max(0, s.endAt - current),
        elapsedBeforeMs: s.elapsedBeforeMs + Math.max(0, current - s.runStartedAt),
        runStartedAt: null,
        updatedAt: current,
      };
    });
  }, [setMatch]);

  const reset = useCallback(() => {
    setMatch((s) => ({
      ...s,
      status: "idle",
      endAt: null,
      remainingMs: s.durationMin * 60_000,
      elapsedBeforeMs: 0,
      runStartedAt: null,
      updatedAt: serverNow(),
    }));
  }, [setMatch]);

  const addTime = useCallback(
    (ms: number) => {
      setMatch((s) => {
        const current = serverNow();
        switch (s.status) {
          case "running":
            return { ...s, endAt: (s.endAt ?? current) + ms, updatedAt: current };
          case "paused":
          case "idle":
            return { ...s, remainingMs: s.remainingMs + ms, updatedAt: current };
          case "finished":
            // Extending after full time: resume immediately with the added time.
            return {
              ...s,
              status: "running",
              endAt: current + ms,
              remainingMs: ms,
              runStartedAt: current,
              updatedAt: current,
            };
        }
      });
    },
    [setMatch]
  );

  const setDuration = useCallback(
    (durationMin: number) => {
      setMatch((s) =>
        s.status !== "idle"
          ? s
          : {
              ...s,
              durationMin,
              remainingMs: durationMin * 60_000,
              updatedAt: serverNow(),
            }
      );
    },
    [setMatch]
  );

  const remainingMs =
    match.status === "running" && match.endAt !== null
      ? Math.max(0, match.endAt - now)
      : match.remainingMs;
  const elapsedMs =
    match.status === "running" && match.runStartedAt !== null
      ? match.elapsedBeforeMs + Math.max(0, now - match.runStartedAt)
      : match.elapsedBeforeMs;

  return {
    status: match.status,
    remainingMs,
    elapsedMs,
    durationMin: match.durationMin,
    start,
    pause,
    reset,
    addTime,
    setDuration,
  };
}
