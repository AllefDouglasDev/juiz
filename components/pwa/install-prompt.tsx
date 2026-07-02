"use client";

import { useSyncExternalStore } from "react";
import { Share, Smartphone, X } from "lucide-react";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";

const emptySubscribe = () => () => {};

type InstallTarget = "ios" | "none";

// iOS Safari never fires beforeinstallprompt — installing is a manual
// Share → "Add to Home Screen" flow, so we show instructions instead.
function getInstallTarget(): InstallTarget {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true);
  return isIOS && !isStandalone ? "ios" : "none";
}

export function InstallPrompt() {
  const target = useSyncExternalStore(
    emptySubscribe,
    getInstallTarget,
    () => "none" as InstallTarget
  );
  const [dismissed, setDismissed] = useLocalStorageState(
    "juiz:install-prompt-dismissed",
    false
  );

  if (target === "none" || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-foreground/10 bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
      <div className="flex items-start gap-3">
        <Smartphone size={24} aria-hidden className="shrink-0" />
        <p className="flex-1 text-sm">
          <strong>Instale o app:</strong> toque em{" "}
          <span aria-label="Compartilhar">
            <Share size={16} aria-hidden className="inline align-text-bottom" />{" "}
            Compartilhar
          </span>{" "}
          e depois em <strong>&ldquo;Adicionar à Tela de Início&rdquo;</strong>.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dispensar aviso de instalação"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground/50 active:bg-foreground/10"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}
