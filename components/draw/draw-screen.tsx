"use client";

import { useState } from "react";
import { AddPlayersDialog } from "./add-players-dialog";
import { DrawControls } from "./draw-controls";
import { InGamePlayers } from "./in-game-players";
import { TeamEditor } from "./team-editor";
import { usePlayers, useUpdatePlayer } from "@/hooks/use-players";
import { useDrawResult } from "@/hooks/use-draw-result";
import { useDrawSettings } from "@/hooks/use-draw-settings";
import { drawTeams } from "@/lib/draw/draw-teams";

export function DrawScreen() {
  const { data: players } = usePlayers();
  const updatePlayer = useUpdatePlayer();
  const [settings, setSettings] = useDrawSettings();
  const [result, setResult] = useDrawResult();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const allPlayers = players ?? [];
  const inGamePlayers = allPlayers.filter((player) => player.inGame);
  const playersOutOfGame = allPlayers
    .filter((player) => !player.inGame)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  function handleDraw() {
    setResult(drawTeams(inGamePlayers, settings));
  }

  return (
    <div className="flex flex-col gap-4">
      <DrawControls
        settings={settings}
        onChange={setSettings}
        onDraw={handleDraw}
        inGameCount={inGamePlayers.length}
      />

      <InGamePlayers
        players={inGamePlayers}
        onRemove={(player) =>
          updatePlayer.mutate({ id: player.id, patch: { inGame: false } })
        }
        onAddClick={() => setAddDialogOpen(true)}
      />

      {result && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Times sorteados</h2>
          <TeamEditor
            result={result}
            setResult={setResult}
            showStrength={result.useStrength}
          />
        </section>
      )}

      <AddPlayersDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        playersOutOfGame={playersOutOfGame}
        onAdd={(player) =>
          updatePlayer.mutate({ id: player.id, patch: { inGame: true } })
        }
      />
    </div>
  );
}
