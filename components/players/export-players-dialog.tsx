"use client";

import { Check, Copy, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { serializePlayers } from "@/lib/players/player-transfer";
import type { Player } from "@/lib/types";
import { downloadTextFile } from "@/lib/utils/download";

interface ExportPlayersDialogProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
  // Timestamp captured by the parent when the dialog was opened (an event
  // handler, where impure Date.now() is allowed).
  exportedAt: number;
}

export function ExportPlayersDialog({
  open,
  onClose,
  players,
  exportedAt,
}: ExportPlayersDialogProps) {
  const [copied, setCopied] = useState(false);

  const json = useMemo(
    () => (open ? serializePlayers(players, exportedAt) : ""),
    [open, players, exportedAt]
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleDownload() {
    downloadTextFile("jogadores.json", json);
  }

  function handleClose() {
    setCopied(false);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Exportar jogadores">
      <p className="text-sm text-foreground/70">
        {players.length} jogador{players.length === 1 ? "" : "es"}. Baixe o
        arquivo ou copie o JSON.
      </p>
      <textarea
        readOnly
        value={json}
        aria-label="JSON dos jogadores"
        className="h-48 w-full resize-none rounded-xl border border-foreground/15 bg-foreground/5 p-3 font-mono text-xs"
      />
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={handleDownload}>
          <Download size={18} aria-hidden />
          Baixar arquivo
        </Button>
        <Button className="flex-1" onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={18} aria-hidden />
              Copiado!
            </>
          ) : (
            <>
              <Copy size={18} aria-hidden />
              Copiar
            </>
          )}
        </Button>
      </div>
      <Button variant="ghost" onClick={handleClose}>
        Fechar
      </Button>
    </Dialog>
  );
}
