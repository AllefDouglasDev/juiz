"use client";

import { Star } from "lucide-react";
import type { Strength } from "@/lib/types";

const STRENGTH_LEVELS: Strength[] = [1, 2, 3, 4, 5];

interface StrengthPickerProps {
  value: Strength;
  onChange: (value: Strength) => void;
}

export function StrengthPicker({ value, onChange }: StrengthPickerProps) {
  return (
    <div role="radiogroup" aria-label="Força do jogador" className="flex gap-1">
      {STRENGTH_LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          role="radio"
          aria-checked={value === level}
          aria-label={`Força ${level}`}
          onClick={() => onChange(level)}
          className={`flex size-11 items-center justify-center rounded-xl active:bg-foreground/10 ${
            level <= value ? "text-amber-500" : "text-foreground/25"
          }`}
        >
          <Star size={26} fill="currentColor" strokeWidth={0} aria-hidden />
        </button>
      ))}
    </div>
  );
}
