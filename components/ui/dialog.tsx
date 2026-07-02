"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // Clicks on the dialog element itself land on the ::backdrop area.
    if (event.target === ref.current) {
      onClose();
    }
  }

  return (
    // Tailwind preflight zeroes margins, so m-auto restores native centering.
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={handleBackdropClick}
      className="m-auto w-[min(90vw,24rem)] rounded-2xl bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-4 p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
