import { readJSON, writeJSON } from "@/lib/storage/local-storage";
import type { NewPlayer, Player } from "@/lib/types";
import type { PlayerRepository } from "./player-repository";

const STORAGE_KEY = "juiz:players";

export class LocalStoragePlayerRepository implements PlayerRepository {
  async list(): Promise<Player[]> {
    return readJSON<Player[]>(STORAGE_KEY, []);
  }

  async create(input: NewPlayer): Promise<Player> {
    const players = await this.list();
    const player: Player = { ...input, id: crypto.randomUUID() };
    writeJSON(STORAGE_KEY, [...players, player]);
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
    writeJSON(STORAGE_KEY, next);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const players = await this.list();
    writeJSON(
      STORAGE_KEY,
      players.filter((player) => player.id !== id)
    );
  }
}
