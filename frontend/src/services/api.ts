import { Card, Category } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

export const api = {
  getCategories(): Promise<Category[]> {
    return request<Category[]>("/categories");
  },

  getCards(categoryId?: string): Promise<Card[]> {
    const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
    return request<Card[]>(`/cards${qs}`);
  },

  getDifficultCards(): Promise<Card[]> {
    return request<Card[]>("/cards/difficult");
  },

  searchCards(query: string): Promise<Card[]> {
    return request<Card[]>(`/cards/search?q=${encodeURIComponent(query)}`);
  },

  reviewCard(id: string, known: boolean): Promise<Card> {
    return request<Card>(`/cards/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ known }),
    });
  },
};
