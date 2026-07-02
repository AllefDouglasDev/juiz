export type Strength = 1 | 2 | 3 | 4 | 5;

export const DEFAULT_STRENGTH: Strength = 3;

export interface Player {
  id: string;
  name: string;
  strength: Strength;
  inGame: boolean;
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
