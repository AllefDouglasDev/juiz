import type { NewPlayer, Player } from "@/lib/types";

// A merge plan produced by the import UI after the user resolves name
// conflicts: brand-new players to create, and existing players (matched by id)
// whose data should be overwritten.
export interface ResolvedImport {
  toCreate: NewPlayer[];
  toUpdate: { id: string; data: NewPlayer }[];
}

// Async by design: a future API-backed implementation must be a drop-in
// replacement (swap only the factory in lib/repositories/index.ts).
export interface PlayerRepository {
  list(): Promise<Player[]>;
  create(input: NewPlayer): Promise<Player>;
  update(id: string, patch: Partial<NewPlayer>): Promise<Player>;
  remove(id: string): Promise<void>;
  // Applies a resolved import in a single write. Inputs must already be
  // validated (see lib/players/player-validation).
  importPlayers(resolved: ResolvedImport): Promise<void>;
  // Removes every player.
  clear(): Promise<void>;
}
