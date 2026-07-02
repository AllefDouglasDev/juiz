import type { DrawnTeam } from "@/lib/types";

interface TeamCardProps {
  team: DrawnTeam;
  showStrength: boolean;
}

export function TeamCard({ team, showStrength }: TeamCardProps) {
  return (
    <div className="rounded-2xl border border-foreground/10 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-bold">{team.name}</h3>
        {showStrength && (
          <span className="text-sm text-foreground/50">
            Força {team.totalStrength}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-1">
        {team.players.map((player) => (
          <li key={player.id} className="flex items-center justify-between">
            <span className="truncate">{player.name}</span>
            {showStrength && (
              <span aria-label={`Força ${player.strength}`} className="text-xs text-amber-500">
                {"★".repeat(player.strength)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
