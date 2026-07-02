"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Player } from "@/lib/types";

interface AddPlayersDialogProps {
  open: boolean;
  onClose: () => void;
  playersOutOfGame: Player[];
  onAdd: (player: Player) => void;
}

export function AddPlayersDialog({
  open,
  onClose,
  playersOutOfGame,
  onAdd,
}: AddPlayersDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Adicionar jogadores ao jogo">
      {playersOutOfGame.length === 0 ? (
        <p className="text-foreground/70">
          Todos os jogadores cadastrados já estão no jogo.
        </p>
      ) : (
        <ul className="flex max-h-[50vh] flex-col overflow-y-auto">
          {playersOutOfGame.map((player) => (
            <li
              key={player.id}
              className="flex min-h-12 items-center justify-between gap-2"
            >
              <span className="truncate">{player.name}</span>
              <button
                type="button"
                onClick={() => onAdd(player)}
                aria-label={`Adicionar ${player.name} ao jogo`}
                className="flex min-h-9 items-center justify-center gap-1 rounded-lg bg-foreground/10 px-3 text-sm font-medium active:bg-foreground/20"
              >
                <Plus size={16} aria-hidden />
                Adicionar
              </button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="secondary" onClick={onClose}>
        Fechar
      </Button>
    </Dialog>
  );
}
