"use client";

import { useState } from "react";
import { Megaphone, Users } from "lucide-react";
import { TeamsDialog } from "./teams-dialog";
import { playWhistle } from "@/lib/audio/whistle-player";

export function WhistleButtons() {
  const [teamsOpen, setTeamsOpen] = useState(false);

  return (
    <>
      <section aria-label="Apito e times" className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => playWhistle("long")}
          className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border border-foreground/10 text-base font-semibold active:bg-foreground/10"
        >
          <Megaphone size={28} aria-hidden />
          Longo
        </button>
        <button
          type="button"
          onClick={() => setTeamsOpen(true)}
          className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border border-foreground/10 text-base font-semibold active:bg-foreground/10"
        >
          <Users size={28} aria-hidden />
          Times
        </button>
      </section>

      <TeamsDialog open={teamsOpen} onClose={() => setTeamsOpen(false)} />
    </>
  );
}
