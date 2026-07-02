"use client";

import { useState, type FormEvent } from "react";
import { Cloud, CloudOff, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import {
  addToHistory,
  EMPTY_HISTORY,
  normalizeWorkspaceCode,
  WORKSPACE_ENABLED_KEY,
  WORKSPACE_HISTORY_KEY,
  WORKSPACE_KEY,
} from "@/lib/sync/workspace";

const NO_CODE = "";

const STATUS_BADGE = {
  "no-code": {
    icon: Smartphone,
    label: "Somente neste aparelho",
    className: "text-foreground/60",
  },
  connecting: {
    icon: Loader2,
    label: "Conectando…",
    className: "text-foreground/60",
  },
  connected: {
    icon: Cloud,
    label: "Conectado — dados compartilhados",
    className: "text-green-600",
  },
  offline: {
    icon: CloudOff,
    label: "Sem internet — usando dados deste aparelho",
    className: "text-amber-600",
  },
} as const;

export function SettingsScreen() {
  const [savedCode, setSavedCode] = useLocalStorageState(WORKSPACE_KEY, NO_CODE);
  const [enabled, setEnabled] = useLocalStorageState(
    WORKSPACE_ENABLED_KEY,
    true
  );
  const [history, setHistory] = useLocalStorageState(
    WORKSPACE_HISTORY_KEY,
    EMPTY_HISTORY
  );
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const status = useSyncStatus();

  const value = draft ?? savedCode;
  const badge = STATUS_BADGE[status];
  const BadgeIcon = badge.icon;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed === "") {
      setSavedCode(NO_CODE);
      setDraft(null);
      setError(null);
      return;
    }
    const code = normalizeWorkspaceCode(trimmed);
    if (!code) {
      setError(
        "Use de 4 a 64 caracteres: letras minúsculas, números, hífen ou underline."
      );
      return;
    }
    setSavedCode(code);
    setHistory((prev) => addToHistory(prev, code));
    setDraft(null);
    setError(null);
  }

  function activate(code: string) {
    setSavedCode(code);
    setEnabled(true);
    setHistory((prev) => addToHistory(prev, code));
    setDraft(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Configurações</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Código do racha</span>
          <input
            type="text"
            value={value}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            placeholder="ex.: racha-dos-primos"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-11 rounded-xl border border-foreground/20 bg-background px-3 text-base outline-none focus:border-foreground/50"
          />
          <span className="text-sm text-foreground/50">
            Todos os celulares com o mesmo código compartilham jogadores,
            sorteio e cronômetro. Deixe vazio para usar só este aparelho.
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit">Salvar</Button>
      </form>

      <div className="flex flex-col gap-1">
        <Checkbox
          label="Sincronização ativa"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        <span className="text-sm text-foreground/50">
          Desmarque para usar só este aparelho, mesmo com um código salvo.
        </span>
      </div>

      <div
        aria-live="polite"
        className={`flex items-center gap-2 text-sm ${badge.className}`}
      >
        <BadgeIcon
          size={18}
          aria-hidden
          className={status === "connecting" ? "animate-spin" : undefined}
        />
        {badge.label}
      </div>

      {history.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Rachas recentes</span>
          <ul className="flex flex-col gap-2">
            {history.map((code) => {
              const isCurrent = code === savedCode;
              return (
                <li
                  key={code}
                  className="flex items-center justify-between gap-3 rounded-xl border border-foreground/15 px-3 py-2"
                >
                  <span className="truncate text-base">{code}</span>
                  {isCurrent ? (
                    <span className="shrink-0 text-sm text-foreground/50">
                      atual
                    </span>
                  ) : (
                    <Button
                      variant="secondary"
                      className="shrink-0 px-3"
                      onClick={() => activate(code)}
                    >
                      Ativar
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {savedCode !== "" && !isFirebaseConfigured() && (
        <p className="text-sm text-amber-600">
          A sincronização está indisponível nesta versão do app (Firebase não
          configurado no build). Os dados continuam salvos neste aparelho.
        </p>
      )}
    </div>
  );
}
