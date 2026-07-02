import type { Player } from "@/lib/types";
import {
  validatePlayersImport,
  type ImportValidationResult,
} from "./player-validation";

// ---------------------------------------------------------------------------
// Player export/import serialization
//
// The on-disk/clipboard shape is a versioned envelope so the format can evolve
// without breaking old files. Only the meaningful fields are exported; `id`
// and `createdAt` are regenerated on import.
// ---------------------------------------------------------------------------

export const PLAYERS_EXPORT_VERSION = 1;

export interface PlayersExportEnvelope {
  version: number;
  exportedAt: number;
  players: { name: string; strength: number; inGame: boolean }[];
}

// `exportedAt` is passed in (not read from Date.now here) to keep this pure.
export function serializePlayers(players: Player[], exportedAt: number): string {
  const envelope: PlayersExportEnvelope = {
    version: PLAYERS_EXPORT_VERSION,
    exportedAt,
    players: players.map(({ name, strength, inGame }) => ({
      name,
      strength,
      inGame,
    })),
  };
  return JSON.stringify(envelope, null, 2);
}

export type ParseImportResult =
  | { ok: true; result: ImportValidationResult }
  | { ok: false; error: string };

// Parses raw text and runs full validation. Malformed JSON is reported as a
// friendly error instead of throwing.
export function parseImportText(text: string): ParseImportResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "Cole um JSON ou selecione um arquivo." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "JSON inválido. Verifique o conteúdo." };
  }

  return { ok: true, result: validatePlayersImport(parsed) };
}
