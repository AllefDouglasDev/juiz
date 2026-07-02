import type { NewPlayer, Player } from "@/lib/types";

// Async by design: a future API-backed implementation must be a drop-in
// replacement (swap only the factory in lib/repositories/index.ts).
export interface PlayerRepository {
  list(): Promise<Player[]>;
  create(input: NewPlayer): Promise<Player>;
  update(id: string, patch: Partial<NewPlayer>): Promise<Player>;
  remove(id: string): Promise<void>;
}
