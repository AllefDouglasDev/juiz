"use client";

import { Pencil, Star, Trash2 } from "lucide-react";
import type { Player } from "@/lib/types";

interface PlayerListProps {
  players: Player[];
  onToggleInGame: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
}

function StrengthStars({ strength }: { strength: number }) {
  return (
    <span aria-label={`Força ${strength}`} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((level) => (
        <Star
          key={level}
          size={14}
          fill="currentColor"
          strokeWidth={0}
          aria-hidden
          className={level <= strength ? "text-amber-500" : "text-foreground/25"}
        />
      ))}
    </span>
  );
}

export function PlayerList({
  players,
  onToggleInGame,
  onEdit,
  onDelete,
}: PlayerListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {players.map((player) => (
        <li
          key={player.id}
          className="flex items-center gap-3 rounded-2xl border border-foreground/10 p-3"
        >
          <label className="flex min-h-11 items-center" title="Está no jogo">
            <input
              type="checkbox"
              checked={player.inGame}
              onChange={() => onToggleInGame(player)}
              aria-label={`${player.name} está no jogo`}
              className="size-5 accent-green-600"
            />
          </label>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium">{player.name}</p>
            <StrengthStars strength={player.strength} />
          </div>

          <button
            type="button"
            onClick={() => onEdit(player)}
            aria-label={`Editar ${player.name}`}
            className="flex size-11 items-center justify-center rounded-xl active:bg-foreground/10"
          >
            <Pencil size={19} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete(player)}
            aria-label={`Excluir ${player.name}`}
            className="flex size-11 items-center justify-center rounded-xl text-red-600 active:bg-foreground/10"
          >
            <Trash2 size={19} aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
