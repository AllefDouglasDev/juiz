"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_STRENGTH, type NewPlayer, type Player } from "@/lib/types";
import { StrengthPicker } from "./strength-picker";

interface PlayerFormProps {
  initial?: Player;
  submitLabel: string;
  onSubmit: (input: NewPlayer) => void;
}

export function PlayerForm({ initial, submitLabel, onSubmit }: PlayerFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [strength, setStrength] = useState(initial?.strength ?? DEFAULT_STRENGTH);
  const [inGame, setInGame] = useState(initial?.inGame ?? true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSubmit({ name: trimmedName, strength, inGame });
    if (!initial) {
      setName("");
      setStrength(DEFAULT_STRENGTH);
      setInGame(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Nome</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome do jogador"
          required
          className="min-h-11 rounded-xl border border-foreground/20 bg-background px-3 text-base outline-none focus:border-foreground/50"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Força</span>
        <StrengthPicker value={strength} onChange={setStrength} />
      </div>

      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          checked={inGame}
          onChange={(event) => setInGame(event.target.checked)}
          className="size-5 accent-green-600"
        />
        <span className="text-base">Está no jogo</span>
      </label>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
