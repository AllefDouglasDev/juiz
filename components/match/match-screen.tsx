"use client";

import { useEffect, useState } from "react";
import { RectangleVertical } from "lucide-react";
import { CardOverlay, type CardColor } from "./card-overlay";
import { MatchTimer } from "./match-timer";
import { WhistleButtons } from "./whistle-buttons";
import { AppCredits } from "@/components/layout/app-credits";
import { initWhistlePlayer } from "@/lib/audio/whistle-player";

export function MatchScreen() {
  const [card, setCard] = useState<CardColor | null>(null);

  // Unlock the AudioContext and preload the whistle sounds on the very
  // first touch anywhere, so the first whistle tap plays instantly.
  useEffect(() => {
    const unlock = () => initWhistlePlayer();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <MatchTimer />

      <WhistleButtons />

      <section aria-label="Cartões" className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setCard("yellow")}
          className="flex min-h-24 items-center justify-center gap-2 rounded-2xl bg-yellow-400 text-lg font-bold text-black active:opacity-80"
        >
          <RectangleVertical size={26} fill="currentColor" aria-hidden />
          Amarelo
        </button>
        <button
          type="button"
          onClick={() => setCard("red")}
          className="flex min-h-24 items-center justify-center gap-2 rounded-2xl bg-red-600 text-lg font-bold text-white active:opacity-80"
        >
          <RectangleVertical size={26} fill="currentColor" aria-hidden />
          Vermelho
        </button>
      </section>

      <footer className="mt-auto flex justify-center pt-2">
        <AppCredits />
      </footer>

      <CardOverlay card={card} onDismiss={() => setCard(null)} />
    </div>
  );
}
