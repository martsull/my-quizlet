export interface CategoryWithCount {
  id: string;
  name: string;
  description: string | null;
  count: number;
  lastReorganizedAt: Date | null;
  createdAt: Date;
}

export interface CardDto {
  id: string;
  english: string;
  russian: string;
  pronunciation: string | null;
  exampleEn: string | null;
  exampleRu: string | null;
  categoryId: string | null;
  categoryName: string | null;
  difficulty: number;
  successCount: number;
  failureCount: number;
  lastReviewedAt: Date | null;
  createdAt: Date;
}

export interface ReviewPayload {
  known: boolean;
}

export interface SearchResult {
  cards: CardDto[];
  total: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface CardFilters extends PaginationParams {
  categoryId?: string;
  minDifficulty?: number;
  query?: string;
}
