import { getStoredValue, setStoredValue } from "@/lib/storage/local-store";
import type { NewPlayer, Player } from "@/lib/types";
import type { PlayerRepository, ResolvedImport } from "./player-repository";

const STORAGE_KEY = "juiz:players";
const NO_PLAYERS: Player[] = [];

export class LocalStoragePlayerRepository implements PlayerRepository {
  async list(): Promise<Player[]> {
    return getStoredValue<Player[]>(STORAGE_KEY, NO_PLAYERS);
  }

  async create(input: NewPlayer): Promise<Player> {
    const players = await this.list();
    const player: Player = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setStoredValue(STORAGE_KEY, [...players, player]);
    return player;
  }

  async update(id: string, patch: Partial<NewPlayer>): Promise<Player> {
    const players = await this.list();
    const index = players.findIndex((player) => player.id === id);
    if (index === -1) {
      throw new Error(`Player not found: ${id}`);
    }
    const updated: Player = { ...players[index], ...patch };
    const next = [...players];
    next[index] = updated;
    setStoredValue(STORAGE_KEY, next);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const players = await this.list();
    setStoredValue(
      STORAGE_KEY,
      players.filter((player) => player.id !== id)
    );
  }

  async importPlayers(resolved: ResolvedImport): Promise<void> {
    const players = await this.list();
    // Overwrite matched players in place, keeping their id/createdAt (and their
    // position in the list).
    const byId = new Map(players.map((player) => [player.id, player]));
    for (const { id, data } of resolved.toUpdate) {
      const existing = byId.get(id);
      if (existing) byId.set(id, { ...existing, ...data });
    }
    const now = Date.now();
    const created: Player[] = resolved.toCreate.map((input, index) => ({
      ...input,
      id: crypto.randomUUID(),
      // Nudge createdAt per index so imported players keep their file order.
      createdAt: now + index,
    }));
    setStoredValue(STORAGE_KEY, [...byId.values(), ...created]);
  }

  async clear(): Promise<void> {
    setStoredValue(STORAGE_KEY, NO_PLAYERS);
  }
}
