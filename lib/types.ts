export type Strength = 1 | 2 | 3 | 4 | 5;

export const DEFAULT_STRENGTH: Strength = 3;

export interface Player {
  id: string;
  name: string;
  strength: Strength;
  inGame: boolean;
  // Ordering key when syncing (Firebase objects don't preserve insertion
  // order). Optional so pre-sync data keeps working.
  createdAt?: number;
}

export type NewPlayer = Omit<Player, "id">;

export interface DrawSettings {
  teamCount: number;
  playersPerTeam: number;
  useStrength: boolean;
}

// Snapshot of a player at draw time, so later edits/deletions
// can't corrupt a stored draw result.
export interface DrawnPlayer {
  id: string;
  name: string;
  strength: Strength;
}

export interface DrawnTeam {
  name: string;
  players: DrawnPlayer[];
  totalStrength: number;
}

export interface DrawResult {
  drawnAt: string;
  useStrength: boolean;
  teams: DrawnTeam[];
}

export const DEFAULT_DURATION_MIN = 10;

export type MatchStatus = "idle" | "running" | "paused" | "finished";

// The live match clock, shared across devices when a workspace code is set.
// Timestamps are absolute (server clock via serverNow()), so every device
// derives the same remaining time regardless of when it joined.
export interface MatchState {
  status: MatchStatus;
  endAt: number | null; // end timestamp while running
  remainingMs: number; // frozen remaining while idle/paused/finished
  elapsedBeforeMs: number; // elapsed accumulated across previous runs
  runStartedAt: number | null; // start timestamp of the current run
  durationMin: number;
  updatedAt: number; // when the last action happened (server clock)
}
