"use client";

import { useState } from "react";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useMatchScore } from "@/hooks/use-match-score";
import { TEAM_COLORS, type TeamColor } from "@/lib/types";

// Slug → Tailwind swatch. White gets a border so it stays visible on the
// light background; the rest are solid.
const COLOR_SWATCH: Record<TeamColor, string> = {
  blue: "bg-blue-500",
  red: "bg-red-600",
  green: "bg-green-600",
  yellow: "bg-yellow-400",
  black: "bg-black",
  white: "bg-white border border-foreground/30",
  orange: "bg-orange-500",
  purple: "bg-purple-600",
};

const COLOR_LABEL: Record<TeamColor, string> = {
  blue: "Azul",
  red: "Vermelho",
  green: "Verde",
  yellow: "Amarelo",
  black: "Preto",
  white: "Branco",
  orange: "Laranja",
  purple: "Roxo",
};

export function MatchScore() {
  const { score, addGoal, removeGoal, setColor, reset } = useMatchScore();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Placar — toque para editar"
        className="flex min-h-20 items-center justify-center gap-4 rounded-2xl border border-foreground/15 px-4 active:opacity-80"
      >
        <span
          aria-hidden
          className={`size-6 shrink-0 rounded-full ${COLOR_SWATCH[score.home.color]}`}
        />
        <span className="font-mono text-4xl font-bold tabular-nums">
          {score.home.goals}
        </span>
        <span className="text-2xl text-foreground/40">—</span>
        <span className="font-mono text-4xl font-bold tabular-nums">
          {score.away.goals}
        </span>
        <span
          aria-hidden
          className={`size-6 shrink-0 rounded-full ${COLOR_SWATCH[score.away.color]}`}
        />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Placar">
        <div className="flex flex-col gap-5">
          <TeamControls
            label="Time 1"
            color={score.home.color}
            goals={score.home.goals}
            onColor={(color) => setColor("home", color)}
            onAdd={() => addGoal("home")}
            onRemove={() => removeGoal("home")}
          />
          <div className="h-px bg-foreground/10" />
          <TeamControls
            label="Time 2"
            color={score.away.color}
            goals={score.away.goals}
            onColor={(color) => setColor("away", color)}
            onAdd={() => addGoal("away")}
            onRemove={() => removeGoal("away")}
          />

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={reset}>
              <RotateCcw size={18} aria-hidden />
              Zerar placar
            </Button>
            <Button onClick={() => setOpen(false)}>
              <X size={18} aria-hidden />
              Fechar
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

interface TeamControlsProps {
  label: string;
  color: TeamColor;
  goals: number;
  onColor: (color: TeamColor) => void;
  onAdd: () => void;
  onRemove: () => void;
}

function TeamControls({
  label,
  color,
  goals,
  onColor,
  onAdd,
  onRemove,
}: TeamControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground/70">{label}</span>

      <div className="flex flex-wrap gap-2">
        {TEAM_COLORS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onColor(option)}
            aria-label={COLOR_LABEL[option]}
            aria-pressed={color === option}
            className={`size-8 rounded-full ${COLOR_SWATCH[option]} ${
              color === option
                ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                : ""
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover gol do ${label}`}
          className="flex size-12 items-center justify-center rounded-full border border-foreground/20 active:bg-foreground/10"
        >
          <Minus size={22} aria-hidden />
        </button>
        <span className="min-w-12 text-center font-mono text-4xl font-bold tabular-nums">
          {goals}
        </span>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Adicionar gol ao ${label}`}
          className="flex size-12 items-center justify-center rounded-full border border-foreground/20 active:bg-foreground/10"
        >
          <Plus size={22} aria-hidden />
        </button>
      </div>
    </div>
  );
}
