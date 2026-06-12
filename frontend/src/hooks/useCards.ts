import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useCards(categoryId?: string) {
  return useQuery({
    queryKey: ["cards", categoryId ?? "all"],
    queryFn: () => api.getCards(categoryId),
    staleTime: 0,
  });
}

export function useDifficultCards() {
  return useQuery({
    queryKey: ["cards", "difficult"],
    queryFn: api.getDifficultCards,
    staleTime: 0,
  });
}
