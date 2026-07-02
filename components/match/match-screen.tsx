"use client";

import { useState } from "react";
import { CardOverlay, type CardColor } from "./card-overlay";
import { MatchTimer } from "./match-timer";
import { WhistleButtons } from "./whistle-buttons";

export function MatchScreen() {
  const [card, setCard] = useState<CardColor | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <MatchTimer />

      <WhistleButtons />

      <section aria-label="Cartões" className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setCard("yellow")}
          className="flex min-h-24 items-center justify-center rounded-2xl bg-yellow-400 text-lg font-bold text-black active:opacity-80"
        >
          🟨 Amarelo
        </button>
        <button
          type="button"
          onClick={() => setCard("red")}
          className="flex min-h-24 items-center justify-center rounded-2xl bg-red-600 text-lg font-bold text-white active:opacity-80"
        >
          🟥 Vermelho
        </button>
      </section>

      <CardOverlay card={card} onDismiss={() => setCard(null)} />
    </div>
  );
}
