import { Shuffle, Star } from "lucide-react";
import type { DrawnPlayer, DrawnTeam } from "@/lib/types";

interface TeamCardProps {
  team: DrawnTeam;
  showStrength: boolean;
  // Interaction (all optional — omitted = the original static card):
  teamIndex?: number;
  selectedPlayerId?: string | null;
  swappingIds?: ReadonlySet<string>;
  // Registers each player row's DOM node (used for the move animation).
  registerPlayerEl?: (id: string, el: HTMLElement | null) => void;
  onPlayerClick?: (
    teamIndex: number,
    playerIndex: number,
    player: DrawnPlayer
  ) => void;
  onSubDraw?: (teamIndex: number) => void;
  // Clicking the team title (used to add a selected reserve to this team).
  onTitleClick?: (teamIndex: number) => void;
  // Highlights the title as a drop target (a reserve is currently selected).
  titleActionable?: boolean;
}

function StrengthStars({ strength }: { strength: number }) {
  return (
    <span
      aria-label={`Força ${strength}`}
      className="flex gap-0.5 text-amber-500"
    >
      {Array.from({ length: strength }, (_, i) => (
        <Star key={i} size={12} fill="currentColor" strokeWidth={0} aria-hidden />
      ))}
    </span>
  );
}

export function TeamCard({
  team,
  showStrength,
  teamIndex,
  selectedPlayerId,
  swappingIds,
  registerPlayerEl,
  onPlayerClick,
  onSubDraw,
  onTitleClick,
  titleActionable = false,
}: TeamCardProps) {
  const interactive = onPlayerClick !== undefined && teamIndex !== undefined;
  const titleClickable = onTitleClick !== undefined && teamIndex !== undefined;

  return (
    <div className="rounded-2xl border border-foreground/10 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        {titleClickable ? (
          <button
            type="button"
            onClick={() => onTitleClick(teamIndex)}
            aria-label={`Incluir reserva selecionada no ${team.name}`}
            className={`-mx-1 rounded-lg px-1 text-left text-base font-bold transition-colors ${
              titleActionable
                ? "player-selected"
                : "active:bg-foreground/10"
            }`}
          >
            {team.name}
          </button>
        ) : (
          <h3 className="text-base font-bold">{team.name}</h3>
        )}
        <div className="flex items-center gap-2">
          {showStrength && (
            <span className="text-sm text-foreground/50">
              Força {team.totalStrength}
            </span>
          )}
          {onSubDraw && teamIndex !== undefined && team.players.length > 1 && (
            <button
              type="button"
              onClick={() => onSubDraw(teamIndex)}
              aria-label={`Sortear dentro do ${team.name}`}
              className="flex size-9 items-center justify-center rounded-lg text-foreground/60 active:bg-foreground/10"
            >
              <Shuffle size={18} aria-hidden />
            </button>
          )}
        </div>
      </div>
      <ul className="flex flex-col gap-1">
        {team.players.map((player, playerIndex) => {
          const content = (
            <>
              <span className="truncate">{player.name}</span>
              {showStrength && <StrengthStars strength={player.strength} />}
            </>
          );

          if (!interactive) {
            return (
              <li
                key={player.id}
                className="flex items-center justify-between gap-2"
              >
                {content}
              </li>
            );
          }

          const selected = player.id === selectedPlayerId;
          const swapping = swappingIds?.has(player.id) ?? false;
          return (
            <li key={player.id}>
              <button
                type="button"
                ref={(el) => registerPlayerEl?.(player.id, el)}
                onClick={() => onPlayerClick(teamIndex, playerIndex, player)}
                aria-pressed={selected}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors ${
                  selected
                    ? "player-selected"
                    : "border-transparent active:bg-foreground/10"
                } ${swapping ? "player-swapping" : ""}`}
              >
                {content}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
