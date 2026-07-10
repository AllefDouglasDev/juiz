"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { drawSubset } from "@/lib/draw/team-edit";
import type { DrawnPlayer, DrawnTeam } from "@/lib/types";

interface TeamSubDrawDialogProps {
  open: boolean;
  onClose: () => void;
  team: DrawnTeam | null;
  showStrength: boolean;
}

function PlayerRow({
  player,
  showStrength,
}: {
  player: DrawnPlayer;
  showStrength: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="truncate">{player.name}</span>
      {showStrength && (
        <span aria-label={`Força ${player.strength}`} className="flex gap-0.5 text-amber-500">
          {Array.from({ length: player.strength }, (_, i) => (
            <Star key={i} size={12} fill="currentColor" strokeWidth={0} aria-hidden />
          ))}
        </span>
      )}
    </li>
  );
}

export function TeamSubDrawDialog({
  open,
  onClose,
  team,
  showStrength,
}: TeamSubDrawDialogProps) {
  const size = team?.players.length ?? 0;
  const maxPick = Math.max(1, size - 1);

  const [count, setCount] = useState(maxPick);
  const [result, setResult] = useState<{
    selected: DrawnPlayer[];
    left: DrawnPlayer[];
  } | null>(null);

  // Reset the ephemeral state when the dialog opens for a (new) team — the
  // React-recommended "adjust state while rendering" pattern (no effect).
  const [prevTeamName, setPrevTeamName] = useState<string | null>(null);
  const openKey = open ? team?.name ?? null : null;
  if (openKey !== prevTeamName) {
    setPrevTeamName(openKey);
    setCount(maxPick);
    setResult(null);
  }

  if (!team) return null;

  const options = Array.from({ length: Math.max(1, size - 1) }, (_, i) => i + 1);

  return (
    <Dialog open={open} onClose={onClose} title={`Sorteio interno — ${team.name}`}>
      <p className="text-sm text-foreground/60">
        Escolha quantos jogadores entram a partir deste time de {size}.
      </p>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Quantidade</span>
        <Select
          value={count}
          onChange={(event) => setCount(Number(event.target.value))}
        >
          {options.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </label>

      <Button onClick={() => setResult(drawSubset(team.players, count))}>
        Sortear
      </Button>

      {result && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-green-600 dark:text-green-400">
              Sorteados ({result.selected.length})
            </h3>
            <ul className="flex flex-col gap-1">
              {result.selected.map((player) => (
                <PlayerRow key={player.id} player={player} showStrength={showStrength} />
              ))}
            </ul>
          </div>

          {result.left.length > 0 && (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-foreground/50">
                Ficam de fora ({result.left.length})
              </h3>
              <ul className="flex flex-col gap-1 text-foreground/60">
                {result.left.map((player) => (
                  <PlayerRow key={player.id} player={player} showStrength={showStrength} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Button variant="secondary" onClick={onClose}>
        Fechar
      </Button>
    </Dialog>
  );
}
