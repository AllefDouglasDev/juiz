"use client";

import { useCallback } from "react";
import { useLocalStorageState } from "./use-local-storage-state";
import { serverNow } from "@/lib/firebase/client";
import {
  DEFAULT_SCORE,
  MAX_GOALS,
  type MatchScore,
  type TeamColor,
} from "@/lib/types";

const SCORE_KEY = "juiz:score";

type Team = "home" | "away";

const clampGoals = (goals: number) => Math.min(MAX_GOALS, Math.max(0, goals));

// Shared scoreboard over a MatchScore in the local store. Writes are mirrored
// to Firebase when a workspace code is active (registered in the sync engine),
// so every device with the same code sees the same placar. Nothing is written
// except on user actions, and every write stamps updatedAt with the server
// clock — matching how MatchState is handled.
export function useMatchScore() {
  const [score, setScore] = useLocalStorageState<MatchScore>(
    SCORE_KEY,
    DEFAULT_SCORE
  );

  const addGoal = useCallback(
    (team: Team) => {
      setScore((s) => ({
        ...s,
        [team]: { ...s[team], goals: clampGoals(s[team].goals + 1) },
        updatedAt: serverNow(),
      }));
    },
    [setScore]
  );

  const removeGoal = useCallback(
    (team: Team) => {
      setScore((s) => ({
        ...s,
        [team]: { ...s[team], goals: clampGoals(s[team].goals - 1) },
        updatedAt: serverNow(),
      }));
    },
    [setScore]
  );

  const setColor = useCallback(
    (team: Team, color: TeamColor) => {
      setScore((s) => ({
        ...s,
        [team]: { ...s[team], color },
        updatedAt: serverNow(),
      }));
    },
    [setScore]
  );

  const reset = useCallback(() => {
    setScore((s) => ({
      home: { ...s.home, goals: 0 },
      away: { ...s.away, goals: 0 },
      updatedAt: serverNow(),
    }));
  }, [setScore]);

  return { score, addGoal, removeGoal, setColor, reset };
}
