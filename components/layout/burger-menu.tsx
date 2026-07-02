"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Dices,
  Menu,
  Settings,
  Timer,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { AppCredits } from "./app-credits";

const menuItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Iniciar Partida", icon: Timer },
  { href: "/players", label: "Jogadores", icon: Users },
  { href: "/draw", label: "Sortear Times", icon: Dices },
  { href: "/settings", label: "Configurações", icon: Settings },
];

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
        <Menu size={24} aria-hidden />
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
                  className="flex size-11 items-center justify-center rounded-xl active:bg-foreground/10"
                >
                  <X size={22} aria-hidden />
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
                      <item.icon size={20} aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <footer className="mt-auto border-t border-foreground/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <AppCredits />
              </footer>
            </nav>
          </div>,
          document.body
        )}
    </>
  );
}
