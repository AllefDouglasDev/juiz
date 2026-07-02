"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { useCountdown } from "@/hooks/use-countdown";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { playWhistle } from "@/lib/audio/whistle-player";

const DEFAULT_DURATION_MIN = 10;
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
  const [durationMin, setDurationMin] = useLocalStorageState(
    "juiz:timer:duration",
    DEFAULT_DURATION_MIN
  );
  const countdown = useCountdown(durationMin * 60_000, () =>
    playWhistle("long")
  );
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingAddTime, setConfirmingAddTime] = useState(false);

  const isRunning = countdown.status === "running";
  const isFinished = countdown.status === "finished";

  return (
    <section
      aria-label="Timer da partida"
      className="flex flex-col items-center gap-4 rounded-2xl border border-foreground/10 p-5"
    >
      <div className="flex flex-col items-center gap-1">
        <p
          role="timer"
          className={`font-mono text-7xl font-bold tabular-nums ${
            isFinished ? "text-red-600" : ""
          }`}
        >
          {formatTime(countdown.remainingMs, "up")}
        </p>
        <p className="text-sm text-foreground/50">
          Decorrido: {formatTime(countdown.elapsedMs, "down")}
        </p>
        {isFinished && (
          <p className="font-semibold text-red-600">Fim do tempo!</p>
        )}
      </div>

      <div className="flex w-full gap-3">
        {isRunning ? (
          <Button className="flex-1" onClick={countdown.pause}>
            ⏸ Pausar
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={countdown.start}
            disabled={isFinished}
          >
            ▶ Iniciar
          </Button>
        )}
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setConfirmingAddTime(true)}
        >
          +1 min
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setConfirmingReset(true)}
        >
          Resetar
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <span className="font-medium">Duração:</span>
        <Select
          value={durationMin}
          disabled={countdown.status !== "idle"}
          onChange={(event) => setDurationMin(Number(event.target.value))}
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
          countdown.reset();
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
          countdown.addTime(60_000);
          setConfirmingAddTime(false);
        }}
        onCancel={() => setConfirmingAddTime(false)}
      />
    </section>
  );
}
