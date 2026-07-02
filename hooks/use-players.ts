"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlayerRepository, type ResolvedImport } from "@/lib/repositories";
import type { NewPlayer } from "@/lib/types";

export const PLAYERS_QUERY_KEY = ["players"] as const;

export function usePlayers() {
  return useQuery({
    queryKey: PLAYERS_QUERY_KEY,
    queryFn: () => getPlayerRepository().list(),
  });
}

function useInvalidatePlayers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: PLAYERS_QUERY_KEY });
}

export function useAddPlayer() {
  const invalidate = useInvalidatePlayers();
  return useMutation({
    mutationFn: (input: NewPlayer) => getPlayerRepository().create(input),
    onSuccess: invalidate,
  });
}

export function useUpdatePlayer() {
  const invalidate = useInvalidatePlayers();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewPlayer> }) =>
      getPlayerRepository().update(id, patch),
    onSuccess: invalidate,
  });
}

export function useDeletePlayer() {
  const invalidate = useInvalidatePlayers();
  return useMutation({
    mutationFn: (id: string) => getPlayerRepository().remove(id),
    onSuccess: invalidate,
  });
}

export function useImportPlayers() {
  const invalidate = useInvalidatePlayers();
  return useMutation({
    mutationFn: (resolved: ResolvedImport) =>
      getPlayerRepository().importPlayers(resolved),
    onSuccess: invalidate,
  });
}

export function useClearPlayers() {
  const invalidate = useInvalidatePlayers();
  return useMutation({
    mutationFn: () => getPlayerRepository().clear(),
    onSuccess: invalidate,
  });
}
