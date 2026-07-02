// Pure draw logic — runtime-dependency-free so it can be tested standalone.
import type { DrawResult, DrawSettings, DrawnTeam, Player } from "@/lib/types";

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// All teams get playersPerTeam except possibly the last, which takes the
// remainder. Teams that would be empty are dropped.
function computeTeamSizes(
  playerCount: number,
  teamCount: number,
  playersPerTeam: number
): number[] {
  const sizes: number[] = [];
  let remaining = playerCount;
  for (let i = 0; i < teamCount && remaining > 0; i++) {
    const size = Math.min(playersPerTeam, remaining);
    sizes.push(size);
    remaining -= size;
  }
  return sizes;
}

function dealSequentially(players: Player[], sizes: number[]): Player[][] {
  const teams: Player[][] = [];
  let offset = 0;
  for (const size of sizes) {
    teams.push(players.slice(offset, offset + size));
    offset += size;
  }
  return teams;
}

// Snake draft over players sorted by strength descending: 1..k, k..1, …
// The caller pre-shuffles, so ties in strength land in random order.
function snakeDraft(players: Player[], sizes: number[]): Player[][] {
  const sorted = [...players].sort((a, b) => b.strength - a.strength);
  const teams: Player[][] = sizes.map(() => []);
  let index = 0;
  let round = 0;
  while (index < sorted.length) {
    const order = teams.map((_, i) => i);
    if (round % 2 === 1) order.reverse();
    for (const teamIndex of order) {
      if (index >= sorted.length) break;
      if (teams[teamIndex].length < sizes[teamIndex]) {
        teams[teamIndex].push(sorted[index]);
        index += 1;
      }
    }
    round += 1;
  }
  return teams;
}

export function drawTeams(
  inGamePlayers: readonly Player[],
  settings: DrawSettings
): DrawResult {
  const shuffled = shuffle(inGamePlayers);
  const capacity = settings.teamCount * settings.playersPerTeam;
  const selected = shuffled.slice(0, Math.min(shuffled.length, capacity));
  const sizes = computeTeamSizes(
    selected.length,
    settings.teamCount,
    settings.playersPerTeam
  );

  const grouped = settings.useStrength
    ? snakeDraft(selected, sizes)
    : dealSequentially(selected, sizes);

  const teams: DrawnTeam[] = grouped.map((players, index) => ({
    name: `Time ${index + 1}`,
    players: players.map(({ id, name, strength }) => ({ id, name, strength })),
    totalStrength: players.reduce((sum, player) => sum + player.strength, 0),
  }));

  return {
    drawnAt: new Date().toISOString(),
    useStrength: settings.useStrength,
    teams,
  };
}
