"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import type { DrawSettings } from "@/lib/types";

const TEAM_COUNT_OPTIONS = [2, 3, 4, 5, 6, 7, 8];
const PLAYERS_PER_TEAM_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

interface DrawControlsProps {
  settings: DrawSettings;
  onChange: (settings: DrawSettings) => void;
  onDraw: () => void;
  inGameCount: number;
}

export function DrawControls({
  settings,
  onChange,
  onDraw,
  inGameCount,
}: DrawControlsProps) {
  const capacity = settings.teamCount * settings.playersPerTeam;
  const leftOut = Math.max(0, inGameCount - capacity);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-foreground/10 p-4">
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium">Times</span>
          <Select
            value={settings.teamCount}
            onChange={(event) =>
              onChange({ ...settings, teamCount: Number(event.target.value) })
            }
          >
            {TEAM_COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium">Jogadores por time</span>
          <Select
            value={settings.playersPerTeam}
            onChange={(event) =>
              onChange({
                ...settings,
                playersPerTeam: Number(event.target.value),
              })
            }
          >
            {PLAYERS_PER_TEAM_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <Checkbox
        label="Usar força dos jogadores (times equilibrados)"
        checked={settings.useStrength}
        onChange={(event) =>
          onChange({ ...settings, useStrength: event.target.checked })
        }
      />

      <Button onClick={onDraw} disabled={inGameCount === 0}>
        Sortear times
      </Button>

      {inGameCount === 0 && (
        <p className="text-center text-sm text-foreground/50">
          Nenhum jogador no jogo. Adicione jogadores abaixo.
        </p>
      )}
      {leftOut > 0 && (
        <p className="text-center text-sm text-amber-600 dark:text-amber-400">
          {leftOut} {leftOut === 1 ? "jogador fica" : "jogadores ficam"} de fora
          neste sorteio ({inGameCount} no jogo, {capacity} vagas).
        </p>
      )}
    </section>
  );
}
