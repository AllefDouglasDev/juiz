"use client";

import { Megaphone, Volume1, Volume2, type LucideIcon } from "lucide-react";
import { playWhistle, type WhistleType } from "@/lib/audio/whistle-player";

const WHISTLES: { type: WhistleType; label: string; icon: LucideIcon }[] = [
  { type: "short", label: "Curto", icon: Volume1 },
  { type: "double", label: "Duplo", icon: Volume2 },
  { type: "long", label: "Longo", icon: Megaphone },
];

export function WhistleButtons() {
  return (
    <section aria-label="Apitos" className="grid grid-cols-3 gap-3">
      {WHISTLES.map((whistle) => (
        <button
          key={whistle.type}
          type="button"
          onClick={() => playWhistle(whistle.type)}
          className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border border-foreground/10 text-base font-semibold active:bg-foreground/10"
        >
          <whistle.icon size={28} aria-hidden />
          {whistle.label}
        </button>
      ))}
    </section>
  );
}
