"use client";

import { useState } from "react";
import { Pause, Play, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { useMatchState } from "@/hooks/use-match-state";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { playWhistle } from "@/lib/audio/whistle-player";

const DURATION_OPTIONS_MIN = [
  ...Array.from({ length: 15 }, (_, i) => i + 1),
  20, 25, 30, 35, 40, 45, 50, 55, 60,
];

function formatTime(ms: number, rounding: "up" | "down"): string {
  const totalSeconds =
    rounding === "up" ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function MatchTimer() {
  const match = useMatchState(() => playWhistle("long"));
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingAddTime, setConfirmingAddTime] = useState(false);

  const isRunning = match.status === "running";
  const isFinished = match.status === "finished";

  // Keep the referee's screen awake while the clock is running.
  useWakeLock(isRunning);

  return (
    <section
      aria-label="Timer da partida"
      className="flex flex-col items-center gap-4 rounded-2xl border border-foreground/10 p-4 sm:p-5"
    >
      <div className="flex flex-col items-center gap-1">
        <p
          role="timer"
          className={`font-mono text-[clamp(3rem,19vw,4.5rem)] font-bold tabular-nums ${
            isFinished ? "text-red-600" : ""
          }`}
        >
          {formatTime(match.remainingMs, "up")}
        </p>
        <p className="text-sm text-foreground/50">
          Decorrido: {formatTime(match.elapsedMs, "down")}
        </p>
        {isFinished && (
          <p className="font-semibold text-red-600">Fim do tempo!</p>
        )}
      </div>

      <div className="flex w-full flex-col gap-2">
        {isRunning ? (
          <Button className="w-full" onClick={match.pause}>
            <Pause size={18} aria-hidden />
            Pausar
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={match.start}
            disabled={isFinished}
          >
            <Play size={18} aria-hidden />
            Iniciar
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            className="min-w-0"
            onClick={() => setConfirmingAddTime(true)}
          >
            <Plus size={18} aria-hidden className="shrink-0" />
            1 min
          </Button>
          <Button
            variant="secondary"
            className="min-w-0"
            onClick={() => setConfirmingReset(true)}
          >
            <RotateCcw size={18} aria-hidden className="shrink-0" />
            Resetar
          </Button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <span className="font-medium">Duração:</span>
        <Select
          value={match.durationMin}
          disabled={match.status !== "idle"}
          onChange={(event) => match.setDuration(Number(event.target.value))}
          className="min-h-9 py-0"
        >
          {DURATION_OPTIONS_MIN.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} min
            </option>
          ))}
        </Select>
      </label>

      <ConfirmDialog
        open={confirmingReset}
        title="Resetar timer"
        message="Tem certeza que deseja resetar o tempo da partida?"
        confirmLabel="Resetar"
        destructive
        onConfirm={() => {
          match.reset();
          setConfirmingReset(false);
        }}
        onCancel={() => setConfirmingReset(false)}
      />

      <ConfirmDialog
        open={confirmingAddTime}
        title="Adicionar tempo"
        message="Adicionar 1 minuto ao tempo da partida?"
        confirmLabel="+1 min"
        onConfirm={() => {
          match.addTime(60_000);
          setConfirmingAddTime(false);
        }}
        onCancel={() => setConfirmingAddTime(false)}
      />
    </section>
  );
}
