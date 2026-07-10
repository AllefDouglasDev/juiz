// Pure edits over a DrawResult — runtime-dependency-free so they can be tested
// standalone and reused by both the draw screen and the "Times" dialog.
import { shuffle } from "@/lib/draw/draw-teams";
import type { DrawResult, DrawnPlayer, DrawnTeam } from "@/lib/types";

// A player's location inside a DrawResult.
export interface PlayerRef {
  teamIndex: number;
  playerIndex: number;
}

export function teamStrength(players: readonly DrawnPlayer[]): number {
  return players.reduce((sum, player) => sum + player.strength, 0);
}

function withPlayers(team: DrawnTeam, players: DrawnPlayer[]): DrawnTeam {
  return { ...team, players, totalStrength: teamStrength(players) };
}

// Exchange two players. Works across teams (swap teams) and within the same
// team (swap positions). Returns a new, immutable DrawResult.
export function swapPlayers(
  result: DrawResult,
  a: PlayerRef,
  b: PlayerRef
): DrawResult {
  const teams = result.teams.map((team) => ({
    ...team,
    players: [...team.players],
  }));

  const playerA = teams[a.teamIndex]?.players[a.playerIndex];
  const playerB = teams[b.teamIndex]?.players[b.playerIndex];
  if (!playerA || !playerB) return result;

  teams[a.teamIndex].players[a.playerIndex] = playerB;
  teams[b.teamIndex].players[b.playerIndex] = playerA;

  const affected = new Set([a.teamIndex, b.teamIndex]);
  return {
    ...result,
    teams: teams.map((team, index) =>
      affected.has(index) ? withPlayers(team, team.players) : team
    ),
  };
}

// Replace the player at `target` with `incoming` (a reserve). The replaced
// player leaves the team; callers derive the new bench from "players not in any
// team", so it reappears there automatically.
export function substitutePlayer(
  result: DrawResult,
  target: PlayerRef,
  incoming: DrawnPlayer
): DrawResult {
  const team = result.teams[target.teamIndex];
  if (!team || !team.players[target.playerIndex]) return result;

  const players = team.players.map((player, index) =>
    index === target.playerIndex ? incoming : player
  );

  return {
    ...result,
    teams: result.teams.map((current, index) =>
      index === target.teamIndex ? withPlayers(current, players) : current
    ),
  };
}

// Append a reserve to a team (grows the team by one). No-op if the player is
// already there. Callers derive the bench from "players not in any team", so
// the reserve leaves the bench automatically.
export function addPlayerToTeam(
  result: DrawResult,
  teamIndex: number,
  player: DrawnPlayer
): DrawResult {
  const team = result.teams[teamIndex];
  if (!team) return result;
  if (team.players.some((current) => current.id === player.id)) return result;

  const players = [...team.players, player];
  return {
    ...result,
    teams: result.teams.map((current, index) =>
      index === teamIndex ? withPlayers(current, players) : current
    ),
  };
}

// Remove the player at `ref` from its team (shrinks the team). The player
// reappears on the bench, which is derived from "players not in any team".
export function removePlayerFromTeam(
  result: DrawResult,
  ref: PlayerRef
): DrawResult {
  const team = result.teams[ref.teamIndex];
  if (!team || !team.players[ref.playerIndex]) return result;

  const players = team.players.filter((_, index) => index !== ref.playerIndex);
  return {
    ...result,
    teams: result.teams.map((current, index) =>
      index === ref.teamIndex ? withPlayers(current, players) : current
    ),
  };
}

// Randomly pick `count` players from a team; the rest are "left out". Purely a
// suggestion — does not mutate the team.
export function drawSubset(
  players: readonly DrawnPlayer[],
  count: number
): { selected: DrawnPlayer[]; left: DrawnPlayer[] } {
  const shuffled = shuffle(players);
  const clamped = Math.max(0, Math.min(count, shuffled.length));
  return {
    selected: shuffled.slice(0, clamped),
    left: shuffled.slice(clamped),
  };
}
