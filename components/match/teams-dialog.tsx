"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TeamEditor } from "@/components/draw/team-editor";
import { useDrawResult } from "@/hooks/use-draw-result";
import { usePlayers, useUpdatePlayer } from "@/hooks/use-players";
import type { DrawnPlayer } from "@/lib/types";

interface TeamsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TeamsDialog({ open, onClose }: TeamsDialogProps) {
  const [result, setResult] = useDrawResult();
  const { data: players } = usePlayers();
  const updatePlayer = useUpdatePlayer();

  // Reserves = players not currently in any drawn team.
  const bench = useMemo<DrawnPlayer[]>(() => {
    if (!result) return [];
    const inTeam = new Set(
      result.teams.flatMap((team) => team.players.map((player) => player.id))
    );
    return (players ?? [])
      .filter((player) => !inTeam.has(player.id))
      .map(({ id, name, strength }) => ({ id, name, strength }));
  }, [result, players]);

  return (
    <Dialog open={open} onClose={onClose} title="Times sorteados">
      {result && result.teams.length > 0 ? (
        <div className="-mx-1 max-h-[65vh] overflow-y-auto px-1">
          <TeamEditor
            result={result}
            setResult={setResult}
            showStrength={result.useStrength}
            benchPlayers={bench}
            onSetInGame={(id, inGame) =>
              updatePlayer.mutate({ id, patch: { inGame } })
            }
          />
        </div>
      ) : (
        <p className="text-foreground/60">
          Nenhum time sorteado ainda. Sorteie os times na tela de sorteio.
        </p>
      )}

      <Button variant="secondary" onClick={onClose}>
        Fechar
      </Button>
    </Dialog>
  );
}
