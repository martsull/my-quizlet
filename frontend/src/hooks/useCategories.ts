import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: api.getCategories,
    staleTime: 1000 * 60 * 5,
  });
}
