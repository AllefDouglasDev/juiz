"use client";

import { playWhistle, type WhistleType } from "@/lib/audio/whistle-player";

const WHISTLES: { type: WhistleType; label: string; icon: string }[] = [
  { type: "short", label: "Curto", icon: "🔉" },
  { type: "double", label: "Duplo", icon: "🔊" },
  { type: "long", label: "Longo", icon: "📢" },
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
          <span aria-hidden className="text-2xl">
            {whistle.icon}
          </span>
          {whistle.label}
        </button>
      ))}
    </section>
  );
}
