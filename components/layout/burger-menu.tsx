"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const menuItems = [
  { href: "/", label: "Iniciar Partida", icon: "⏱️" },
  { href: "/players", label: "Jogadores", icon: "👥" },
  { href: "/draw", label: "Sortear Times", icon: "🎲" },
] as const;

export function BurgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        className="flex size-11 items-center justify-center rounded-xl active:bg-foreground/10"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {/* Portal escapes the header's backdrop-blur, which would otherwise
          trap this fixed overlay inside the header's containing block. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <nav
              aria-label="Menu principal"
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-background pt-[env(safe-area-inset-top)] shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
                <span className="text-lg font-semibold">Menu</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                  className="flex size-11 items-center justify-center rounded-xl text-xl active:bg-foreground/10"
                >
                  ✕
                </button>
              </div>
              <ul className="flex flex-col p-2">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-base active:bg-foreground/10"
                    >
                      <span aria-hidden>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>,
          document.body
        )}
    </>
  );
}
