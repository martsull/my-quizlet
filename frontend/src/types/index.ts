export interface Category {
  id: string;
  name: string;
  description: string | null;
  count: number;
  lastReorganizedAt: string | null;
  createdAt: string;
}

export interface Card {
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
  lastReviewedAt: string | null;
  createdAt: string;
}

export type StudyMode = "category" | "all" | "difficult";

export interface StudySession {
  queue: Card[];
  currentIndex: number;
  knownCount: number;
  totalCards: number;
  isComplete: boolean;
}
