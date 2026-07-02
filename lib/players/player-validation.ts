import type { NewPlayer, Strength } from "@/lib/types";

// ---------------------------------------------------------------------------
// Player validation entity
//
// This is the SINGLE, EXPLICIT place where every rule a player must obey lives.
// Anything entering the app from outside the form (JSON import, a future API,
// etc.) MUST pass through here — the form's own checks are not enough because
// import bypasses the form entirely. Keep all rules in PLAYER_RULES and all
// runtime checks in validatePlayerInput.
// ---------------------------------------------------------------------------

export const PLAYER_RULES = {
  name: { minLength: 1, maxLength: 40 },
  strength: { min: 1, max: 5 },
  inGame: { default: true },
} as const;

export type FieldValidation<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

export interface ImportValidationResult {
  players: NewPlayer[]; // only the entries that passed every rule
  errors: { index: number; messages: string[] }[]; // per-entry failures
  totalCount: number; // how many entries the payload contained
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// --- Field-level rules -----------------------------------------------------

function validateName(raw: unknown): FieldValidation<string> {
  if (typeof raw !== "string") {
    return { ok: false, errors: ["nome deve ser um texto"] };
  }
  const name = raw.trim();
  if (name.length < PLAYER_RULES.name.minLength) {
    return { ok: false, errors: ["nome é obrigatório"] };
  }
  if (name.length > PLAYER_RULES.name.maxLength) {
    return {
      ok: false,
      errors: [`nome deve ter no máximo ${PLAYER_RULES.name.maxLength} caracteres`],
    };
  }
  return { ok: true, value: name };
}

function validateStrength(raw: unknown): FieldValidation<Strength> {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return { ok: false, errors: ["força deve ser um número"] };
  }
  if (!Number.isInteger(raw)) {
    return { ok: false, errors: ["força deve ser um número inteiro"] };
  }
  if (raw < PLAYER_RULES.strength.min || raw > PLAYER_RULES.strength.max) {
    return {
      ok: false,
      errors: [
        `força deve estar entre ${PLAYER_RULES.strength.min} e ${PLAYER_RULES.strength.max}`,
      ],
    };
  }
  return { ok: true, value: raw as Strength };
}

function validateInGame(raw: unknown): FieldValidation<boolean> {
  if (raw === undefined) {
    return { ok: true, value: PLAYER_RULES.inGame.default };
  }
  if (typeof raw !== "boolean") {
    return { ok: false, errors: ["em jogo deve ser verdadeiro ou falso"] };
  }
  return { ok: true, value: raw };
}

// --- Record-level rule -----------------------------------------------------

// Validates ONE raw record into a NewPlayer, collecting every field error so
// the caller can report all problems at once. Extra/unknown fields (e.g. an
// `id` or `createdAt` from a full export) are ignored on purpose.
export function validatePlayerInput(raw: unknown): FieldValidation<NewPlayer> {
  if (!isObjectRecord(raw)) {
    return { ok: false, errors: ["registro inválido (esperado um objeto)"] };
  }

  const errors: string[] = [];

  const name = validateName(raw.name);
  if (!name.ok) errors.push(...name.errors);

  const strength = validateStrength(raw.strength);
  if (!strength.ok) errors.push(...strength.errors);

  const inGame = validateInGame(raw.inGame);
  if (!inGame.ok) errors.push(...inGame.errors);

  if (!name.ok || !strength.ok || !inGame.ok) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { name: name.value, strength: strength.value, inGame: inGame.value },
  };
}

// --- Payload-level rule ----------------------------------------------------

// Accepts either the export envelope ({ version, players: [...] }) or a bare
// array of player records. Validates each entry, keeping the valid ones and
// reporting per-index errors for the rest.
export function validatePlayersImport(raw: unknown): ImportValidationResult {
  const list = extractPlayerList(raw);

  const players: NewPlayer[] = [];
  const errors: { index: number; messages: string[] }[] = [];

  list.forEach((entry, index) => {
    const result = validatePlayerInput(entry);
    if (result.ok) {
      players.push(result.value);
    } else {
      errors.push({ index, messages: result.errors });
    }
  });

  return { players, errors, totalCount: list.length };
}

// Pulls the array of records out of whatever shape arrived. A non-array
// `players` field or an unrecognised shape yields an empty list, which the
// caller surfaces as "nenhum jogador encontrado".
function extractPlayerList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isObjectRecord(raw) && Array.isArray(raw.players)) return raw.players;
  return [];
}
