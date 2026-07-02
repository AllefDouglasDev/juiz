"use client";

import { createPortal } from "react-dom";

export type CardColor = "yellow" | "red";

interface CardOverlayProps {
  card: CardColor | null;
  onDismiss: () => void;
}

export function CardOverlay({ card, onDismiss }: CardOverlayProps) {
  if (!card) return null;

  return createPortal(
    <button
      type="button"
      onClick={onDismiss}
      aria-label={
        card === "yellow" ? "Cartão amarelo — toque para fechar" : "Cartão vermelho — toque para fechar"
      }
      className={`fixed inset-0 z-[60] flex w-full flex-col items-center justify-end pb-[max(2rem,env(safe-area-inset-bottom))] ${
        card === "yellow" ? "bg-yellow-400" : "bg-red-600"
      }`}
    >
      <span className="text-sm font-medium text-black/40">
        Toque para voltar
      </span>
    </button>,
    document.body
  );
}
