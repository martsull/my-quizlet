import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => api.searchCards(query),
    enabled: query.trim().length > 0,
    staleTime: 1000 * 30,
  });
}
