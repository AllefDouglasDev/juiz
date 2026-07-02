"use client";

import { Download, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import {
  useAddPlayer,
  useClearPlayers,
  useDeletePlayer,
  usePlayers,
  useUpdatePlayer,
} from "@/hooks/use-players";
import type { NewPlayer, Player } from "@/lib/types";
import { ExportPlayersDialog } from "./export-players-dialog";
import { ImportPlayersDialog } from "./import-players-dialog";
import { PlayerForm } from "./player-form";
import { PlayerList } from "./player-list";

export function PlayersScreen() {
  const { data: players, isPending } = usePlayers();
  const addPlayer = useAddPlayer();
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();
  const clearPlayers = useClearPlayers();

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [exportedAt, setExportedAt] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

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

  function handleClearAll() {
    clearPlayers.mutate();
    setClearingAll(false);
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
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Jogadores{" "}
            <span className="font-normal text-foreground/50">
              ({sortedPlayers.length})
            </span>
          </h2>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="min-h-9 px-3 text-sm"
              onClick={() => setExportedAt(Date.now())}
              disabled={sortedPlayers.length === 0}
            >
              <Download size={16} aria-hidden />
              Exportar
            </Button>
            <Button
              variant="secondary"
              className="min-h-9 px-3 text-sm"
              onClick={() => setImportOpen(true)}
            >
              <Upload size={16} aria-hidden />
              Importar
            </Button>
          </div>
        </div>

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

      {sortedPlayers.length > 0 && (
        <section className="mt-2 flex flex-col gap-3 border-t border-foreground/10 pt-6">
          <Button
            variant="secondary"
            className="border-red-600/40 text-red-600 active:bg-red-600/10"
            onClick={() => setClearingAll(true)}
            disabled={clearPlayers.isPending}
          >
            <Trash2 size={18} aria-hidden />
            Deletar todos os jogadores
          </Button>
        </section>
      )}

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

      <ExportPlayersDialog
        open={exportedAt > 0}
        onClose={() => setExportedAt(0)}
        players={sortedPlayers}
        exportedAt={exportedAt}
      />

      <ImportPlayersDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        players={sortedPlayers}
      />

      <ConfirmDialog
        open={clearingAll}
        title="Deletar todos os jogadores"
        message={`Isso vai apagar todos os ${sortedPlayers.length} jogadores. Essa ação não pode ser desfeita. Continuar?`}
        confirmLabel="Deletar todos"
        destructive
        onConfirm={handleClearAll}
        onCancel={() => setClearingAll(false)}
      />
    </div>
  );
}
