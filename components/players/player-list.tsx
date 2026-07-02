"use client";

import type { Player } from "@/lib/types";

interface PlayerListProps {
  players: Player[];
  onToggleInGame: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
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
            <p aria-label={`Força ${player.strength}`} className="text-sm text-amber-500">
              {"★".repeat(player.strength)}
              <span className="text-foreground/25">
                {"★".repeat(5 - player.strength)}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onEdit(player)}
            aria-label={`Editar ${player.name}`}
            className="flex size-11 items-center justify-center rounded-xl text-lg active:bg-foreground/10"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDelete(player)}
            aria-label={`Excluir ${player.name}`}
            className="flex size-11 items-center justify-center rounded-xl text-lg active:bg-foreground/10"
          >
            🗑️
          </button>
        </li>
      ))}
    </ul>
  );
}
