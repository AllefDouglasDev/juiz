import { LocalStoragePlayerRepository } from "./local-storage-player-repository";
import type { PlayerRepository } from "./player-repository";

let repository: PlayerRepository | null = null;

// Single swap point for a future shared-database implementation.
export function getPlayerRepository(): PlayerRepository {
  repository ??= new LocalStoragePlayerRepository();
  return repository;
}

export type { PlayerRepository };
