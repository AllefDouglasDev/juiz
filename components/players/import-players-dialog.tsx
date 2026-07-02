"use client";

import { Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useImportPlayers } from "@/hooks/use-players";
import { parseImportText } from "@/lib/players/player-transfer";
import type { ResolvedImport } from "@/lib/repositories";
import type { NewPlayer, Player } from "@/lib/types";

interface ImportPlayersDialogProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
}

// A pasted player whose name already exists. The user decides per row whether
// to overwrite the existing player's data or skip the imported one.
interface Conflict {
  imported: NewPlayer;
  existing: Player;
  action: "replace" | "skip";
}

type Feedback =
  | { kind: "error"; lines: string[] }
  | { kind: "success"; text: string };

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

export function ImportPlayersDialog({
  open,
  onClose,
  players,
}: ImportPlayersDialogProps) {
  const importPlayers = useImportPlayers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // "input": paste/upload; "resolve": decide what to do with each name clash.
  const [stage, setStage] = useState<"input" | "resolve">("input");
  const [newPlayers, setNewPlayers] = useState<NewPlayer[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  function reset() {
    setText("");
    setFeedback(null);
    setStage("input");
    setNewPlayers([]);
    setConflicts([]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file later.
    event.target.value = "";
    if (!file) return;
    const content = await file.text();
    setText(content);
    setFeedback(null);
  }

  function apply(resolved: ResolvedImport, summary: string) {
    importPlayers.mutate(resolved, {
      onSuccess: () => {
        setFeedback({ kind: "success", text: summary });
        setStage("input");
        setNewPlayers([]);
        setConflicts([]);
        setText("");
      },
      onError: () => {
        setFeedback({
          kind: "error",
          lines: ["Não foi possível salvar os jogadores. Tente novamente."],
        });
      },
    });
  }

  // Stage 1 → parse, validate, then split into new players vs name conflicts.
  function handleAnalyze() {
    setFeedback(null);
    const parsed = parseImportText(text);

    if (!parsed.ok) {
      setFeedback({ kind: "error", lines: [parsed.error] });
      return;
    }

    const { players: imported, errors, totalCount } = parsed.result;

    if (totalCount === 0) {
      setFeedback({
        kind: "error",
        lines: ["Nenhum jogador encontrado no JSON."],
      });
      return;
    }

    // Abort the whole import if any entry is invalid — never persist partial data.
    if (errors.length > 0) {
      const lines = errors.map(
        (entry) => `Item ${entry.index + 1}: ${entry.messages.join("; ")}`
      );
      setFeedback({ kind: "error", lines });
      return;
    }

    const existingByName = new Map(
      players.map((player) => [normalizeName(player.name), player])
    );
    const fresh: NewPlayer[] = [];
    const clashes: Conflict[] = [];
    for (const entry of imported) {
      const existing = existingByName.get(normalizeName(entry.name));
      if (existing) {
        clashes.push({ imported: entry, existing, action: "replace" });
      } else {
        fresh.push(entry);
      }
    }

    // No name clashes: just add everyone.
    if (clashes.length === 0) {
      apply(
        { toCreate: fresh, toUpdate: [] },
        `${fresh.length} jogador${fresh.length === 1 ? "" : "es"} adicionado${
          fresh.length === 1 ? "" : "s"
        }.`
      );
      return;
    }

    setNewPlayers(fresh);
    setConflicts(clashes);
    setStage("resolve");
  }

  function setAllConflicts(action: Conflict["action"]) {
    setConflicts((prev) => prev.map((conflict) => ({ ...conflict, action })));
  }

  function setConflictAction(index: number, action: Conflict["action"]) {
    setConflicts((prev) =>
      prev.map((conflict, i) =>
        i === index ? { ...conflict, action } : conflict
      )
    );
  }

  // Stage 2 → build the merge plan from the per-row decisions.
  function handleApplyResolution() {
    const toUpdate = conflicts
      .filter((conflict) => conflict.action === "replace")
      .map((conflict) => ({ id: conflict.existing.id, data: conflict.imported }));
    const skipped = conflicts.length - toUpdate.length;

    const parts = [
      `${newPlayers.length} adicionado${newPlayers.length === 1 ? "" : "s"}`,
      `${toUpdate.length} substituído${toUpdate.length === 1 ? "" : "s"}`,
      `${skipped} pulado${skipped === 1 ? "" : "s"}`,
    ];
    apply({ toCreate: newPlayers, toUpdate }, `${parts.join(", ")}.`);
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Importar jogadores">
      {stage === "input" ? (
        <>
          <p className="text-sm text-foreground/70">
            Cole o JSON ou selecione um arquivo exportado. Nomes que já existem
            poderão ser substituídos ou pulados na próxima etapa.
          </p>

          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setFeedback(null);
            }}
            placeholder='{ "version": 1, "players": [ ... ] }'
            aria-label="JSON dos jogadores"
            className="h-40 w-full resize-none rounded-xl border border-foreground/15 bg-foreground/5 p-3 font-mono text-xs"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} aria-hidden />
            Selecionar arquivo
          </Button>

          {feedback?.kind === "error" && (
            <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-xl bg-red-600/10 p-3 text-sm text-red-600">
              {feedback.lines.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          )}
          {feedback?.kind === "success" && (
            <p className="rounded-xl bg-green-600/10 p-3 text-sm text-green-700 dark:text-green-400">
              {feedback.text}
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={handleClose}>
              Fechar
            </Button>
            <Button
              className="flex-1"
              onClick={handleAnalyze}
              disabled={importPlayers.isPending}
            >
              Importar
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-foreground/70">
            {conflicts.length} jogador
            {conflicts.length === 1 ? " já existe" : "es já existem"} com o mesmo
            nome. Escolha o que fazer com cada um.
            {newPlayers.length > 0 &&
              ` ${newPlayers.length} novo${
                newPlayers.length === 1 ? "" : "s"
              } será${newPlayers.length === 1 ? "" : "ão"} adicionado${
                newPlayers.length === 1 ? "" : "s"
              }.`}
          </p>

          <div className="flex gap-2 text-sm">
            <button
              type="button"
              className="text-foreground/70 underline underline-offset-2"
              onClick={() => setAllConflicts("replace")}
            >
              Substituir todos
            </button>
            <span className="text-foreground/30">·</span>
            <button
              type="button"
              className="text-foreground/70 underline underline-offset-2"
              onClick={() => setAllConflicts("skip")}
            >
              Pular todos
            </button>
          </div>

          <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {conflicts.map((conflict, index) => (
              <li
                key={`${conflict.existing.id}-${index}`}
                className="flex flex-col gap-2 rounded-xl border border-foreground/10 p-3"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{conflict.existing.name}</span>
                  <span className="text-xs text-foreground/60">
                    atual: força {conflict.existing.strength} ·{" "}
                    {conflict.existing.inGame ? "no jogo" : "fora"} → novo: força{" "}
                    {conflict.imported.strength} ·{" "}
                    {conflict.imported.inGame ? "no jogo" : "fora"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name={`conflict-${index}`}
                      checked={conflict.action === "replace"}
                      onChange={() => setConflictAction(index, "replace")}
                    />
                    Substituir
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name={`conflict-${index}`}
                      checked={conflict.action === "skip"}
                      onChange={() => setConflictAction(index, "skip")}
                    />
                    Pular
                  </label>
                </div>
              </li>
            ))}
          </ul>

          {feedback?.kind === "error" && (
            <ul className="flex flex-col gap-1 rounded-xl bg-red-600/10 p-3 text-sm text-red-600">
              {feedback.lines.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          )}

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setStage("input");
                setFeedback(null);
              }}
            >
              Voltar
            </Button>
            <Button
              className="flex-1"
              onClick={handleApplyResolution}
              disabled={importPlayers.isPending}
            >
              {importPlayers.isPending ? "Aplicando…" : "Aplicar"}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
