"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CountdownStatus = "idle" | "running" | "paused" | "finished";

interface CountdownState {
  status: CountdownStatus;
  endAt: number | null; // wall-clock end while running
  remainingMs: number; // frozen remaining while paused/finished
  elapsedBeforeMs: number; // elapsed accumulated across previous runs
  runStartedAt: number | null;
}

const TICK_MS = 250;

// Timestamp-based countdown: remaining time is always recomputed from a
// wall-clock "now" (updated on every tick and action), so interval drift and
// background-tab throttling never make the clock wrong — a late tick just
// catches up.
export function useCountdown(durationMs: number, onFinish: () => void) {
  const [state, setState] = useState<CountdownState>({
    status: "idle",
    endAt: null,
    remainingMs: durationMs,
    elapsedBeforeMs: 0,
    runStartedAt: null,
  });
  const [now, setNow] = useState(0);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);
  const finishFiredRef = useRef(false);

  useEffect(() => {
    if (state.status !== "running" || state.endAt === null) return;
    const endAt = state.endAt;
    const runStartedAt = state.runStartedAt ?? endAt;

    const tick = () => {
      const current = Date.now();
      if (current >= endAt) {
        if (!finishFiredRef.current) {
          finishFiredRef.current = true;
          setState((s) =>
            s.status !== "running"
              ? s
              : {
                  status: "finished",
                  endAt: null,
                  remainingMs: 0,
                  elapsedBeforeMs: s.elapsedBeforeMs + (endAt - runStartedAt),
                  runStartedAt: null,
                }
          );
          onFinishRef.current();
        }
      } else {
        setNow(current);
      }
    };

    const id = setInterval(tick, TICK_MS);
    // Catch up immediately when the tab becomes visible again.
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [state.status, state.endAt, state.runStartedAt]);

  const start = useCallback(() => {
    finishFiredRef.current = false;
    const current = Date.now();
    setNow(current);
    setState((s) => {
      if (s.status === "running" || s.status === "finished") return s;
      const remaining = s.status === "idle" ? durationMs : s.remainingMs;
      return {
        status: "running",
        endAt: current + remaining,
        remainingMs: remaining,
        elapsedBeforeMs: s.elapsedBeforeMs,
        runStartedAt: current,
      };
    });
  }, [durationMs]);

  const pause = useCallback(() => {
    const current = Date.now();
    setState((s) => {
      if (s.status !== "running" || s.endAt === null || s.runStartedAt === null) {
        return s;
      }
      return {
        status: "paused",
        endAt: null,
        remainingMs: Math.max(0, s.endAt - current),
        elapsedBeforeMs: s.elapsedBeforeMs + (current - s.runStartedAt),
        runStartedAt: null,
      };
    });
  }, []);

  const reset = useCallback(() => {
    finishFiredRef.current = false;
    setState({
      status: "idle",
      endAt: null,
      remainingMs: durationMs,
      elapsedBeforeMs: 0,
      runStartedAt: null,
    });
  }, [durationMs]);

  const addTime = useCallback((ms: number) => {
    finishFiredRef.current = false;
    const current = Date.now();
    setNow(current);
    setState((s) => {
      switch (s.status) {
        case "running":
          return { ...s, endAt: (s.endAt ?? current) + ms };
        case "paused":
        case "idle":
          return { ...s, remainingMs: s.remainingMs + ms };
        case "finished":
          // Extending after full time: resume immediately with the added time.
          return {
            status: "running",
            endAt: current + ms,
            remainingMs: ms,
            elapsedBeforeMs: s.elapsedBeforeMs,
            runStartedAt: current,
          };
      }
    });
  }, []);

  const remainingMs =
    state.status === "running" && state.endAt !== null
      ? Math.max(0, state.endAt - now)
      : state.status === "idle"
        ? durationMs
        : state.remainingMs;
  const elapsedMs =
    state.status === "running" && state.runStartedAt !== null
      ? state.elapsedBeforeMs + Math.max(0, now - state.runStartedAt)
      : state.elapsedBeforeMs;

  return {
    status: state.status,
    remainingMs,
    elapsedMs,
    start,
    pause,
    reset,
    addTime,
  };
}
