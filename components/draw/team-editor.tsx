"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Star } from "lucide-react";
import { TeamCard } from "./team-card";
import { TeamSubDrawDialog } from "./team-sub-draw-dialog";
import {
  addPlayerToTeam,
  removePlayerFromTeam,
  substitutePlayer,
  swapPlayers,
  type PlayerRef,
} from "@/lib/draw/team-edit";
import type { DrawnPlayer, DrawResult } from "@/lib/types";

// The selected player is either one sitting on a team or one on the bench.
type Selection =
  | { kind: "team"; ref: PlayerRef; id: string }
  | { kind: "bench"; id: string; player: DrawnPlayer };

interface TeamEditorProps {
  result: DrawResult;
  setResult: (next: DrawResult) => void;
  showStrength: boolean;
  // When provided, enables the reserves list and its interactions.
  benchPlayers?: DrawnPlayer[];
  // Persist a player's "está no jogo" flag when they enter/leave a team.
  onSetInGame?: (playerId: string, inGame: boolean) => void;
}

const SWAP_ANIMATION_MS = 400;
const MOVE_ANIMATION_MS = 400;

export function TeamEditor({
  result,
  setResult,
  showStrength,
  benchPlayers,
  onSetInGame,
}: TeamEditorProps) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const [swappingIds, setSwappingIds] = useState<ReadonlySet<string>>(
    new Set()
  );
  const [subDrawTeamIndex, setSubDrawTeamIndex] = useState<number | null>(null);

  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    },
    []
  );

  // FLIP move animation: every player row registers its DOM node by player id.
  // A player that changes list (team ↔ team, team ↔ bench) remounts as a new
  // node under the same id, so stale entries are skipped via `isConnected`.
  const playerEls = useRef(new Map<string, HTMLElement>());
  const prevRects = useRef<Map<string, DOMRect> | null>(null);

  const registerPlayerEl = useCallback(
    (id: string, el: HTMLElement | null) => {
      if (el) playerEls.current.set(id, el);
    },
    []
  );

  // Snapshot every player's position, then apply the edit; the layout effect
  // below slides each moved player from its old spot to the new one.
  function applyEdit(next: DrawResult) {
    const rects = new Map<string, DOMRect>();
    for (const [id, el] of playerEls.current) {
      if (el.isConnected) rects.set(id, el.getBoundingClientRect());
    }
    prevRects.current = rects;
    setResult(next);
  }

  useLayoutEffect(() => {
    const rects = prevRects.current;
    prevRects.current = null;
    if (!rects) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const [id, el] of playerEls.current) {
      const prev = rects.get(id);
      if (!prev || !el.isConnected || typeof el.animate !== "function") {
        continue;
      }
      const next = el.getBoundingClientRect();
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: "translate(0, 0)" },
        ],
        { duration: MOVE_ANIMATION_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
    }
  }, [result, benchPlayers]);

  function flash(ids: string[]) {
    setSwappingIds(new Set(ids));
    if (swapTimer.current) clearTimeout(swapTimer.current);
    swapTimer.current = setTimeout(
      () => setSwappingIds(new Set()),
      SWAP_ANIMATION_MS
    );
  }

  // Replace the team player at `ref` with `incoming` (from the bench). The
  // displaced player returns to the bench; both roster flags are synced.
  function substitute(ref: PlayerRef, incoming: DrawnPlayer) {
    const outgoing = result.teams[ref.teamIndex]?.players[ref.playerIndex];
    applyEdit(substitutePlayer(result, ref, incoming));
    onSetInGame?.(incoming.id, true);
    if (outgoing) onSetInGame?.(outgoing.id, false);
    flash(outgoing ? [incoming.id, outgoing.id] : [incoming.id]);
    setSelected(null);
  }

  function handlePlayerClick(
    teamIndex: number,
    playerIndex: number,
    player: DrawnPlayer
  ) {
    // Nothing selected yet → select this player.
    if (!selected) {
      setSelected({ kind: "team", ref: { teamIndex, playerIndex }, id: player.id });
      return;
    }
    // A reserve is selected → substitute this team player for it.
    if (selected.kind === "bench") {
      substitute({ teamIndex, playerIndex }, selected.player);
      return;
    }
    // Clicking the same player again → deselect.
    if (selected.id === player.id) {
      setSelected(null);
      return;
    }
    // Second team player → swap the two.
    applyEdit(swapPlayers(result, selected.ref, { teamIndex, playerIndex }));
    flash([selected.id, player.id]);
    setSelected(null);
  }

  function handleBenchClick(player: DrawnPlayer) {
    // Nothing selected → select this reserve.
    if (!selected) {
      setSelected({ kind: "bench", id: player.id, player });
      return;
    }
    // Another reserve is selected → move selection (or deselect if same).
    if (selected.kind === "bench") {
      setSelected(
        selected.id === player.id ? null : { kind: "bench", id: player.id, player }
      );
      return;
    }
    // A team player is selected → substitute it for this reserve.
    substitute(selected.ref, player);
  }

  // Clicking a team title includes the selected reserve into that team.
  function handleTitleClick(teamIndex: number) {
    if (!selected || selected.kind !== "bench") return;
    applyEdit(addPlayerToTeam(result, teamIndex, selected.player));
    onSetInGame?.(selected.id, true);
    flash([selected.id]);
    setSelected(null);
  }

  // Clicking the "Reservas" header moves the selected team player to the bench.
  function handleReservesClick() {
    if (!selected || selected.kind !== "team") return;
    const player =
      result.teams[selected.ref.teamIndex]?.players[selected.ref.playerIndex];
    applyEdit(removePlayerFromTeam(result, selected.ref));
    if (player) {
      onSetInGame?.(player.id, false);
      flash([player.id]);
    }
    setSelected(null);
  }

  const subDrawTeam =
    subDrawTeamIndex !== null ? result.teams[subDrawTeamIndex] ?? null : null;

  const benchEnabled = benchPlayers !== undefined;
  const showBench = benchEnabled && benchPlayers.length > 0;
  const benchSelected = selected?.kind === "bench";
  const teamSelected = selected?.kind === "team";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {result.teams.map((team, teamIndex) => (
          <TeamCard
            key={team.name}
            team={team}
            teamIndex={teamIndex}
            showStrength={showStrength}
            selectedPlayerId={selected?.kind === "team" ? selected.id : null}
            swappingIds={swappingIds}
            registerPlayerEl={registerPlayerEl}
            onPlayerClick={handlePlayerClick}
            onSubDraw={setSubDrawTeamIndex}
            onTitleClick={benchEnabled ? handleTitleClick : undefined}
            titleActionable={benchSelected}
          />
        ))}
      </div>

      {showBench && (
        <div className="rounded-2xl border border-foreground/10 p-4">
          <button
            type="button"
            disabled={!teamSelected}
            onClick={handleReservesClick}
            aria-label="Mover jogador selecionado para as reservas"
            className={`-mx-1 mb-2 rounded-lg px-1 text-left text-base font-bold transition-colors disabled:cursor-default ${
              teamSelected ? "player-selected" : ""
            }`}
          >
            Reservas
          </button>
          <p className="mb-2 text-sm text-foreground/50">
            {benchSelected
              ? "Toque num jogador do time para substituir, ou no nome do time para incluí-lo."
              : teamSelected
                ? "Toque em outro jogador para trocar, numa reserva para substituir, ou em “Reservas” para tirá-lo do time."
                : "Toque num jogador do time ou numa reserva para começar."}
          </p>
          <ul className="flex flex-col gap-1">
            {benchPlayers.map((player) => {
              const swapping = swappingIds.has(player.id);
              const isSelected =
                selected?.kind === "bench" && selected.id === player.id;
              return (
                <li key={player.id}>
                  <button
                    type="button"
                    ref={(el) => registerPlayerEl(player.id, el)}
                    onClick={() => handleBenchClick(player)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors ${
                      isSelected
                        ? "player-selected"
                        : "border-transparent active:bg-foreground/10"
                    } ${swapping ? "player-swapping" : ""}`}
                  >
                    <span className="truncate">{player.name}</span>
                    {showStrength && (
                      <span
                        aria-label={`Força ${player.strength}`}
                        className="flex gap-0.5 text-amber-500"
                      >
                        {Array.from({ length: player.strength }, (_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill="currentColor"
                            strokeWidth={0}
                            aria-hidden
                          />
                        ))}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <TeamSubDrawDialog
        open={subDrawTeamIndex !== null}
        onClose={() => setSubDrawTeamIndex(null)}
        team={subDrawTeam}
        showStrength={showStrength}
      />
    </div>
  );
}
