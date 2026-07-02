"use client";

import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible } from "@/components/ui/collapsible";
import type { Player } from "@/lib/types";

interface InGamePlayersProps {
  players: Player[];
  onRemove: (player: Player) => void;
  onAddClick: () => void;
}

export function InGamePlayers({
  players,
  onRemove,
  onAddClick,
}: InGamePlayersProps) {
  return (
    <Collapsible
      summary={
        <span className="text-base font-semibold">
          Jogadores no jogo{" "}
          <span className="font-normal text-foreground/50">
            ({players.length})
          </span>
        </span>
      }
    >
      <div className="flex flex-col gap-2">
        {players.length === 0 ? (
          <p className="py-2 text-center text-sm text-foreground/50">
            Nenhum jogador no jogo.
          </p>
        ) : (
          <ul className="flex flex-col">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex min-h-11 items-center justify-between gap-2"
              >
                <span className="truncate">{player.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(player)}
                  aria-label={`Remover ${player.name} do jogo`}
                  className="flex size-9 items-center justify-center rounded-lg text-foreground/40 active:bg-foreground/10"
                >
                  <X size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button variant="secondary" onClick={onAddClick}>
          <UserPlus size={18} aria-hidden />
          Adicionar jogadores
        </Button>
      </div>
    </Collapsible>
  );
}
