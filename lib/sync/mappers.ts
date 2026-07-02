import {
  DEFAULT_DURATION_MIN,
  DEFAULT_SCORE,
  DEFAULT_STRENGTH,
  MAX_GOALS,
  TEAM_COLORS,
  type MatchScore,
  type MatchState,
  type Player,
  type Strength,
  type TeamColor,
  type TeamScore,
} from "@/lib/types";

// Players live keyed-by-id in Firebase (not as an array) so that two phones
// adding players at the same time merge instead of overwriting each other.
export interface RemotePlayer {
  name: string;
  strength: Strength;
  inGame: boolean;
  createdAt?: number;
}

export function playerToRemote(player: Player): RemotePlayer {
  const remote: RemotePlayer = {
    name: player.name,
    strength: player.strength,
    inGame: player.inGame,
  };
  if (player.createdAt !== undefined) {
    remote.createdAt = player.createdAt;
  }
  return remote;
}

export function playersToRecord(players: Player[]): Record<string, RemotePlayer> {
  const record: Record<string, RemotePlayer> = {};
  for (const player of players) {
    record[player.id] = playerToRemote(player);
  }
  return record;
}

// Firebase objects don't preserve insertion order, so rebuild a stable one.
export function recordToPlayers(raw: unknown): Player[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }
  const players: Player[] = [];
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const remote = value as Partial<RemotePlayer>;
    if (typeof remote.name !== "string") continue;
    const player: Player = {
      id,
      name: remote.name,
      strength:
        typeof remote.strength === "number"
          ? (remote.strength as Strength)
          : DEFAULT_STRENGTH,
      inGame: remote.inGame === true,
    };
    if (typeof remote.createdAt === "number") {
      player.createdAt = remote.createdAt;
    }
    players.push(player);
  }
  players.sort(
    (a, b) =>
      (a.createdAt ?? 0) - (b.createdAt ?? 0) || a.name.localeCompare(b.name)
  );
  return players;
}

// Firebase drops null values, so nullable timestamps are omitted on the way
// up and restored on the way down.
export function matchToRemote(match: MatchState): Record<string, unknown> {
  const remote: Record<string, unknown> = {
    status: match.status,
    remainingMs: match.remainingMs,
    elapsedBeforeMs: match.elapsedBeforeMs,
    durationMin: match.durationMin,
    updatedAt: match.updatedAt,
  };
  if (match.endAt !== null) remote.endAt = match.endAt;
  if (match.runStartedAt !== null) remote.runStartedAt = match.runStartedAt;
  return remote;
}

export function remoteToMatch(raw: unknown): MatchState | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const remote = raw as Record<string, unknown>;
  const status = remote.status;
  if (
    status !== "idle" &&
    status !== "running" &&
    status !== "paused" &&
    status !== "finished"
  ) {
    return null;
  }
  return {
    status,
    endAt: typeof remote.endAt === "number" ? remote.endAt : null,
    remainingMs:
      typeof remote.remainingMs === "number" ? remote.remainingMs : 0,
    elapsedBeforeMs:
      typeof remote.elapsedBeforeMs === "number" ? remote.elapsedBeforeMs : 0,
    runStartedAt:
      typeof remote.runStartedAt === "number" ? remote.runStartedAt : null,
    durationMin:
      typeof remote.durationMin === "number"
        ? remote.durationMin
        : DEFAULT_DURATION_MIN,
    updatedAt: typeof remote.updatedAt === "number" ? remote.updatedAt : 0,
  };
}

// The scoreboard is a flat object of scalars, so serialization is a straight
// copy — but each field is normalized on the way down (color validated against
// the allowed set, goals clamped) so a malformed remote can't corrupt the UI.
export function scoreToRemote(score: MatchScore): Record<string, unknown> {
  return {
    home: { color: score.home.color, goals: score.home.goals },
    away: { color: score.away.color, goals: score.away.goals },
    updatedAt: score.updatedAt,
  };
}

function remoteToTeamScore(raw: unknown, fallback: TeamScore): TeamScore {
  if (!raw || typeof raw !== "object") return fallback;
  const remote = raw as Record<string, unknown>;
  const color = TEAM_COLORS.includes(remote.color as TeamColor)
    ? (remote.color as TeamColor)
    : fallback.color;
  const goals =
    typeof remote.goals === "number"
      ? Math.min(MAX_GOALS, Math.max(0, Math.round(remote.goals)))
      : fallback.goals;
  return { color, goals };
}

export function remoteToScore(raw: unknown): MatchScore | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const remote = raw as Record<string, unknown>;
  return {
    home: remoteToTeamScore(remote.home, DEFAULT_SCORE.home),
    away: remoteToTeamScore(remote.away, DEFAULT_SCORE.away),
    updatedAt: typeof remote.updatedAt === "number" ? remote.updatedAt : 0,
  };
}
