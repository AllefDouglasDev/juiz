"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import {
  useAddPlayer,
  useDeletePlayer,
  usePlayers,
  useUpdatePlayer,
} from "@/hooks/use-players";
import type { NewPlayer, Player } from "@/lib/types";
import { PlayerForm } from "./player-form";
import { PlayerList } from "./player-list";

export function PlayersScreen() {
  const { data: players, isPending } = usePlayers();
  const addPlayer = useAddPlayer();
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);

  const sortedPlayers = [...(players ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR")
  );

  function handleEditSubmit(input: NewPlayer) {
    if (!editingPlayer) return;
    updatePlayer.mutate({ id: editingPlayer.id, patch: input });
    setEditingPlayer(null);
  }

  function handleDeleteConfirm() {
    if (!deletingPlayer) return;
    deletePlayer.mutate(deletingPlayer.id);
    setDeletingPlayer(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-foreground/10 p-4">
        <h2 className="text-lg font-semibold">Adicionar jogador</h2>
        <PlayerForm
          submitLabel="Adicionar"
          onSubmit={(input) => addPlayer.mutate(input)}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          Jogadores{" "}
          <span className="font-normal text-foreground/50">
            ({sortedPlayers.length})
          </span>
        </h2>

        {isPending ? (
          <p className="py-8 text-center text-foreground/50">Carregando…</p>
        ) : sortedPlayers.length === 0 ? (
          <p className="py-8 text-center text-foreground/50">
            Nenhum jogador cadastrado. Adicione o primeiro acima!
          </p>
        ) : (
          <PlayerList
            players={sortedPlayers}
            onToggleInGame={(player) =>
              updatePlayer.mutate({
                id: player.id,
                patch: { inGame: !player.inGame },
              })
            }
            onEdit={setEditingPlayer}
            onDelete={setDeletingPlayer}
          />
        )}
      </section>

      <Dialog
        open={editingPlayer !== null}
        onClose={() => setEditingPlayer(null)}
        title="Editar jogador"
      >
        {editingPlayer && (
          <PlayerForm
            key={editingPlayer.id}
            initial={editingPlayer}
            submitLabel="Salvar"
            onSubmit={handleEditSubmit}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={deletingPlayer !== null}
        title="Excluir jogador"
        message={`Tem certeza que deseja excluir ${deletingPlayer?.name ?? ""}?`}
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingPlayer(null)}
      />
    </div>
  );
}
